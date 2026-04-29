# ============================================
# SCRIPT: DETENER ENTORNO DE DESARROLLO
# Sistema de Evaluación Diagnóstica SEP - SiCRER
# ============================================
# Autor: Equipo de Desarrollo
# Última actualización: 18 de marzo de 2026
# Descripción: Detiene todos los procesos de Node.js y Angular CLI
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DETENIENDO SISTEMA EIA - SEP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. BUSCAR PROCESOS NODE.JS
# ============================================
Write-Host "[1/3] Buscando procesos de Node.js..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   [INFO] Encontrados $($nodeProcesses.Count) proceso(s) de Node.js" -ForegroundColor Cyan
    
    foreach ($proc in $nodeProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force
            Write-Host "   [OK] Detenido proceso Node.js (PID: $($proc.Id))" -ForegroundColor Green
        } catch {
            Write-Host "   [!] No se pudo detener proceso $($proc.Id)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [INFO] No hay procesos de Node.js corriendo" -ForegroundColor Gray
}

# ============================================
# 2. BUSCAR PROCESOS ANGULAR CLI (ng)
# ============================================
Write-Host "`n[2/3] Buscando procesos de Angular CLI..." -ForegroundColor Yellow

# Angular CLI puede aparecer como node.exe o ng.cmd, ya lo cubrimos arriba
# Pero verificamos puertos específicos

$ports = @(4000, 4200)
$processesKilled = 0

foreach ($port in $ports) {
    $tcpConnection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    
    if ($tcpConnection) {
        $processId = $tcpConnection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            try {
                Stop-Process -Id $processId -Force
                Write-Host "   [OK] Liberado puerto $port (PID: $processId)" -ForegroundColor Green
                $processesKilled++
            } catch {
                Write-Host "   [!] No se pudo liberar puerto $port" -ForegroundColor Yellow
            }
        }
    }
}

if ($processesKilled -eq 0) {
    Write-Host "   [INFO] Puertos 4000 y 4200 ya estan libres" -ForegroundColor Gray
}

# ============================================
# 3. VERIFICAR LIMPIEZA
# ============================================
Write-Host "`n[3/3] Verificando limpieza..." -ForegroundColor Yellow

$remainingNode = Get-Process -Name node -ErrorAction SilentlyContinue

if ($remainingNode) {
    Write-Host "   [!] Aun quedan $($remainingNode.Count) proceso(s) de Node.js" -ForegroundColor Yellow
    Write-Host "   Puede que algunos sean de otras aplicaciones" -ForegroundColor Gray
} else {
    Write-Host "   [OK] Todos los procesos detenidos correctamente" -ForegroundColor Green
}

# Verificar puertos
$port4000 = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
$port4200 = Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue

Write-Host "`n   Puerto 4000 (Backend):  " -NoNewline -ForegroundColor Gray
if ($port4000) {
    Write-Host "[!] Aun ocupado" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Libre" -ForegroundColor Green
}

Write-Host "   Puerto 4200 (Frontend): " -NoNewline -ForegroundColor Gray
if ($port4200) {
    Write-Host "[!] Aun ocupado" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Libre" -ForegroundColor Green
}

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   SERVICIOS DETENIDOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar nuevamente: " -NoNewline -ForegroundColor Yellow
Write-Host '.\start-dev.ps1' -ForegroundColor White
Write-Host ""
