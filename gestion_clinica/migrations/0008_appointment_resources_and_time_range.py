import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.contrib.postgres.fields


def get_time_range_field():
    engine = settings.DATABASES['default']['ENGINE']
    if engine == 'django.db.backends.postgresql':
        return django.contrib.postgres.fields.DateTimeRangeField(blank=True, null=True)
    return models.JSONField(blank=True, null=True)


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_clinica', '0007_user_usersession_rolepermission_auditlog'),
    ]

    operations = [
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=150)),
                ('resource_type', models.CharField(choices=[('chair', 'Gabinete'), ('doctor', 'Doctor'), ('student', 'Student')], max_length=20)),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chair', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='gestion_clinica.dentalchair')),
                ('dentist', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='gestion_clinica.dentist')),
                ('student', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='gestion_clinica.student')),
            ],
            options={
                'db_table': 'resources',
                'ordering': ['resource_type', 'name'],
            },
        ),
        migrations.AddField(
            model_name='appointment',
            name='procedure',
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='time_range',
            field=get_time_range_field(),
        ),
    ]
