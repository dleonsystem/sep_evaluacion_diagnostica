# ============================================
# SCRIPT: REINICIAR ENTORNO DE DESARROLLO
# Sistema de Evaluación Diagnóstica SEP - SiCRER
# ============================================
# Autor: Equipo de Desarrollo
# Última actualización: 18 de marzo de 2026
# Descripción: Detiene y reinicia todo el sistema
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🔄 REINICIANDO SISTEMA EIA - SEP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# PASO 1: DETENER SERVICIOS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "FASE 1: DETENIENDO SERVICIOS ACTUALES" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Llamar al script de stop (pero sin esperar input)
& "$PSScriptRoot\stop-dev.ps1"

Write-Host "`n⏳ Esperando 3 segundos para que los procesos se detengan completamente..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# ============================================
# PASO 2: VERIFICAR LIMPIEZA
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "FASE 2: VERIFICANDO LIMPIEZA" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$remainingProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($remainingProcesses) {
    Write-Host "⚠️  Aún hay $($remainingProcesses.Count) proceso(s) de Node.js" -ForegroundColor Yellow
    Write-Host "   Intentando forzar detención..." -ForegroundColor Gray
    
    $remainingProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force
            Write-Host "   ✅ Detenido PID: $($_.Id)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  No se pudo detener PID: $($_.Id)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "✅ Limpieza completada" -ForegroundColor Green

# ============================================
# PASO 3: REINICIAR SERVICIOS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "FASE 3: INICIANDO SERVICIOS NUEVAMENTE" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "⏳ Esperando 2 segundos antes de iniciar..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Llamar al script de start
& "$PSScriptRoot\start-dev.ps1"

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ✅ REINICIO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Para verificar el estado: " -NoNewline -ForegroundColor Yellow
Write-Host ".\status-dev.ps1" -ForegroundColor White
Write-Host ""
