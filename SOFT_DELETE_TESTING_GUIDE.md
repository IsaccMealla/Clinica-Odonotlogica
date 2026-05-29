# Soft Delete Implementation - Testing & Usage Guide

## 🧪 Quick Start: Testing the Implementation

### 1. Verify Server is Running
```bash
python manage.py runserver
# Opens at http://localhost:8000
```

### 2. Check System Status
```bash
python manage.py check
# Should show: System check identified no issues (0 silenced)
```

### 3. View All Available Endpoints
```bash
curl http://localhost:8000/api/
# Lists all registered ViewSets and endpoints
```

---

## 📍 Testing Each ViewSet Type

### Type 1: Simple Models with SoftDeleteMixin
These ViewSets automatically get all soft delete features:

**Example: SillonViewSet (Dental Chairs)**
```bash
# List active chairs
GET /api/sillones/

# View deleted chairs
GET /api/sillones/papelera/

# Soft delete a chair
POST /api/sillones/1/papelera/

# Restore a chair
POST /api/sillones/1/restaurar/

# Permanently delete
DELETE /api/sillones/1/
```

**Other Simple Models:**
- Habitos
- ExamenPeriodontal
- Periodontogramas
- ExamenClinicoFisico
- etc.

---

### Type 2: Complex Models with Custom Implementation
These have role-based filtering plus soft delete:

**Example: TratamientoViewSet**
```bash
# List treatments assigned to current user
GET /api/tratamientos/

# Filter by estudiante (student)
GET /api/tratamientos/?estudiante=5

# Soft delete a treatment
POST /api/tratamientos/123/papelera/

# View all deleted treatments (admin/docente only)
GET /api/tratamientos/papelera/

# Restore treatment
POST /api/tratamientos/123/restaurar/
```

**Other Complex Models:**
- Pacientes (role-based + soft delete)
- Citas (custom papelera/restaurar)
- AsignacionCaso (role-based)
- SolicitudSupervision (role-based)

---

## 🔍 Practical Usage Scenarios

### Scenario 1: User Accidentally Deletes a Patient

**Initial State:**
```python
Patient.objects.filter(activo=True).count()  # 100 active
Patient.objects.filter(activo=False).count()  # 0 deleted
```

**User soft-deletes patient ID=5:**
```bash
POST /api/pacientes/5/papelera/
# Response: {"message": "Paciente movido a papelera"}
```

**After soft delete:**
```python
Patient.objects.filter(activo=True).count()  # 99 active
Patient.objects.filter(activo=False).count()  # 1 deleted
Patient.objects.get(id=5).activo  # False
```

**View deleted patient:**
```bash
GET /api/pacientes/papelera/
# Returns list with patient ID=5
```

**Restore patient:**
```bash
POST /api/pacientes/5/restaurar/
# Response: {"message": "Paciente restaurado con éxito"}
```

**After restore:**
```python
Patient.objects.filter(activo=True).count()  # 100 active again
Patient.objects.get(id=5).activo  # True
```

---

### Scenario 2: Bulk Delete and Restore Operations

**Soft delete multiple records:**
```bash
# Delete 1
POST /api/tratamientos/101/papelera/

# Delete 2
POST /api/tratamientos/102/papelera/

# Delete 3
POST /api/tratamientos/103/papelera/

# View all deleted treatments
GET /api/tratamientos/papelera/
```

**Restore specific records:**
```bash
POST /api/tratamientos/101/restaurar/
POST /api/tratamientos/103/restaurar/

# Verify
GET /api/tratamientos/papelera/
# Now returns only treatment 102
```

---

### Scenario 3: Hard Delete (Permanent)

**⚠️ Warning: This is IRREVERSIBLE**

```bash
# Only works for records in papelera (activo=False)
DELETE /api/pacientes/5/
```

**Result:**
```python
Patient.objects.filter(id=5).exists()  # False - completely removed
```

---

## 🐛 Troubleshooting

### Issue 1: Endpoint Not Found (404)

**Problem:**
```bash
POST /api/pacientes/1/papelera/
# Returns 404: Not Found
```

**Solution:**
1. Verify ViewSet is registered in `urls.py`
2. Check endpoint name matches route
3. Ensure SoftDeleteMixin is inherited

```python
# Correct
class PacienteViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Paciente.objects.filter(activo=True)
    
# Incorrect (missing mixin)
class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
```

---

### Issue 2: Field Error: "Cannot resolve keyword 'activo'"

**Problem:**
```
FieldError: Cannot resolve keyword 'activo' into field
```

**Causes:**
1. Migration not applied for the model
2. ViewSet tries to filter by `activo` but model doesn't have field
3. Migration 0018 didn't include this model

**Solution:**
1. Check migration was applied:
   ```bash
   python manage.py showmigrations gestion_clinica
   # Should show 0018 as [X] (applied)
   ```

2. If not applied:
   ```bash
   python manage.py migrate gestion_clinica
   ```

3. If model missing `activo` field, create migration:
   ```bash
   python manage.py makemigrations gestion_clinica
   python manage.py migrate gestion_clinica
   ```

---

### Issue 3: Permission Denied for Restore

**Problem:**
```bash
POST /api/tratamientos/123/restaurar/
# Returns 403: Permission Denied
```

**Solution:**
Some ViewSets have role-based access. Check:
1. User is logged in
2. User has correct role (DOCENTE, ADMIN, or ESTUDIANTE as appropriate)
3. User is authorized for this record

```python
# Check current user role
GET /api/usuarios/  # See "rol" field for current user
```

---

### Issue 4: Server Won't Start

**Problem:**
```
Error: Cannot resolve keyword 'activo' into field
Traceback in views.py
```

**Solution:**
1. Check views.py syntax:
   ```bash
   python -m py_compile gestion_clinica/views.py
   ```

2. Verify migrations:
   ```bash
   python manage.py migrate gestion_clinica
   ```

3. Run system check:
   ```bash
   python manage.py check
   ```

---

## 📊 Data Integrity Checks

### Verify Soft Delete is Working

```bash
# Create test script: test_soft_delete.py
from django.contrib.auth import get_user_model
from gestion_clinica.models import Paciente

# View all patients (including deleted)
all_patients = Paciente.objects.all()
print(f"All patients: {all_patients.count()}")

# View only active patients
active_patients = Paciente.objects.filter(activo=True)
print(f"Active patients: {active_patients.count()}")

# View only deleted patients
deleted_patients = Paciente.objects.filter(activo=False)
print(f"Deleted patients: {deleted_patients.count()}")

# Verify data is preserved
if deleted_patients.exists():
    deleted = deleted_patients.first()
    print(f"Deleted patient name: {deleted.nombre}")
    print(f"All related data intact: {deleted.citas.count()} citas")
```

**Run it:**
```bash
python manage.py shell < test_soft_delete.py
```

---

## 🔐 Security Verification

### Check Role-Based Access

```bash
# Login as Student
GET /api/tratamientos/
# Returns only their own treatments

# Login as Teacher
GET /api/tratamientos/
# Returns all treatments for supervision

# Login as Admin
GET /api/tratamientos/
# Returns all treatments
```

### Check Papelera Access

```bash
# Verify soft-deleted records NOT visible in default list
GET /api/pacientes/
# Does NOT include deleted patients

# Verify deletion requires special endpoint
GET /api/pacientes/papelera/
# Returns ONLY deleted patients
```

---

## 📋 Checklist: Implementation Verification

- [ ] Django check passes: `python manage.py check`
- [ ] Migrations applied: `python manage.py migrate gestion_clinica`
- [ ] Server starts: `python manage.py runserver`
- [ ] SoftDeleteMixin imported in views.py
- [ ] All 31 ViewSets use SoftDeleteMixin or custom get_queryset()
- [ ] Test soft delete: `POST /api/sillones/1/papelera/`
- [ ] Test view papelera: `GET /api/sillones/papelera/`
- [ ] Test restore: `POST /api/sillones/1/restaurar/`
- [ ] Test hard delete: `DELETE /api/sillones/1/`
- [ ] Verify only active records in default list
- [ ] Verify role-based filtering still works
- [ ] API documentation updated

---

## 🚀 Performance Notes

### Soft Delete Impact
- **Minimal**: Just adds one boolean field
- **No significant index degradation**
- **Query time similar to original**

### Best Practices
1. Index the `activo` field for better query performance
2. Regularly archive permanently deleted records
3. Soft delete first, hard delete only after retention period
4. Monitor papelera size

---

## 📚 Code Examples

### Add Soft Delete to New Model

```python
# 1. Add field to model
class MyModel(models.Model):
    name = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

# 2. Create migration
python manage.py makemigrations

# 3. Create ViewSet with SoftDeleteMixin
class MyModelViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = MyModel.objects.filter(activo=True)
    serializer_class = MyModelSerializer

# 4. Register in urls.py
router.register(r'mymodel', MyModelViewSet, basename='mymodel')
```

---

## 🎓 Learning Resources

- Django Soft Delete: https://docs.djangoproject.com/en/stable/topics/db/models/
- DRF ViewSets: https://www.django-rest-framework.org/api-guide/viewsets/
- Custom Actions: https://www.django-rest-framework.org/api-guide/viewsets/#marking-extra-actions-for-routing

---

## 📞 Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review `SOFT_DELETE_IMPLEMENTATION.md` for architecture
3. Check Django/DRF error messages in terminal
4. Review test_data files for usage examples
