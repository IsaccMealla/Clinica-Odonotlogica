# ⚡ Guía Rápida - Sistema de Auditoría de Citas

## 🎯 Tarea: Cambiar Estado de una Cita

### Paso 1: Abrir el Gestor de Citas
- Ve al menú principal
- Selecciona "Citas" → "Gestor de Citas Programadas"

### Paso 2: Buscar la Cita
- Usa la barra de búsqueda para encontrar por:
  - Nombre del paciente
  - Nombre del estudiante
  - Nombre del motivo/tratamiento
  - Gabinete

### Paso 3: Cambiar Estado

#### Opción A: Paciente Llegó (EN_ESPERA)
```
Cita: RESERVADA o CONFIRMADA
         ↓ Haz clic en "Llegó"
      EN_ESPERA
      
✓ Se notifica al estudiante
✓ Se registra en auditoría
```

#### Opción B: Comenzar Atención (ATENDIENDO)
```
Cita: EN_ESPERA
         ↓ Haz clic en "Atendiendo"
      ATENDIENDO
      
✓ Se registra quién y cuándo
✓ Se guarda en auditoría
```

#### Opción C: Finalizar Cita (FINALIZADO)
```
Cita: ATENDIENDO o EN_ESPERA
         ↓ Haz clic en "Finalizado"
      FINALIZADO
      
✓ Se registra hora de finalización
✓ Se guarda en auditoría
```

---

## 📊 Ver Historial de Cambios

### Paso 1: Localizar la Cita
- Busca la cita en el gestor

### Paso 2: Haz Clic en "Historial"
- Botón con ícono de reloj (⏰)

### Paso 3: Revisar Cambios
Verás una lista como esta:

```
RESERVADA → EN_ESPERA
👤 María López
🕐 2026-05-05 14:30:15

EN_ESPERA → ATENDIENDO  
👤 Dr. Juan Sánchez
🕐 2026-05-05 14:32:45

ATENDIENDO → FINALIZADO
👤 Dr. Juan Sánchez
🕐 2026-05-05 14:55:30
```

---

## 🎨 Botones Disponibles (según estado)

| Estado Actual | Botones Disponibles |
|---|---|
| RESERVADA | Llegó, Reprogramar, Cancelar, Historial |
| CONFIRMADA | Llegó, Reprogramar, Cancelar, Historial |
| EN_ESPERA | Atendiendo, Finalizado, Reprogramar, Cancelar, Historial |
| ATENDIENDO | Finalizado, Cancelar, Historial |
| FINALIZADO | Historial |
| NO_ASISTIO | Historial |
| CANCELADA | Historial |

---

## ❓ Preguntas Frecuentes

### P: ¿Se puede revertir un cambio?
**R:** No directamente. Debes cancelar y crear una nueva cita. Todos los cambios quedan registrados.

### P: ¿Quién puede ver la auditoría?
**R:** Solo usuarios autenticados en el sistema.

### P: ¿Se pierde información si cambio de estado?
**R:** No, todo se guarda en el historial. Los cambios se registran automáticamente.

### P: ¿Qué pasa si cancelo una cita?
**R:** Se marca como CANCELADA y se guarda en auditoría quién y cuándo la canceló.

### P: ¿Puedo ver quién hizo cada cambio?
**R:** Sí, en el historial puedes ver el nombre del usuario y la hora exacta.

---

## 🔔 Notificaciones Automáticas

Cuando haces clic en **"Llegó"**:
1. ✅ La cita cambia a EN_ESPERA
2. ✅ Se notifica al estudiante por el sistema
3. ✅ Se registra en auditoría automáticamente

---

## 📱 Estados de La Cita - Colores

```
📅 RESERVADA (Azul) - Cita agendada
✓ CONFIRMADA (Verde claro) - Confirmada
⏳ EN_ESPERA (Amarillo) - Paciente esperando
🏥 ATENDIENDO (Púrpura) - En atención
✓ FINALIZADO (Verde oscuro) - Completada ✨ NUEVO
✗ NO_ASISTIO (Rojo) - No asistió
✗ CANCELADA (Gris) - Cancelada
```

---

## 🆘 Solución de Problemas

### El botón "Atendiendo" no aparece
- Verifica que la cita esté en estado EN_ESPERA
- Si no aparece, recarga la página

### No puedo ver el historial
- Verifica que hayas iniciado sesión
- Recarga la página
- Asegúrate que la cita existe

### No se registró la auditoría
- Verifica conexión a internet
- Recarga la página
- Intenta de nuevo

---

## 📝 Ejemplo de Uso Completo

```
1. Recepcionista recibe al paciente
   → Busca cita en estado RESERVADA
   → Haz clic en "Llegó"
   → Cita cambia a EN_ESPERA
   → Se notifica al estudiante

2. Estudiante comienza la consulta
   → Busca cita en EN_ESPERA
   → Haz clic en "Atendiendo"
   → Cita cambia a ATENDIENDO
   → Se registra quién y cuándo

3. Se finaliza la atención
   → Haz clic en "Finalizado"
   → Cita cambia a FINALIZADO
   → Se registra hora de finalización

4. Verificar lo que pasó
   → Haz clic en "Historial"
   → Ver todos los cambios realizados
   → Confirmar tiempos y usuarios
```

---

## 🎓 Tutorial en Video (Simulado)

### Cambiar a ATENDIENDO
1. Abre Citas → Gestor de Citas
2. Busca cita con estado EN_ESPERA
3. Haz clic en botón púrpura "Atendiendo"
4. Lee el mensaje de confirmación
5. Haz clic en "✓ Confirmar"
6. Ver confirmación de cambio exitoso

### Finalizar Cita
1. Busca cita con estado ATENDIENDO
2. Haz clic en botón verde "Finalizado"
3. Confirma en el diálogo
4. La cita cambia a FINALIZADO
5. Se registra automáticamente

### Ver Historial
1. Busca cualquier cita
2. Haz clic en botón "Historial"
3. Ve todos los cambios en orden cronológico
4. Para cada cambio ves: estado anterior, nuevo, usuario, hora
5. Cierra el diálogo para continuar

---

**Versión: 1.0**
**Última actualización: 2026-05-05**

