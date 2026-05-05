# Cambios y Mejoras en el Sistema de Citas

## 📋 Resumen de Cambios

Se ha actualizado el sistema de gestión de citas para incluir nuevas funcionalidades y corregir errores. A continuación, se detallan los cambios realizados:

---

## ✅ Errores Corregidos

### 1. **FormularioCita.tsx** - Errores de Tipo TypeScript
**Problema:** El tipo `Cita` no incluía el estado `'CANCELADA'`, causando errores de compilación.

**Solución:**
- Actualizado el tipo `Cita` en `frontend/types/cita.ts` para incluir los estados:
  - `'CANCELADA'`
  - `'FINALIZADO'`
- Corregidas todas las referencias en `FormularioCita.tsx` que verificaban el estado 'CANCELADA'
- Las validaciones ahora excluyen correctamente citas canceladas, finalizadas y no asistidas

**Archivos modificados:**
- ✅ `frontend/types/cita.ts`
- ✅ `frontend/components/citas/FormularioCita.tsx`

---

## 🎯 Nuevas Funcionalidades

### 1. **Estados Adicionales de Cita**
Se agregaron dos nuevos estados al ciclo de vida de una cita:

- **ATENDIENDO** 🏥 - Indica que se está atendiendo al paciente
- **FINALIZADO** ✓ - Indica que la cita ha finalizado correctamente

**Estados completos del sistema:**
```
RESERVADA (📅) → CONFIRMADA (✓) → EN_ESPERA (⏳) → ATENDIENDO (🏥) → FINALIZADO (✓)
                                                      └─ NO_ASISTIO (✗)
                                                      └─ CANCELADA (✗)
```

### 2. **Cambio de Estado con Auditoría**
Ahora puedes cambiar el estado de una cita directamente desde el gestor de citas programadas.

**Cómo usar:**
1. Abre el "Gestor de Citas Programadas"
2. Busca la cita que deseas actualizar
3. Dependiendo del estado actual, verás diferentes botones:
   - **"Llegó"** - Cuando está RESERVADA o CONFIRMADA → Cambia a EN_ESPERA
   - **"Atendiendo"** - Cuando está EN_ESPERA → Cambia a ATENDIENDO
   - **"Finalizado"** - Cuando está ATENDIENDO o EN_ESPERA → Cambia a FINALIZADO

4. El cambio se registra automáticamente en la auditoría con:
   - ✅ Hora exacta del cambio
   - ✅ Usuario que realizó el cambio
   - ✅ Estado anterior y nuevo

### 3. **Sistema de Auditoría Mejorado**
Se ha mejorado el sistema de auditoría para registrar todos los cambios de estado.

**Información registrada:**
- 🆔 ID único del registro
- 📅 Fecha y hora exacta del cambio (incluye segundos)
- 👤 Usuario que realizó el cambio
- 🔄 Estado anterior y estado nuevo
- 📝 Descripción del cambio

**Ejemplo de registro:**
```
Cita: Paciente González
EN_ESPERA → ATENDIENDO
Por: Dr. Juan Pérez
Hora: 2026-05-05 14:35:23
Motivo: Cambio de estado a ATENDIENDO
```

### 4. **Historial de Cambios Visible**
Se agregó un botón **"Historial"** en cada cita que permite ver todos los cambios realizados.

**Cómo usar:**
1. En el gestor de citas, haz clic en el botón **"Historial"**
2. Se abrirá un diálogo mostrando todos los cambios realizados a esa cita
3. Para cada cambio verás:
   - Estados anterior y nuevo
   - Usuario que realizó el cambio
   - Fecha y hora exacta
   - Comentarios adicionales si los hay

---

## 🔧 Cambios Técnicos

### Backend (Django)

#### 1. **Modelo Cita** (`gestion_clinica/models.py`)
```python
ESTADOS_CITA = [
    ('RESERVADA', 'Reservada'),
    ('CONFIRMADA', 'Confirmada'),
    ('EN_ESPERA', 'En Espera'),
    ('ATENDIENDO', 'Atendiendo'),
    ('FINALIZADO', 'Finalizado'),  # ✨ NUEVO
    ('NO_ASISTIO', 'No Asistió'),
    ('CANCELADA', 'Cancelada'),
]
```

#### 2. **ViewSet de Auditoría** (`gestion_clinica/views.py`)
- Cambio de `ReadOnlyModelViewSet` a `ModelViewSet`
- Ahora permite crear nuevos registros de auditoría
- Asigna automáticamente el usuario actual al crear registros

```python
def perform_create(self, serializer):
    """Registra automáticamente el usuario que realiza el cambio"""
    serializer.save(usuario=self.request.user)
```

#### 3. **Migración** (`gestion_clinica/migrations/0016_alter_cita_estado.py`)
- Migración automática creada para actualizar el campo `estado` en la tabla de citas
- Compatible con datos existentes

### Frontend (React/TypeScript)

#### 1. **Tipo Cita** (`frontend/types/cita.ts`)
```typescript
estado: 'RESERVADA' | 'CONFIRMADA' | 'EN_ESPERA' | 'ATENDIENDO' | 'FINALIZADO' | 'NO_ASISTIO' | 'CANCELADA'
```

#### 2. **Nuevo Tipo RegistroAuditoria**
```typescript
interface RegistroAuditoria {
  id: string
  cita: string
  estado_anterior: string
  estado_nuevo: string
  usuario: string
  usuario_nombre: string
  timestamp: string
  comentario?: string
}
```

#### 3. **Componente GestorCitasProgramadas.tsx**
**Nuevas funcionalidades:**
- ✅ Botón "Atendiendo" para cambiar a estado ATENDIENDO
- ✅ Botón "Finalizado" para cambiar a estado FINALIZADO
- ✅ Botón "Historial" para ver todos los cambios
- ✅ Diálogos de confirmación para cada cambio
- ✅ Integración con auditoría automática

**Nuevas funciones:**
- `handleCambiarEstado()` - Cambia el estado de la cita
- `cargarAuditoria()` - Carga el historial de cambios
- `formatFechaAuditoria()` - Formatea fechas con precisión de segundos

---

## 🚀 Endpoints de API

### Citas
- **GET** `/api/citas/` - Listar todas las citas
- **POST** `/api/citas/` - Crear nueva cita
- **PATCH** `/api/citas/{id}/` - Actualizar cita (incluido cambiar estado)

### Auditoría de Citas
- **GET** `/api/auditoria-citas/` - Listar registros de auditoría
  - Filtros: `?cita={cita_id}` - Registros de una cita específica
  - Filtros: `?tipo_cambio=CAMBIO_ESTADO`
- **POST** `/api/auditoria-citas/` - Crear nuevo registro de auditoría

**Ejemplo de creación de auditoría:**
```json
POST /api/auditoria-citas/
{
  "cita": "cita-uuid",
  "tipo_cambio": "CAMBIO_ESTADO",
  "campos_modificados": ["estado"],
  "valores_anteriores": {"estado": "EN_ESPERA"},
  "valores_nuevos": {"estado": "ATENDIENDO"},
  "descripcion": "Cambio de estado de EN_ESPERA a ATENDIENDO"
}
```

---

## 📊 Ejemplo de Flujo Completo

1. **Recepción llama al paciente:**
   - Estado actual: RESERVADA
   - Haz clic en "Llegó"
   - Se notifica al estudiante y cambia a EN_ESPERA
   - Se registra en auditoría

2. **Estudiante comienza la atención:**
   - Estado actual: EN_ESPERA
   - Haz clic en "Atendiendo"
   - Cambia a ATENDIENDO
   - Se registra quién hizo el cambio y cuándo

3. **Se finaliza la cita:**
   - Estado actual: ATENDIENDO
   - Haz clic en "Finalizado"
   - Cambia a FINALIZADO
   - Se registra la hora exacta de finalización

4. **Consultar historial:**
   - Haz clic en "Historial"
   - Ves todos los cambios con timestamps y usuarios

---

## ✨ Beneficios

✅ **Trazabilidad completa** - Cada cambio queda registrado
✅ **Responsabilidad** - Quién hizo cada cambio
✅ **Precisión temporal** - Timestamps con precisión de segundos
✅ **Facilidad de uso** - Interfaz intuitiva con botones contextuales
✅ **Reportes** - Se pueden generar reportes de actividad
✅ **Cumplimiento normativo** - Auditoría para requisitos legales

---

## 📝 Notas Importantes

1. **Permisos de usuario** - Solo usuarios autenticados pueden:
   - Cambiar estado de citas
   - Crear registros de auditoría
   - Ver el historial

2. **Integridad de datos** - El sistema no permite volver atrás en estados, solo avanzar

3. **Notificaciones** - Cuando cambia a EN_ESPERA, se notifica al estudiante automáticamente

4. **Base de datos** - La migración es reversible en caso de necesidad

---

## 🔄 Compatibilidad

- ✅ Compatible con todas las citas existentes
- ✅ Los estados anteriores se mantienen sin cambios
- ✅ No hay pérdida de datos
- ✅ Migración automática aplicada

---

## 🐛 Bugs Corregidos

| Bug | Componente | Solución |
|-----|-----------|----------|
| Error de tipo: 'CANCELADA' no existe | FormularioCita.tsx | Actualizado tipo Cita |
| Error de tipo: múltiples verificaciones de CANCELADA | FormularioCita.tsx | Corregidas todas las referencias |
| ViewSet de auditoría solo lectura | Django | Cambiado a ModelViewSet |
| Sin registro automático de usuario | Django | Agregado perform_create |

---

Fecha de actualización: 2026-05-05
Versión: 1.1.0
