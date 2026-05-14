# Get-Metrics.ps1 - Métricas de PC sin servidor
# Ejecutar: .\get-metrics.ps1

Write-Host "`n🖥️  MÉTRICAS DEL PC - $(Get-Date)`n" -ForegroundColor Cyan
Write-Host ("="*50) -ForegroundColor Gray

# CPU
Write-Host "`n💻 CPU:" -ForegroundColor Cyan
$cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3
$cpuAvg = ($cpu.CounterSamples | Measure-Object CookedValue -Average).Average
Write-Host "  Uso actual: $($cpuAvg.ToString('0.0'))%" -ForegroundColor $(if($cpuAvg -gt 80){'Red'}elseif($cpuAvg -gt 50){'Yellow'}else{'Green'})

$cpuInfo = Get-CimInstance Win32_Processor
Write-Host "  Procesador: $($cpuInfo.Name)" -ForegroundColor Gray
Write-Host "  Núcleos: $($cpuInfo.NumberOfCores) | Lógicos: $($cpuInfo.NumberOfLogicalProcessors)" -ForegroundColor Gray

# RAM
Write-Host "`n🧠 RAM:" -ForegroundColor Cyan
$ram = Get-CimInstance Win32_OperatingSystem
$ramTotalGB = [math]::Round($ram.TotalVisibleMemorySize / 1MB, 2)
$ramFreeGB = [math]::Round($ram.FreePhysicalMemory / 1MB, 2)
$ramUsedGB = $ramTotalGB - $ramFreeGB
$ramPercent = [math]::Round(($ramUsedGB / $ramTotalGB) * 100, 1)

Write-Host "  Total: $ramTotalGB GB" -ForegroundColor Gray
Write-Host "  Usada: $ramUsedGB GB ($ramPercent%)" -ForegroundColor $(if($ramPercent -gt 80){'Red'}elseif($ramPercent -gt 70){'Yellow'}else{'Green'})
Write-Host "  Libre: $ramFreeGB GB" -ForegroundColor Green

# Disco
Write-Host "`n💾 Disco C:\:" -ForegroundColor Cyan
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$diskTotalGB = [math]::Round($disk.Size / 1GB, 2)
$diskFreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
$diskUsedGB = $diskTotalGB - $diskFreeGB
$diskPercent = [math]::Round(($diskUsedGB / $diskTotalGB) * 100, 1)

Write-Host "  Total: $diskTotalGB GB" -ForegroundColor Gray
Write-Host "  Usado: $diskUsedGB GB ($diskPercent%)" -ForegroundColor $(if($diskPercent -gt 90){'Red'}elseif($diskPercent -gt 70){'Yellow'}else{'Green'})
Write-Host "  Libre: $diskFreeGB GB" -ForegroundColor Green

# Red
Write-Host "`n🌐 Red:" -ForegroundColor Cyan
$net = Get-CimInstance Win32_PerfFormattedData_Tcpip_NetworkInterface | Where-Object { $_.BytesTotalPersec -gt 0 } | Select-Object -First 1
if ($net) {
    $rxMB = [math]::Round($net.BytesReceivedPersec / 1MB, 2)
    $txMB = [math]::Round($net.BytesSentPersec / 1MB, 2)
    Write-Host "  Recibido: $rxMB MB/s" -ForegroundColor Green
    Write-Host "  Enviado: $txMB MB/s" -ForegroundColor Blue
}

# Procesos TOP
Write-Host "`n🔥 Top 5 Procesos por CPU:" -ForegroundColor Cyan
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 | Format-Table -Property Name, Id, @{Label="CPU(s)"; Expression={[math]::Round($_.CPU, 2)}}, @{Label="RAM(MB)"; Expression={[math]::Round($_.WorkingSet / 1MB, 2)}} -AutoSize

# Temperatura (si está disponible)
Write-Host "`n🌡️  Temperatura:" -ForegroundColor Cyan
try {
    $temp = Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($temp) {
        $celsius = [math]::Round(($temp.CurrentTemperature - 2732) / 10.0, 1)
        Write-Host "  CPU: $celsius °C" -ForegroundColor $(if($celsius -gt 80){'Red'}elseif($celsius -gt 60){'Yellow'}else{'Green'})
    } else {
        Write-Host "  No disponible en este sistema" -ForegroundColor Gray
    }
} catch {
    Write-Host "  No disponible en este sistema" -ForegroundColor Gray
}

Write-Host "`n" -ForegroundColor Gray
Write-Host ("="*50) -ForegroundColor Gray
