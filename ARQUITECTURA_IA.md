# Arquitectura IA - Radiografías Odontológicas

## Estructura Implementada

### Capa 1: Procesador DICOM + Bioseguridad
**Archivo:** `gestion_clinica/utils/dicom_processor.py`

- Extrae metadatos DICOM (PatientName, PatientID)
- Valida bioseguridad comparando nombres
- Convierte DICOM a imagen estándar

```python
from gestion_clinica.utils.dicom_processor import DICOMProcessor
DICOMProcessor.validate_biosafety(archivo_bytes, nombre_paciente)
```

### Capa 2: Celery + Redis (Asincronía)
**Archivos:** 
- `backend/celery.py` - Configuración Celery
- `backend/__init__.py` - Inicialización
- `backend/settings.py` - Variables de ambiente
- `gestion_clinica/tasks.py` - Tareas asincrónicas

**Tarea IA:** `procesar_inferencia_ia_task(radiografia_id)`

### Capa 3: Inferencia CNN
**Archivo:** `gestion_clinica/utils/ia_inference.py`

Soporta modelos: `.h5` (TensorFlow), `.pt` (PyTorch), `.onnx` (ONNX Runtime)

```python
from gestion_clinica.utils.ia_inference import CNNInferenceService
service = CNNInferenceService(model_path='modelo.onnx')
hallazgos = service.infer('imagen.png')
```

### Utilidad: Diagnóstico Manual
**Archivo:** `gestion_clinica/utils/diagnostico_manual.py`

Dibuja anotaciones (cuadros rojos) sobre radiografías

```python
from gestion_clinica.utils.diagnostico_manual import DiagnosticoManualService
imagen_anotada = DiagnosticoManualService.crear_anotacion(path, hallazgos)
```

## Endpoints API

### Carga y Procesamiento
```
POST /api/imagenes/
  - Form data: paciente, archivo, categoria, descripcion
  - Validación: Autorización APROBADA + Bioseguridad DICOM
  - Estado: 'Pendiente'

POST /api/imagenes/{id}/procesar_ia/
  - Dispara tarea Celery asincrónica
  - Estado: 'Procesando'
  - Retorna: task_id

GET /api/imagenes/{id}/estado_procesamiento/
  - Verifica estado procesamiento
  - Retorna: hallazgos_ia, hallazgos_manuales, estado_tarea
```

### Diagnóstico Manual
```
POST /api/imagenes/{id}/diagnostico_manual/
  - Body: {"hallazgos": [{"etiqueta", "bounding_box", "observaciones"}]}
  - Dibuja anotaciones
  - Guarda imagen_anotada
  - Retorna: imagen actualizada

GET /api/imagenes/{id}/descargar_imagen_anotada/
  - Descarga imagen con anotaciones
```

## Instalación Rápida

### 1. Dependencias Python
```bash
pip install -r requirements.txt
```

### 2. Migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Redis (requerido)
```bash
# Opción 1: Nativo
redis-server

# Opción 2: Docker
docker-compose up redis
```

### 4. Celery Worker
```bash
celery -A backend worker -l info
```

### 5. Django Server
```bash
python manage.py runserver
```

## Modelo de Datos

### ImagenClinica - Nuevos Campos
```python
hallazgos_ia: JSONField  # Resultados automáticos del modelo IA
hallazgos_manuales: JSONField  # Anotaciones del médico/estudiante
estado_procesamiento: CharField  # Pendiente/Procesando/Procesado/Error
imagen_anotada: ImageField  # Imagen con cuadros rojos
tarea_celery_id: CharField  # ID de tarea para tracking
```

### Auditoría (HistorialAuditoriaImagen)
```
SUBIDA_REALIZADA - Cuando se sube archivo
IA_INFERENCIA_INICIADA - Cuando inicia procesamiento
IA_INFERENCIA_COMPLETADA - Cuando termina
DIAGNOSTICO_MANUAL_REGISTRADO - Cuando se anotan hallazgos
```

## Flujo Completo

```
1. Frontend: POST /api/imagenes/ (multipart/form-data)
   ↓
2. ViewSet.perform_create():
   - Valida autorización
   - Valida bioseguridad DICOM
   - Guarda con estado='Pendiente'
   ↓
3. Usuario: POST /api/imagenes/{id}/procesar_ia/
   ↓
4. Celery Task (background):
   - Lee imagen
   - Ejecuta CNNInferenceService
   - Guarda hallazgos_ia
   - Actualiza estado='Procesado'
   ↓
5. Usuario (opcional): POST /api/imagenes/{id}/diagnostico_manual/
   - Envía hallazgos manuales
   - Sistema dibuja anotaciones
   - Guarda imagen_anotada
   - Merge con IA (si existe)
   ↓
6. Frontend: GET /api/imagenes/{id}/estado_procesamiento/
   - Verifica estado actual
```

## Testing

### Verificar Instalación
```bash
python verificar_arquitectura_ia.py
```

### Crear imagen de prueba
```python
python manage.py shell
>>> from gestion_clinica.models import ImagenClinica
>>> # Crear instancia de prueba
```

## Frontend Integration

### React Hooks
```typescript
import { radiografiaAPI } from '@/lib/radiografia-api';

// Cargar
await radiografiaAPI.cargarRadiografia(pacienteId, archivo, categoria);

// Procesar IA
await radiografiaAPI.procesarConIA(radiografiaId);

// Estado
const estado = await radiografiaAPI.obtenerEstado(radiografiaId);

// Diagnóstico Manual
await radiografiaAPI.registrarDiagnosticoManual(radiografiaId, hallazgos);
```

### Componente React
```tsx
<VisorRadiografiaConAnotaciones
  radiografiaId={radiografiaId}
  pacienteId={pacienteId}
/>
```

## Notas

- Celery consume Redis para queue y result backend
- Modelos soportados: TensorFlow (.h5), PyTorch (.pt), ONNX (.onnx)
- Imagen procesada se redimensiona a 224x224
- Anotaciones dibujadas en rojo con etiquetas
- Auditoría registra cada acción automáticamente
- Estados: Pendiente → Procesando → Procesado (o Error)
