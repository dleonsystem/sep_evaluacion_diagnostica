# ============================================
# SCRIPT: INICIAR ENTORNO DE DESARROLLO
# Sistema de Evaluación Diagnóstica SEP - SiCRER
# ============================================
# Autor: Equipo de Desarrollo
# Última actualización: 18 de marzo de 2026
# Descripción: Inicia backend GraphQL y frontend Angular en ventanas separadas
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO SISTEMA EIA - SEP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuración
$BackendPath = "$PSScriptRoot\graphql-server"
$FrontendPath = "$PSScriptRoot\web\frontend"
$BackendUrl = "http://localhost:4000"
$FrontendUrl = "http://localhost:4200"

# ============================================
# 1. VERIFICAR POSTGRESQL
# ============================================
Write-Host "[1/6] Verificando PostgreSQL..." -ForegroundColor Yellow

$pgService = Get-Service *postgres* -ErrorAction SilentlyContinue

if (-not $pgService) {
    Write-Host "   [!] PostgreSQL no encontrado como servicio" -ForegroundColor Red
    Write-Host "   Verifica que PostgreSQL esté instalado correctamente" -ForegroundColor Red
} elseif ($pgService.Status -ne 'Running') {
    Write-Host "   [!] Iniciando servicio PostgreSQL..." -ForegroundColor Yellow
    try {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "   [OK] PostgreSQL iniciado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Error al iniciar PostgreSQL" -ForegroundColor Red
        Write-Host "   Inicia PostgreSQL manualmente o ejecuta como Administrador" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [OK] PostgreSQL ya esta corriendo" -ForegroundColor Green
}

# ============================================
# 2. VERIFICAR DIRECTORIOS
# ============================================
Write-Host "`n[2/6] Verificando directorios del proyecto..." -ForegroundColor Yellow

if (-not (Test-Path $BackendPath)) {
    Write-Host "   [ERROR] No se encuentra el directorio del backend: $BackendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "   [ERROR] No se encuentra el directorio del frontend: $FrontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "   [OK] Directorios verificados correctamente" -ForegroundColor Green

# ============================================
# 3. COMPILAR BACKEND (SI ES NECESARIO)
# ============================================
Write-Host "`n[3/6] Verificando compilacion del backend..." -ForegroundColor Yellow

$DistPath = Join-Path $BackendPath "dist"

if (-not (Test-Path $DistPath)) {
    Write-Host "   [!] Backend no compilado. Compilando ahora..." -ForegroundColor Yellow
    Set-Location $BackendPath
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [ERROR] Error al compilar el backend" -ForegroundColor Red
        exit 1
    }
    Set-Location $PSScriptRoot
    Write-Host "   [OK] Backend compilado exitosamente" -ForegroundColor Green
} else {
    Write-Host "   [OK] Backend ya compilado (carpeta dist/ existe)" -ForegroundColor Green
}

# ============================================
# 4. INICIAR BACKEND GRAPHQL
# ============================================
Write-Host "`n[4/6] Iniciando Backend GraphQL..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$BackendPath'; Write-Host '[BACKEND] GraphQL Server' -ForegroundColor Cyan; npm start" `
    -WindowStyle Normal

Write-Host "   [...] Esperando 5 segundos para que el backend inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Verificar si el backend responde
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   [OK] Backend iniciado correctamente en $BackendUrl" -ForegroundColor Green
} catch {
    Write-Host "   [!] Backend iniciando... (puede tardar unos segundos mas)" -ForegroundColor Yellow
}

# ============================================
# 5. INICIAR FRONTEND ANGULAR
# ============================================
Write-Host "`n[5/6] Iniciando Frontend Angular..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$FrontendPath'; Write-Host '[FRONTEND] Angular App' -ForegroundColor Cyan; ng serve" `
    -WindowStyle Normal

Write-Host "   [...] Esperando 35 segundos para que Angular compile..." -ForegroundColor Gray
Start-Sleep -Seconds 35

# ============================================
# 6. ABRIR NAVEGADOR
# ============================================
Write-Host "`n[6/6] Abriendo navegador..." -ForegroundColor Yellow
Start-Process "$FrontendUrl/carga-masiva"

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   SISTEMA INICIADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend GraphQL:  $BackendUrl/graphql" -ForegroundColor Cyan
Write-Host "Frontend Angular: $FrontendUrl" -ForegroundColor Cyan
Write-Host "API Docs:         $BackendUrl/api-docs" -ForegroundColor Cyan
Write-Host "Health Check:     $BackendUrl/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener todo, ejecuta: " -NoNewline -ForegroundColor Yellow
Write-Host '.\stop-dev.ps1' -ForegroundColor White
Write-Host "Para ver el estado: " -NoNewline -ForegroundColor Yellow
Write-Host '.\status-dev.ps1' -ForegroundColor White
Write-Host ""
Write-Host "Presiona Ctrl+C en las ventanas de PowerShell para detener cada servicio" -ForegroundColor Gray
Write-Host ""
