# Desinstalar Servicio de Métricas
# Requiere: PowerShell como Administrador

$serviceName = "ConfimaxMetrics"
$installDir = "C:\Confimax\Metrics"
$nssmPath = "$installDir\nssm.exe"

Write-Host "`n🛑 Desinstalando Servicio de Métricas`n" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Verificar permisos
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ ERROR: Se requieren permisos de Administrador" -ForegroundColor Red
    exit 1
}

# Detener y eliminar servicio
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "🛑 Deteniendo servicio..." -ForegroundColor Yellow
    if (Test-Path $nssmPath) {
        & $nssmPath stop $serviceName 2>$null
        Start-Sleep -Seconds 2
        & $nssmPath remove $serviceName confirm 2>$null
    } else {
        Stop-Service $serviceName -Force 2>$null
        sc.exe delete $serviceName 2>$null
    }
    Write-Host "✅ Servicio eliminado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  El servicio no existe" -ForegroundColor Gray
}

# Eliminar regla de firewall
$firewallRule = Get-NetFirewallRule -DisplayName "Confimax Metrics" -ErrorAction SilentlyContinue
if ($firewallRule) {
    Write-Host "🔥 Eliminando regla de firewall..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Confimax Metrics"
    Write-Host "✅ Regla de firewall eliminada" -ForegroundColor Green
}

# Preguntar si eliminar directorio
if (Test-Path $installDir) {
    $response = Read-Host "`n¿Eliminar directorio $installDir? (S/N)"
    if ($response -eq 'S' -or $response -eq 's') {
        Remove-Item $installDir -Recurse -Force
        Write-Host "✅ Directorio eliminado" -ForegroundColor Green
    }
}

Write-Host "`n✅ Servicio desinstalado correctamente" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Gray
