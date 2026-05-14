# Instalar Servicio de Métricas de Windows - Se ejecuta automáticamente
# Requiere: PowerShell como Administrador

$serviceName = "ConfimaxMetrics"
$serviceDisplay = "Confimax PC Metrics Service"
$port = 9182
$installDir = "C:\Confimax\Metrics"
$scriptPath = "$installDir\metrics-service.ps1"

function Write-ColorOutput($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "`n🚀 Instalando Servicio de Métricas Automático`n" "Cyan"
Write-ColorOutput "================================================" "Gray"

# Verificar permisos de admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-ColorOutput "`n❌ ERROR: Se requieren permisos de Administrador" "Red"
    Write-ColorOutput "   Click derecho en PowerShell → 'Ejecutar como administrador'" "Yellow"
    exit 1
}

# Crear directorio
Write-ColorOutput "`n📁 Creando directorio: $installDir" "Cyan"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

# Crear script del servicio
Write-ColorOutput "📝 Creando script del servicio..." "Cyan"
$serviceScript = @'
# Confimax Metrics Service - Ejecuta automáticamente en segundo plano
$port = 9182
$metricsFile = "$env:TEMP\metrics-service.log"

function Get-Metrics {
    try {
        # CPU
        $cpu = (Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue
        
        # RAM
        $ram = Get-CimInstance Win32_OperatingSystem
        $ramTotal = $ram.TotalVisibleMemorySize * 1024
        $ramFree = $ram.FreePhysicalMemory * 1024
        $ramUsed = $ramTotal - $ramFree
        $ramPercent = ($ramUsed / $ramTotal) * 100
        
        # Disco C:
        $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
        $diskTotal = $disk.Size
        $diskFree = $disk.FreeSpace
        $diskUsed = $diskTotal - $diskFree
        $diskPercent = ($diskUsed / $diskTotal) * 100
        
        # Formato Prometheus
        $metrics = @"
# HELP windows_cpu_usage_percent CPU usage percentage
# TYPE windows_cpu_usage_percent gauge
windows_cpu_usage_percent $([math]::Round($cpu, 2))

# HELP windows_memory_total_bytes Total memory in bytes
# TYPE windows_memory_total_bytes gauge
windows_memory_total_bytes $ramTotal

# HELP windows_memory_used_bytes Used memory in bytes
# TYPE windows_memory_used_bytes gauge
windows_memory_used_bytes $ramUsed

# HELP windows_memory_free_bytes Free memory in bytes
# TYPE windows_memory_free_bytes gauge
windows_memory_free_bytes $ramFree

# HELP windows_memory_usage_percent Memory usage percentage
# TYPE windows_memory_usage_percent gauge
windows_memory_usage_percent $([math]::Round($ramPercent, 2))

# HELP windows_disk_total_bytes Total disk space in bytes
# TYPE windows_disk_total_bytes gauge
windows_disk_total_bytes $diskTotal

# HELP windows_disk_used_bytes Used disk space in bytes
# TYPE windows_disk_used_bytes gauge
windows_disk_used_bytes $diskUsed

# HELP windows_disk_free_bytes Free disk space in bytes
# TYPE windows_disk_free_bytes gauge
windows_disk_free_bytes $diskFree

# HELP windows_disk_usage_percent Disk usage percentage
# TYPE windows_disk_usage_percent gauge
windows_disk_usage_percent $([math]::Round($diskPercent, 2))
"@
        return $metrics
    } catch {
        return "# Error obteniendo métricas: $($_.Exception.Message)"
    }
}

# Crear listener HTTP
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")

# Agregar firewall rule
$firewallRule = Get-NetFirewallRule -DisplayName "Confimax Metrics" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "Confimax Metrics" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port | Out-Null
}

try {
    $listener.Start()
    "$(Get-Date) - Servicio iniciado en puerto $port" | Out-File -Append $metricsFile
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        
        if ($context.Request.Url.PathAndQuery -eq '/metrics') {
            $metrics = Get-Metrics
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($metrics)
            $response.ContentType = 'text/plain; version=0.0.4; charset=utf-8'
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $message = "Not Found - Use /metrics"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($message)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
    "$(Get-Date) - Servicio detenido" | Out-File -Append $metricsFile
}
'@

$serviceScript | Out-File -FilePath $scriptPath -Encoding UTF8

# Descargar NSSM (Non-Sucking Service Manager) si no existe
$nssmPath = "$installDir\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-ColorOutput "📥 Descargando NSSM (Service Manager)..." "Cyan"
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $zipPath = "$env:TEMP\nssm.zip"
    
    try {
        Invoke-WebRequest -Uri $nssmUrl -OutFile $zipPath -UseBasicParsing
        Expand-Archive -Path $zipPath -DestinationPath "$env:TEMP\nssm" -Force
        Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" $nssmPath -Force
        Remove-Item $zipPath -Force
        Remove-Item "$env:TEMP\nssm" -Recurse -Force
    } catch {
        Write-ColorOutput "⚠️  No se pudo descargar NSSM automáticamente" "Yellow"
        Write-ColorOutput "   Descarga manual: https://nssm.cc/download" "Yellow"
        exit 1
    }
}

# Detener y eliminar servicio existente
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-ColorOutput "🛑 Deteniendo servicio existente..." "Yellow"
    & $nssmPath stop $serviceName 2>$null
    & $nssmPath remove $serviceName confirm 2>$null
    Start-Sleep -Seconds 2
}

# Instalar nuevo servicio
Write-ColorOutput "🔧 Instalando servicio '$serviceDisplay'..." "Cyan"
& $nssmPath install $serviceName "powershell.exe" "-ExecutionPolicy Bypass -File `"$scriptPath`""
& $nssmPath set $serviceName DisplayName $serviceDisplay
& $nssmPath set $serviceName Description "Servicio automático de métricas de sistema para Confimax"
& $nssmPath set $serviceName Start SERVICE_AUTO_START

# Iniciar servicio
Write-ColorOutput "▶️ Iniciando servicio..." "Cyan"
& $nssmPath start $serviceName

# Verificar instalación
Start-Sleep -Seconds 3
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service -and $service.Status -eq 'Running') {
    Write-ColorOutput "`n✅ SERVICIO INSTALADO Y EJECUTANDO" "Green"
    Write-ColorOutput "================================================" "Gray"
    Write-ColorOutput "Servicio: $serviceDisplay" "White"
    Write-ColorOutput "Estado: $($service.Status)" "Green"
    Write-ColorOutput "URL: http://localhost:$port/metrics" "White"
    Write-ColorOutput "`n🌐 Prueba en navegador:" "Cyan"
    Write-ColorOutput "   http://localhost:$port/metrics" "Yellow"
    Write-ColorOutput "`n🔄 El servicio se iniciará AUTOMÁTICAMENTE con Windows" "Green"
    Write-ColorOutput "📊 Disponible para Grafana 24/7" "Green"
    
    # Probar endpoint
    try {
        $test = Invoke-WebRequest -Uri "http://localhost:$port/metrics" -UseBasicParsing -TimeoutSec 5
        Write-ColorOutput "`n✅ Endpoint respondiendo correctamente!" "Green"
        Write-ColorOutput "   Status: $($test.StatusCode)" "Gray"
    } catch {
        Write-ColorOutput "`n⚠️  Endpoint no responde aún (espera 5-10 segundos)" "Yellow"
    }
} else {
    Write-ColorOutput "`n❌ ERROR: El servicio no se inició correctamente" "Red"
    Write-ColorOutput "   Estado: $($service.Status)" "Red"
}

Write-ColorOutput "`n📋 Comandos útiles:" "Cyan"
Write-ColorOutput "   Ver estado: Get-Service $serviceName" "Gray"
Write-ColorOutput "   Detener: & '$nssmPath' stop $serviceName" "Gray"
Write-ColorOutput "   Iniciar: & '$nssmPath' start $serviceName" "Gray"
Write-ColorOutput "   Eliminar: & '$nssmPath' remove $serviceName confirm" "Gray"
