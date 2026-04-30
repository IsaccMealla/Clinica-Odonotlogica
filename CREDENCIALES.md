# 🔐 Credenciales de Acceso - Clínica Odontológica

## Usuarios de Prueba Creados

Los siguientes usuarios han sido creados para realizar pruebas en el sistema:

### 🏥 **Administrador**
```
Usuario: admin
Contraseña: Admin123!
Rol: ADMIN
```
**Acceso:** http://localhost:3000/login

---

### 👨‍🏫 **Docente / Odontólogo**
```
Usuario: docente
Contraseña: Docente123!
Rol: DOCENTE
```
**Permisos:**
- Supervisar estudiantes
- Revisar y aprobar historias clínicas
- Gestionar citas
- Ver reportes

---

### 👨‍🎓 **Estudiantes de Odontología**

#### Estudiante 1
```
Usuario: estudiante1
Contraseña: Estudiante123!
Rol: ESTUDIANTE
Nombre: Carlos Mendez
```

#### Estudiante 2
```
Usuario: estudiante2
Contraseña: Estudiante123!
Rol: ESTUDIANTE
Nombre: Ana García
```

**Permisos:**
- Gestionar sus pacientes asignados
- Registrar tratamientos
- Crear historias clínicas
- Cargar evidencias

---

### 📋 **Recepcionista**
```
Usuario: recepcion
Contraseña: Recepcion123!
Rol: RECEPCIONISTA
```
**Permisos:**
- Gestionar citas
- Registrar pacientes
- Monitoreo en tiempo real

---

## 📊 Pacientes de Prueba

Los siguientes pacientes están disponibles en el sistema:

| CI | Nombre | Ocupación | Teléfono |
|---|---|---|---|
| 12345678 | Juan Pérez García | Ingeniero | 70123456 |
| 87654321 | María López Rodríguez | Abogada | 71234567 |
| 11223344 | Carlos Martínez Sánchez | Profesor | 72345678 |

---

## 🚀 Módulo 4: Agendamiento de Citas

### Características Implementadas

#### 1. **Página de Citas con Tabs**
   - **Pestaña 1 - Asignar Citas**: Formulario para crear nuevas citas
   - **Pestaña 2 - Monitor 3D**: Visualización 3D de los gabinetes disponibles
   - **Pestaña 3 - Calendario**: Vista de citas registradas

#### 2. **Gestión de Citas**
   - Estados: RESERVADA, CONFIRMADA, EN_ESPERA, ATENDIENDO, NO_ASISTIO
   - Check-in automático
   - Alertas de abandono (alerta roja después de 15 min de espera)
   - Contador de inasistencias por paciente

#### 3. **Visualización 3D de Gabinetes**
   - Modelo 3D interactivo de sillones
   - Indicadores de estado (Disponible, Ocupado, Mantenimiento)
   - Selección de gabinete para asignación

#### 4. **Abandono Clínico**
   - Contador automático de inasistencias
   - Alerta de abandono al alcanzar 3 inasistencias
   - Registro en historia clínica

---

## 🔗 Enlaces Útiles

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **Admin Django**: http://127.0.0.1:8000/admin
- **API Citas**: http://127.0.0.1:8000/api/citas/

---

## ✅ Instrucciones de Inicio

1. **Iniciar Backend**
   ```bash
   cd D:\Clinica-Odonotlogica
   python manage.py runserver
   ```

2. **Iniciar Frontend**
   ```bash
   cd D:\Clinica-Odonotlogica\frontend
   npm run dev
   ```

3. **Acceder al Sistema**
   - Abre http://localhost:3000 en tu navegador
   - Ingresa con cualquiera de los usuarios listados arriba

---

## 📝 Notas Importantes

- Todos los passwords tienen la siguiente estructura: `Tipo123!` donde Tipo es Admin, Docente, Estudiante o Recepcion
- Los datos de prueba pueden ser modificados según necesidad
- Para crear más usuarios, usar el comando: `python manage.py create_test_data`

---

## 🆘 Solución de Problemas

### Error: "JSON parse error"
- Verifica que el backend esté corriendo
- Comprueba que la URL de la API sea correcta

### Error: "createRoot() on a container that has already been passed"
- Ha sido reparado en el dashboard
- Usa `useEffect` en lugar de `useFrame` para elementos HTML

### Alertas 3D no se cargan
- Asegúrate de tener las librerías de Three.js instaladas
- Ejecuta: `npm install @react-three/fiber @react-three/drei`

---

Último actualizado: **23 de Abril de 2026**
