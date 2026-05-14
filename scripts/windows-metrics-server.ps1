# Windows Metrics Server para Grafana
# Expone métricas de CPU, RAM y Disco en formato Prometheus

$port = 9182
$metricsFile = "$env:TEMP\windows-metrics.prom"

function Get-Metrics {
    # CPU Usage
    $cpu = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
    
    # Memory
    $mem = Get-CimInstance Win32_OperatingSystem
    $memTotal = $mem.TotalVisibleMemorySize * 1024
    $memFree = $mem.FreePhysicalMemory * 1024
    $memUsed = $memTotal - $memFree
    $memPercent = ($memUsed / $memTotal) * 100
    
    # Disk C:
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskTotal = $disk.Size
    $diskFree = $disk.FreeSpace
    $diskUsed = $diskTotal - $diskFree
    $diskPercent = ($diskUsed / $diskTotal) * 100
    
    # Crear métricas en formato Prometheus
    $metrics = @"
# HELP windows_cpu_usage_percent CPU usage percentage
# TYPE windows_cpu_usage_percent gauge
windows_cpu_usage_percent $cpu

# HELP windows_memory_total_bytes Total memory in bytes
# TYPE windows_memory_total_bytes gauge
windows_memory_total_bytes $memTotal

# HELP windows_memory_used_bytes Used memory in bytes
# TYPE windows_memory_memory_used_bytes gauge
windows_memory_used_bytes $memUsed

# HELP windows_memory_free_bytes Free memory in bytes
# TYPE windows_memory_free_bytes gauge
windows_memory_free_bytes $memFree

# HELP windows_memory_usage_percent Memory usage percentage
# TYPE windows_memory_usage_percent gauge
windows_memory_usage_percent $memPercent

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
windows_disk_usage_percent $diskPercent
"@
    
    return $metrics
}

# Crear listener HTTP
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "✅ Windows Metrics Server iniciado en http://localhost:$port/metrics"
Write-Host "Presiona Ctrl+C para detener"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        if ($request.Url.PathAndQuery -eq '/metrics') {
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
    Write-Host "Servidor detenido"
}
