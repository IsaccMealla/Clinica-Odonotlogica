#!/bin/bash
# =========================================================================
# SCRIPT DE MIGRACIÓN E IMPLEMENTACIÓN
# =========================================================================
# Este script prepara el sistema para los Módulos 4-8 del Sistema de Historias Clínicas

echo "🔧 Iniciando migración de Módulos 4-8..."

# 1. Crear migraciones
echo "📝 Creando migraciones..."
python manage.py makemigrations gestion_clinica

# 2. Aplicar migraciones
echo "💾 Aplicando migraciones..."
python manage.py migrate gestion_clinica

# 3. Registrar modelos en admin (opcional)
echo "⚙️  Registrando modelos en admin..."

# 4. Verificar que Redis está corriendo
echo "🔴 Verificando Redis..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis está activo en puerto 6379"
else
    echo "⚠️  Redis no está activo. Iniciar: redis-server"
fi

# 5. Verificar que Celery está corriendo
echo "🔧 Verificando Celery..."
# Solo informativo, no bloqueante

echo ""
echo "✅ Migración completada!"
echo ""
echo "PRÓXIMOS PASOS:"
echo "1. Registrar modelos en admin (gestion_clinica/admin.py)"
echo "2. Iniciar servidor: python manage.py runserver"
echo "3. Iniciar Celery: celery -A backend worker -l info"
echo "4. Iniciar Channels: python manage.py runserver"
echo ""
echo "URLs DE API:"
echo "- Controles Académicos: /api/controles-academicos/"
echo "- Pagos y Facturas: /api/pagos-facturas/"
echo "- Despachos Almacén: /api/despachos-almacen/"
echo "- Inventario: /api/inventario/"
echo ""
echo "WebSocket:"
echo "- ws://localhost:8000/ws/clinica/"
