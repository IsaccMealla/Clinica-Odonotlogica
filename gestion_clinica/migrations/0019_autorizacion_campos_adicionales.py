# Generated migration for new authorization fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_clinica', '0018_autorizacioncargaimage_historialauditoriaimagen'),
    ]

    operations = [
        migrations.AddField(
            model_name='autorizacioncargaimage',
            name='fecha_intento_envio',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='autorizacioncargaimage',
            name='mensaje_rechazo',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='autorizacioncargaimage',
            name='razon_no_envio',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='autorizacioncargaimage',
            name='solicitud_anterior',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolicitudes', to='gestion_clinica.autorizacioncargaimage'),
        ),
        migrations.AlterField(
            model_name='autorizacioncargaimage',
            name='estado',
            field=models.CharField(choices=[('PENDIENTE', 'Pendiente'), ('APROBADO', 'Aprobado'), ('RECHAZADO', 'Rechazado'), ('USADO', 'Usado'), ('EXPIRADO', 'Expirado'), ('RESOLICITUD', 'Re-solicitud')], default='PENDIENTE', max_length=20),
        ),
    ]
