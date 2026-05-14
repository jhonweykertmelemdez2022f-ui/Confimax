# WMI-Metrics.ps1 - Exportar métricas a JSON para integración
param(
    [string]$OutputPath = "$env:TEMP\pc-metrics.json"
)

$metrics = @{
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
    system = @{}
    cpu = @{}
    memory = @{}
    disk = @()
    network = @()
    processes = @()
}

# Información del sistema
$os = Get-CimInstance Win32_OperatingSystem
$metrics.system = @{
    computerName = $env:COMPUTERNAME
    osName = $os.Caption
    osVersion = $os.Version
    architecture = $os.OSArchitecture
    uptime = (Get-Date) - $os.LastBootUpTime | Select-Object Days, Hours, Minutes
}

# CPU detallado
$cpu = Get-CimInstance Win32_Processor
$cpuCounter = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1
$metrics.cpu = @{
    name = $cpu.Name
    manufacturer = $cpu.Manufacturer
    cores = $cpu.NumberOfCores
    logicalProcessors = $cpu.NumberOfLogicalProcessors
    maxClockSpeed = $cpu.MaxClockSpeed
    usagePercent = [math]::Round($cpuCounter.CounterSamples[0].CookedValue, 2)
    loadPercentage = $cpu.LoadPercentage
}

# Memoria detallada
$ram = Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
$metrics.memory = @{
    totalGB = [math]::Round($ram.Sum / 1GB, 2)
    totalSlots = $ram.Count
    availableGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    usedGB = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 2)
    usagePercent = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 2)
    virtualTotalGB = [math]::Round($os.TotalVirtualMemorySize / 1MB, 2)
    virtualAvailableGB = [math]::Round($os.FreeVirtualMemory / 1MB, 2)
}

# Discos
$disks = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
foreach ($disk in $disks) {
    $total = [math]::Round($disk.Size / 1GB, 2)
    $free = [math]::Round($disk.FreeSpace / 1GB, 2)
    $used = $total - $free
    $percent = if ($total -gt 0) { [math]::Round(($used / $total) * 100, 2) } else { 0 }
    
    $metrics.disk += @{
        drive = $disk.DeviceID
        label = $disk.VolumeName
        totalGB = $total
        usedGB = $used
        freeGB = $free
        usagePercent = $percent
        fileSystem = $disk.FileSystem
    }
}

# Red
$adapters = Get-CimInstance Win32_PerfFormattedData_Tcpip_NetworkInterface | 
    Where-Object { $_.BytesTotalPersec -gt 0 -or $_.CurrentBandwidth -gt 0 }

foreach ($adapter in $adapters) {
    $metrics.network += @{
        name = $adapter.Name
        bytesReceivedPerSec = $adapter.BytesReceivedPersec
        bytesSentPerSec = $adapter.BytesSentPersec
        bytesTotalPerSec = $adapter.BytesTotalPersec
        packetsReceived = $adapter.PacketsReceivedPersec
        packetsSent = $adapter.PacketsSentPersec
        currentBandwidth = $adapter.CurrentBandwidth
    }
}

# Top 10 procesos
$processes = Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10
foreach ($proc in $processes) {
    $metrics.processes += @{
        name = $proc.ProcessName
        id = $proc.Id
        cpuTime = [math]::Round($proc.CPU, 2)
        workingSetMB = [math]::Round($proc.WorkingSet / 1MB, 2)
        pagedMemoryMB = [math]::Round($proc.PagedMemorySize / 1MB, 2)
        threads = $proc.Threads.Count
        handles = $proc.HandleCount
    }
}

# Guardar JSON
$json = $metrics | ConvertTo-Json -Depth 10
$json | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "✅ Métricas guardadas en: $OutputPath" -ForegroundColor Green
Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
Write-Host "  CPU: $($metrics.cpu.usagePercent)%" -ForegroundColor $(if($metrics.cpu.usagePercent -gt 80){'Red'}elseif($metrics.cpu.usagePercent -gt 50){'Yellow'}else{'Green'})
Write-Host "  RAM: $($metrics.memory.usagePercent)% ($($metrics.memory.usedGB)GB / $($metrics.memory.totalGB)GB)" -ForegroundColor $(if($metrics.memory.usagePercent -gt 80){'Red'}elseif($metrics.memory.usagePercent -gt 70){'Yellow'}else{'Green'})
Write-Host "  Discos: $($metrics.disk.Count) unidades" -ForegroundColor Gray

return $metrics
