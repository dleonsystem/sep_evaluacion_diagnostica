# ============================================
# SCRIPT: VERIFICAR ESTADO DEL SISTEMA
# Sistema de Evaluación Diagnóstica SEP - SiCRER
# ============================================
# Autor: Equipo de Desarrollo
# Última actualización: 18 de marzo de 2026
# Descripción: Verifica el estado de todos los servicios del sistema
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   📊 ESTADO DEL SISTEMA EIA - SEP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. NODE.JS
# ============================================
Write-Host "━━━ Node.js ━━━" -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "   ✅ Instalado: " -NoNewline -ForegroundColor Green
        Write-Host "$nodeVersion" -ForegroundColor White
        
        # Verificar si es versión correcta (18.x o 20.x)
        if ($nodeVersion -match "v1[89]\.|v20\.") {
            Write-Host "   ✅ Versión compatible (LTS)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Versión no LTS (recomendado: v18 o v20)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ No instalado" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error al verificar Node.js" -ForegroundColor Red
}

# NPM
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "   ✅ npm: " -NoNewline -ForegroundColor Green
        Write-Host "$npmVersion" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
}

# ============================================
# 2. ANGULAR CLI
# ============================================
Write-Host "`n━━━ Angular CLI ━━━" -ForegroundColor Yellow
try {
    $ngVersion = ng version 2>&1
    if ($ngVersion -match "Angular CLI: (\d+\.\d+\.\d+)") {
        Write-Host "   ✅ Instalado: " -NoNewline -ForegroundColor Green
        Write-Host "$($matches[1])" -ForegroundColor White
    } else {
        Write-Host "   ❌ No instalado" -ForegroundColor Red
        Write-Host "   Instalar con: npm install -g @angular/cli" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ No instalado o no encontrado en PATH" -ForegroundColor Red
}

# ============================================
# 3. POSTGRESQL
# ============================================
Write-Host "`n━━━ PostgreSQL ━━━" -ForegroundColor Yellow

$pgService = Get-Service *postgres* -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq 'Running') {
        Write-Host "   ✅ Servicio: " -NoNewline -ForegroundColor Green
        Write-Host "Corriendo ($($pgService.Name))" -ForegroundColor White
    } else {
        Write-Host "   ⚠️  Servicio: " -NoNewline -ForegroundColor Yellow
        Write-Host "$($pgService.Status) (no está corriendo)" -ForegroundColor White
    }
    
    # Intentar conectar a la base de datos
    try {
        $pgVersion = psql -U postgres -d eia_db -c "SELECT version();" -t 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Base de datos 'eia_db': Accesible" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Base de datos 'eia_db': No accesible" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  No se pudo verificar la conexión a la BD" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ PostgreSQL no encontrado como servicio" -ForegroundColor Red
}

# ============================================
# 4. BACKEND GRAPHQL (Puerto 4000)
# ============================================
Write-Host "`n━━━ Backend GraphQL (Puerto 4000) ━━━" -ForegroundColor Yellow

# Verificar puerto
$port4000 = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue

if ($port4000) {
    $processId = $port4000.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Host "   ✅ Puerto 4000: " -NoNewline -ForegroundColor Green
    Write-Host "ESCUCHANDO (PID: $processId)" -ForegroundColor White
    
    # Verificar endpoint health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Health Check: " -NoNewline -ForegroundColor Green
            Write-Host "OK (HTTP $($response.StatusCode))" -ForegroundColor White
        }
    } catch {
        Write-Host "   ⚠️  Health Check: No responde" -ForegroundColor Yellow
    }
    
    # Verificar endpoint GraphQL
    try {
        $responseGQL = Invoke-WebRequest -Uri "http://localhost:4000/graphql" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ GraphQL Endpoint: " -NoNewline -ForegroundColor Green
        Write-Host "Accesible" -ForegroundColor White
    } catch {
        Write-Host "   ⚠️  GraphQL Endpoint: No responde" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Puerto 4000: NO ESCUCHANDO" -ForegroundColor Red
    Write-Host "   Backend GraphQL no está corriendo" -ForegroundColor Gray
}

# ============================================
# 5. FRONTEND ANGULAR (Puerto 4200)
# ============================================
Write-Host "`n━━━ Frontend Angular (Puerto 4200) ━━━" -ForegroundColor Yellow

# Verificar puerto
$port4200 = Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue

if ($port4200) {
    $processId = $port4200.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Host "   ✅ Puerto 4200: " -NoNewline -ForegroundColor Green
    Write-Host "ESCUCHANDO (PID: $processId)" -ForegroundColor White
    
    # Verificar aplicación
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Aplicación Web: " -NoNewline -ForegroundColor Green
            Write-Host "Accesible (HTTP $($response.StatusCode))" -ForegroundColor White
        }
    } catch {
        Write-Host "   ⚠️  Aplicación Web: No responde" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Puerto 4200: NO ESCUCHANDO" -ForegroundColor Red
    Write-Host "   Frontend Angular no está corriendo" -ForegroundColor Gray
}

# ============================================
# 6. PROCESOS NODE.JS ACTIVOS
# ============================================
Write-Host "`n━━━ Procesos Node.js Activos ━━━" -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   📊 Total de procesos Node.js: $($nodeProcesses.Count)" -ForegroundColor Cyan
    
    $nodeProcesses | ForEach-Object {
        $mem = [math]::Round($_.WorkingSet64 / 1MB, 2)
        Write-Host "      • PID: $($_.Id) | RAM: $mem MB" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  No hay procesos de Node.js corriendo" -ForegroundColor Gray
}

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   📝 RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Contar servicios activos
$servicesActive = 0
$servicesTotal = 4

if ($nodeVersion) { $servicesActive++ }
if ($pgService -and $pgService.Status -eq 'Running') { $servicesActive++ }
if ($port4000) { $servicesActive++ }
if ($port4200) { $servicesActive++ }

Write-Host ""
Write-Host "   Servicios activos: $servicesActive de $servicesTotal" -ForegroundColor $(if ($servicesActive -eq $servicesTotal) { 'Green' } else { 'Yellow' })
Write-Host ""

if ($servicesActive -eq $servicesTotal) {
    Write-Host "   ✅ SISTEMA COMPLETAMENTE OPERATIVO" -ForegroundColor Green
    Write-Host ""
    Write-Host "   🌐 URLs de acceso:" -ForegroundColor Cyan
    Write-Host "      • Backend:  http://localhost:4000/graphql" -ForegroundColor White
    Write-Host "      • Frontend: http://localhost:4200" -ForegroundColor White
} elseif ($servicesActive -gt 0) {
    Write-Host "   ⚠️  SISTEMA PARCIALMENTE OPERATIVO" -ForegroundColor Yellow
    Write-Host "   Algunos servicios no están corriendo" -ForegroundColor Gray
} else {
    Write-Host "   ❌ SISTEMA NO OPERATIVO" -ForegroundColor Red
    Write-Host "   Ejecuta .\start-dev.ps1 para iniciar" -ForegroundColor Gray
}

Write-Host ""
