# Script para crear repositorios en DockerHub
# Requiere: DOCKERHUB_TOKEN con permisos de write

$repos = @(
    "confimax-auth",
    "confimax-customers",
    "confimax-inventory",
    "confimax-sales",
    "confimax-notifications",
    "confimax-nginx",
    "confimax-postgres"
)

$username = "reisita"

foreach ($repo in $repos) {
    Write-Host "Creando repositorio: $username/$repo" -ForegroundColor Green
    
    $body = @{
        namespace = $username
        name = $repo
        description = "Confimax - $repo"
        is_private = $false
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "https://hub.docker.com/v2/repositories/" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body
        Write-Host "✅ Creado: $repo" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Error creando $repo`: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Proceso completado" -ForegroundColor Cyan
Write-Host "Ahora puedes ejecutar: docker push reisita/confimax-auth:latest"
