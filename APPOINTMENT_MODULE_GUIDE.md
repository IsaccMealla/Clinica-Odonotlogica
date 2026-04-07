# Guía de Integración: Alertas, Sonidos, Procedimientos y Estadísticas de Abandonos

## 📋 Resumen

Se han implementado cuatro funcionalidades principales para el módulo de agendamiento de citas:

1. **Alertas y Sonidos Clínicos** - Reproducción de sonidos usando Web Audio API
2. **Status Badge Animado** - Componente React con animaciones Framer Motion
3. **Galería de Procedimientos** - Componente multimedia con materiales y tutoriales
4. **Estadísticas de Abandonos (No-Show)** - API endpoints y visualización con Recharts

---

## 🔊 1. ALERTAS Y SONIDOS CLÍNICOS

### Ubicación
- **Backend**: `/frontend/lib/sounds.ts`
- **Componente**: `/frontend/components/status-badge.tsx`

### Importación
```typescript
import { playClinicalSound, playLocalSound, playSequentialSounds } from "@/lib/sounds"
import { StatusBadge, StatusBadgeDot } from "@/components/status-badge"
```

### Función: `playClinicalSound(status)`

La función utiliza Web Audio API para generar tonos diferentes según el estado:

```typescript
// Estados disponibles
type SoundStatus = "arrival" | "warning" | "checkin" | "completed" | "cancelled"

// Uso
playClinicalSound("arrival")   // 800 Hz, 200ms - Ding suave
playClinicalSound("warning")   // 1200 Hz, 300ms - Alerta alta
playClinicalSound("checkin")   // 600 Hz, 250ms - Tono bajo
```

### Parámetros de Sonido

| Estado | Frecuencia | Duración | Tipo | Volumen |
|--------|-----------|----------|------|---------|
| arrival | 800 Hz | 200ms | sine | 0.3 |
| warning | 1200 Hz | 300ms | square | 0.4 |
| checkin | 600 Hz | 250ms | triangle | 0.35 |
| completed | 1000 Hz | 200ms | sine | 0.3 |
| cancelled | 400 Hz | 300ms | sine | 0.25 |

### Uso en el Componente de Citas

```typescript
import { AppointmentCalendar } from "@/components/appointment-calendar"
import { playClinicalSound } from "@/lib/sounds"

export function AppointmentPage() {
  const handlePatientArrival = (appointmentId: string) => {
    playClinicalSound("arrival")
    // Actualizar estado de cita
    updateAppointmentStatus(appointmentId, "waiting")
  }

  const handleCheckIn = (appointmentId: string) => {
    playClinicalSound("checkin")
    // Marcar check-in en API
    appointmentCheckin(appointmentId)
  }

  return (
    <AppointmentCalendar 
      onPatientArrival={handlePatientArrival}
      onCheckIn={handleCheckIn}
    />
  )
}
```

### Función: `StatusBadge`

Componente animado que muestra el estado actual con pulso suave en estados de espera:

```typescript
import { StatusBadge } from "@/components/status-badge"

export function AppointmentStatus({ status }) {
  return (
    // Animación automática de pulso si status === "sala_de_espera"
    <StatusBadge status={status} />
  )
}
```

### Estados soportados

```typescript
type AppointmentStatus =
  | "scheduled"      // Programada (azul)
  | "waiting"        // En Espera (ámbar, pulsante)
  | "sala_de_espera" // Sala de Espera (naranja, pulsante)
  | "in_progress"    // En Progreso (púrpura)
  | "confirmed"      // Confirmada (cian)
  | "completed"      // Completada (verde)
  | "cancelled"      // Cancelada (rojo)
  | "no_show"        // No Asistió (rojo oscuro)
```

### Variante: `StatusBadgeDot`

Versión compacta que muestra solo un punto de color:

```typescript
import { StatusBadgeDot } from "@/components/status-badge"

export function AppointmentCell({ appointment }) {
  return (
    <div className="flex items-center gap-2">
      <StatusBadgeDot status={appointment.status} />
      <span>{appointment.patient_name}</span>
    </div>
  )
}
```

---

## 📚 2. GALERÍA MULTIMEDIA DE PROCEDIMIENTOS

### Ubicación
- **Componente**: `/frontend/components/procedure-media.tsx`

### Importación
```typescript
import { ProcedureMedia } from "@/components/procedure-media"
```

### Uso Básico

```typescript
export function PreOperativePreparation() {
  return (
    <ProcedureMedia 
      procedureType="Cirugía"
      title="Cirugía Oral - Preparación"
      description="Procedimientos quirúrgicos complejos"
    />
  )
}
```

### Tipos de Procedimiento Soportados

| Tipo | Materiales | Descripción |
|------|-----------|-------------|
| Limpieza | Suero, copas goma, pasta | Limpieza y profilaxis |
| Extracción | Anestésico, elevadores, fórceps | Extracción simple/quirúrgica |
| Cirugía | Set quirúrgico, injerto, drenaje | Procedimientos complejos |
| Implante | Implante, abutment, instrumental | Implantes óseo integrados |
| Endodoncia | Limas, gutapercha, cemento | Tratamiento conducto radicular |
| Ortodoncia | Brackets, alambres, ligaduras | Aparatología ortodóncica |

### Estructura de Datos

```typescript
interface ProcedureMediaProps {
  procedureType: ProcedureType
  materials?: Material[]        // Opcional: personalizar materiales
  videoPath?: string           // Opcional: ruta del video
  title?: string               // Opcional: título personalizado
  description?: string         // Opcional: descripción personalizada
}

interface Material {
  name: string
  quantity?: string           // Ej: "500ml", "5 piezas"
  category?: string           // Ej: "Fármaco", "Instrumental"
}
```

### Ejemplo Personalizado

```typescript
export function CustomProcedure() {
  const materials = [
    { name: "Anestésico", quantity: "2 ampolletas", category: "Fármaco" },
    { name: "Bisturi", quantity: "2 piezas", category: "Instrumental" },
    { name: "Gasa estéril", quantity: "20 paquetes", category: "Quirúrgico" },
  ]

  return (
    <ProcedureMedia
      procedureType="Cirugía"
      materials={materials}
      videoPath="/media/procedures/custom-surgery.mp4"
      title="Extracción Quirúrgica Avanzada"
      description="Procedimiento personalizado para casos complejos"
    />
  )
}
```

### Estructura del Componente

El componente incluye dos tabs:

1. **Materiales** - Lista interactiva con categorías y cantidades
2. **Preparación** - Reproductor de video HTML5 con controles

---

## 📊 3. ESTADÍSTICAS DE ABANDONOS (NO-SHOW)

### Backend - Ubicación
- **Tareas Celery**: `/gestion_clinica/tasks.py`
- **Endpoints API**: `/gestion_clinica/views.py`

### Función Celery: `check_appointment_no_shows()`

Se ejecuta automáticamente para marcar citas vencidas como "no_show":

```python
from gestion_clinica.tasks import check_appointment_no_shows

# Lógica:
# - Busca citas con status='scheduled' y start_time < ahora - 20 minutos
# - Actualiza status a 'no_show'
# - Crea registro en AuditLog

# Registrar en Celery Beat (settings.py)
CELERY_BEAT_SCHEDULE = {
    'check-no-shows-every-5-minutes': {
        'task': 'gestion_clinica.tasks.check_appointment_no_shows',
        'schedule': crontab(minute='*/5'),  # Cada 5 minutos
    },
}
```

### Endpoints API

#### 1. No-Shows por Día de la Semana
```
GET /api/no-show-statistics-by-day/
Authorization: Bearer <token>

Response:
{
  "day_statistics": [
    {"day": "Monday", "no_shows": 5, "day_number": 2},
    {"day": "Tuesday", "no_shows": 3, "day_number": 3},
    ...
  ],
  "total_no_shows": 25
}
```

**Uso en React**:
```typescript
import { useQuery } from "@tanstack/react-query"
import { LineChart, Line, XAxis, YAxis } from "recharts"

export function NoShowChart() {
  const { data } = useQuery({
    queryKey: ["no-show-stats"],
    queryFn: async () => {
      const res = await fetch("/api/no-show-statistics-by-day/", {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    }
  })

  return (
    <LineChart data={data?.day_statistics}>
      <XAxis dataKey="day" />
      <YAxis />
      <Line type="monotone" dataKey="no_shows" stroke="#ef4444" />
    </LineChart>
  )
}
```

#### 2. No-Shows por Paciente
```
GET /api/no-show-statistics-by-patient/
Authorization: Bearer <token>

Response:
{
  "patient_statistics": [
    {
      "patient_id": "123e4567-e89b-12d3-a456-426614174000",
      "patient_name": "Juan Pérez",
      "total_no_shows": 3
    },
    ...
  ],
  "total_patients_with_no_shows": 15
}
```

**Uso en React**:
```typescript
export function PatientNoShowList() {
  const { data } = useQuery({
    queryKey: ["patient-no-shows"],
    queryFn: async () => {
      const res = await fetch("/api/no-show-statistics-by-patient/", {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    }
  })

  return (
    <div>
      {data?.patient_statistics.map(patient => (
        <div key={patient.patient_id}>
          <span>{patient.patient_name}</span>
          <Badge>{patient.total_no_shows}</Badge>
        </div>
      ))}
    </div>
  )
}
```

#### 3. Resumen Semanal
```
GET /api/no-show-weekly-summary/
Authorization: Bearer <token>

Response:
{
  "week_start": "2024-04-01T00:00:00Z",
  "week_end": "2024-04-08T00:00:00Z",
  "total_no_shows": 12
}
```

#### 4. Trigger Manual (Admin)
```
POST /api/trigger-no-show-check/
Authorization: Bearer <admin_token>

Response:
{
  "status": "submitted",
  "task_id": "abc123...",
  "message": "No-show check task has been triggered"
}
```

---

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Celery Beat Schedule (settings.py)

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'check-appointment-no-shows': {
        'task': 'gestion_clinica.tasks.check_appointment_no_shows',
        'schedule': crontab(minute='*/5'),  # Cada 5 minutos
    },
    'send-appointment-reminders': {
        'task': 'gestion_clinica.tasks.send_appointment_reminders',
        'schedule': crontab(hour=22, minute=0),  # 22:00 diarios
    },
    'send-waiting-alerts': {
        'task': 'gestion_clinica.tasks.send_waiting_alerts',
        'schedule': crontab(minute='*/10'),  # Cada 10 minutos
    },
}
```

### 2. URLs (urls.py)

```python
from django.urls import path
from gestion_clinica.views import (
    no_show_statistics_by_day,
    no_show_statistics_by_patient,
    no_show_weekly_summary,
    trigger_no_show_check,
)

urlpatterns = [
    # ... otros patterns ...
    path('no-show-statistics-by-day/', no_show_statistics_by_day),
    path('no-show-statistics-by-patient/', no_show_statistics_by_patient),
    path('no-show-weekly-summary/', no_show_weekly_summary),
    path('trigger-no-show-check/', trigger_no_show_check),
]
```

### 3. Archivos de Sonido (opcional)

Coloca archivos de audio en `/frontend/public/sounds/`:
- `arrival.mp3` - Sonido de llegada
- `warning.mp3` - Sonido de alerta
- `checkin.mp3` - Sonido de check-in

### 4. Directorios de Video (opcional)

Coloca videos en `/frontend/public/media/procedures/`:
- `limpieza-preparation.mp4`
- `cirugia-preparation.mp4`
- `extraccion-preparation.mp4`
- etc.

---

## 🎯 INTEGRACIÓN COMPLETA EN APPOINTMENT MODULE

Para ver un ejemplo completo de integración, consulta `/frontend/components/appointment-module-example.tsx`

```typescript
import { AppointmentModuleExample } from "@/components/appointment-module-example"

export default function AppointmentPage() {
  return <AppointmentModuleExample />
}
```

---

## 📝 FLUJO DE USUARIO EJEMPLO

### Escenario: Paciente llega a consulta

1. **Recepcionista ve llegada** → Clic en "Paciente Llegó"
   - ✅ `playClinicalSound("arrival")` - Ding suave
   - ✅ Estado cambia a "sala_de_espera"
   - ✅ `StatusBadge` comienza a pulsar

2. **Paciente pasa a clínica** → Clic en "Check-In"
   - ✅ `playClinicalSound("checkin")` - Tono bajo
   - ✅ Estado cambia a "in_progress"
   - ✅ Dentista ve el procedimiento necesario

3. **Antes de procedimiento** → Abre "Preparación"
   - ✅ `ProcedureMedia` muestra materiales necesarios
   - ✅ Video de preparación se reproduce
   - ✅ Lista de chequeo interactiva

4. **Fin del día** → Ver reportes
   - ✅ Gráfico de abandonos por día (Recharts)
   - ✅ Pacientes con más incumplimientos
   - ✅ Avisos para pacientes problemáticos

---

## 🐛 TROUBLESHOOTING

### El sonido no se reproduce
- Verifica que el navegador no tenga sonido muteado
- Comprueba la consola del navegador para errores de Web Audio API
- En navegadores modernos, requiere interacción del usuario primero

### Los videos no cargan
- Asegúrate de que `/frontend/public/media/procedures/` existe
- Verifica nombres de archivo coincidan exactamente
- Usa formato MP4 H.264 para máxima compatibilidad

### Las animaciones no se ven
- Verifica que Framer Motion está instalado: `npm list framer-motion`
- Comprueba que `prefers-reduced-motion` no está habilitado en el SO

### Los endpoints retornan 401
- Verifica token JWT en `localStorage.getItem("token")`
- Comprueba que usuario está autenticado
- Para `trigger-no-show-check`, requiere rol `admin`

---

## 📚 REFERENCIAS

- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Celery Beat](https://docs.celeryproject.io/en/stable/userguide/periodic-tasks.html)
- [Django REST Framework](https://www.django-rest-framework.org/)

