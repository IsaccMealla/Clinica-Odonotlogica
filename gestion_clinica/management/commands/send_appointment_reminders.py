from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from gestion_clinica.models import Appointment

class Command(BaseCommand):
    help = 'Envía recordatorios de citas 24h por email y 2h por SMS (simulado con log).'

    def handle(self, *args, **options):
        now = timezone.now()
        # Recordatorio 24 horas antes
        target_24h = (now + timedelta(hours=24)).date()
        appointments_24h = Appointment.objects.filter(
            appointment_date=target_24h,
            status__in=[Appointment.STATUS_SCHEDULED, Appointment.STATUS_CONFIRMED],
        )
        for appt in appointments_24h:
            hora = appt.start_time.strftime('%H:%M')
            subject = 'Recordatorio de cita dental'
            message = f"Reminder: You have a dental appointment tomorrow at {hora}."
            # correo
            send_mail(subject, message, settings.EMAIL_HOST_USER, [appt.patient.email] if getattr(appt.patient, 'email', None) else [])
            self.stdout.write(self.style.SUCCESS(f"Email reminder enviado a paciente {appt.patient} para cita {appt.id}"))

        # Recordatorio 2 horas antes (SMS simulado)
        target_2h = (now + timedelta(hours=2))
        appointments_2h = Appointment.objects.filter(
            appointment_date=target_2h.date(),
            start_time__gte=(target_2h - timedelta(minutes=15)).time(),
            start_time__lte=(target_2h + timedelta(minutes=15)).time(),
            status__in=[Appointment.STATUS_SCHEDULED, Appointment.STATUS_CONFIRMED],
        )
        for appt in appointments_2h:
            hora = appt.start_time.strftime('%H:%M')
            texto_sms = f"Reminder: You have a dental appointment in 2 hours at {hora}."
            self.stdout.write(self.style.SUCCESS(f"SMS reminder (simulado) a {appt.patient.celular or 'sin número'}: {texto_sms}"))
