# =========================================================================
# SCRIPT DE MIGRACIÓN E IMPLEMENTACIÓN (WINDOWS)
# =========================================================================
# Este script prepara el sistema para los Módulos 4-8 del Sistema de Historias Clínicas
# Ejecutar en PowerShell como Administrador

Write-Host "🔧 Iniciando migración de Módulos 4-8..." -ForegroundColor Green
Write-Host ""

# 1. Crear migraciones
Write-Host "📝 Creando migraciones..." -ForegroundColor Yellow
python manage.py makemigrations gestion_clinica
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en makemigrations" -ForegroundColor Red
    exit 1
}

# 2. Aplicar migraciones
Write-Host "💾 Aplicando migraciones..." -ForegroundColor Yellow
python manage.py migrate gestion_clinica
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en migrate" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Migración completada!" -ForegroundColor Green
Write-Host ""

# Mostrar instrucciones finales
Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Registrar modelos en admin (gestion_clinica/admin.py)"
Write-Host "2. Iniciar servidor: python manage.py runserver"
Write-Host "3. Iniciar Celery: celery -A backend worker -l info"
Write-Host ""

Write-Host "URLs DE API:" -ForegroundColor Cyan
Write-Host "- Controles Académicos: http://localhost:8000/api/controles-academicos/"
Write-Host "- Pagos y Facturas: http://localhost:8000/api/pagos-facturas/"
Write-Host "- Despachos Almacén: http://localhost:8000/api/despachos-almacen/"
Write-Host "- Inventario: http://localhost:8000/api/inventario/"
Write-Host ""

Write-Host "WebSocket:" -ForegroundColor Cyan
Write-Host "- ws://localhost:8000/ws/clinica/"
Write-Host ""
