#Requires -Version 7
<#
.SYNOPSIS
    Build and deploy Confimax microservices stack with Docker Compose.
.DESCRIPTION
    Builds Docker images for all services and starts the stack with
    API Gateway and optional Tailscale VPN.
.PARAMETER EnvFile
    Path to .env file (default: .env)
.PARAMETER Build
    Force rebuild images
.PARAMETER Tailscale
    Enable Tailscale VPN container
.EXAMPLE
    .\scripts\build-and-deploy.ps1 -Build
    .\scripts\build-and-deploy.ps1 -EnvFile .env.production
#>
param(
    [string]$EnvFile = ".env",
    [switch]$Build,
    [switch]$Tailscale
)

$ErrorActionPreference = "Stop"
$ComposeFile = "docker-compose.yml"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CONFIMAX - Docker Build & Deploy       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verify .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Warning "Env file not found: $EnvFile"
    Write-Host "Creating from .env.example..."
    Copy-Item ".env.example" $EnvFile
}

# Select services
$services = @(
    "auth-service",
    "sales-service",
    "inventory-service",
    "customers-service",
    "notifications-service",
    "api-gateway"
)

if ($Tailscale) {
    $services += "tailscale"
}

# Build images
if ($Build) {
    Write-Host "`n[1/3] Building Docker images..." -ForegroundColor Green
    foreach ($svc in $services) {
        Write-Host "  -> Building $svc" -ForegroundColor Gray
    }
    docker compose -f $ComposeFile --env-file $EnvFile build @services
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
}

# Start stack
Write-Host "`n[2/3] Starting Docker Compose stack..." -ForegroundColor Green
docker compose -f $ComposeFile --env-file $EnvFile up -d @services
if ($LASTEXITCODE -ne 0) { throw "Start failed" }

# Health check
Write-Host "`n[3/3] Running health checks..." -ForegroundColor Green
Start-Sleep -Seconds 5

$healthEndpoints = @{
    "api-gateway"       = "http://localhost:${env:GATEWAY_PORT:-8080}/health"
    "auth-service"      = "http://localhost:3001/health"
    "inventory-service" = "http://localhost:3002/health"
    "sales-service"     = "http://localhost:3003/health"
    "customers-service" = "http://localhost:3004/health"
}

foreach ($svc in $healthEndpoints.Keys) {
    $url = $healthEndpoints[$svc]
    try {
        $resp = Invoke-RestMethod -Uri $url -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "  [OK] $svc -> $($resp.status)" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] $svc -> unreachable" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Stack deployed successfully!            " -ForegroundColor Cyan
Write-Host " API Gateway: http://localhost:8080       " -ForegroundColor Cyan
if ($Tailscale) {
    Write-Host " Tailscale:  docker logs confimax-tailscale" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
