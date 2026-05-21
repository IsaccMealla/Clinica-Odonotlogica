from channels.generic.websocket import AsyncJsonWebsocketConsumer
<<<<<<< Updated upstream


class AppointmentConsumer(AsyncJsonWebsocketConsumer):
    """Consumer para notificaciones de citas en tiempo real"""
    
    async def connect(self):
        self.group_name = 'appointments_updates'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Recibir evento de nueva cita
    async def new_appointment(self, event):
        await self.send_json({
            'type': 'new_appointment',
            'appointment_id': event.get('appointment_id'),
            'patient_name': event.get('patient_name'),
            'message': event.get('message'),
        })

    # Recibir evento de cita cancelada
    async def appointment_cancelled(self, event):
        await self.send_json({
            'type': 'appointment_cancelled',
            'appointment_id': event.get('appointment_id'),
            'patient_name': event.get('patient_name'),
            'message': event.get('message'),
        })

    # Recibir evento de paciente llegó
    async def patient_arrived(self, event):
        await self.send_json({
            'type': 'patient_arrived',
            'appointment_id': event.get('appointment_id'),
            'patient_name': event.get('patient_name'),
            'message': event.get('message'),
            'patient_arrived_at': event.get('patient_arrived_at'),
        })


class StudentNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.student_id = self.scope['url_route']['kwargs'].get('student_id')
        self.group_name = f'student_{self.student_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def patient_arrived(self, event):
        await self.send_json({
            'type': 'patient_arrived',
            'appointment_id': event.get('appointment_id'),
            'patient': event.get('patient'),
            'chair': event.get('chair'),
            'start_datetime': event.get('start_datetime'),
        })

=======
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
import json
import logging

logger = logging.getLogger(__name__)


class ClinicaConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumer WebSocket para eventos en tiempo real de la clínica.
    Soporta múltiples suscripciones dinámicas según rol y ID de tratamiento.
    """
    
    async def connect(self):
        self.user = self.scope["user"]
        self.groups = set()
        
        if self.user.is_authenticated:
            # Grupo global para todos los usuarios autenticados
            await self.channel_layer.group_add("clinica_realtime", self.channel_name)
            self.groups.add("clinica_realtime")
            
            # Grupo específico por rol
            if hasattr(self.user, 'rol'):
                rol_group = f"clinica_rol_{self.user.rol}"
                await self.channel_layer.group_add(rol_group, self.channel_name)
                self.groups.add(rol_group)
            
            await self.accept()
            logger.info(f"Usuario {self.user.username} conectado al WebSocket")
        else:
            await self.close()

    async def disconnect(self, close_code):
        for group in self.groups:
            await self.channel_layer.group_discard(group, self.channel_name)
        logger.info(f"Usuario desconectado. Grupos: {self.groups}")

    async def receive_json(self, content, **kwargs):
        action = content.get('action')
        
        if action == 'ping':
            await self.send_json({
                'event': 'pong',
                'message': 'WebSocket alive',
                'timestamp': str(__import__('django.utils.timezone', fromlist=['now']).now())
            })
            return

        if action == 'subscribe':
            tratamiento_ids = content.get('tratamiento_ids', [])
            if isinstance(tratamiento_ids, list):
                for tid in tratamiento_ids:
                    group_name = f"tratamiento_{tid}"
                    await self.channel_layer.group_add(group_name, self.channel_name)
                    self.groups.add(group_name)
                
                await self.send_json({
                    'event': 'subscribed',
                    'tratamiento_ids': tratamiento_ids,
                    'timestamp': str(__import__('django.utils.timezone', fromlist=['now']).now())
                })
                logger.info(f"Usuario {self.user.username} suscrito a tratamientos: {tratamiento_ids}")
            return

        if action == 'unsubscribe':
            tratamiento_ids = content.get('tratamiento_ids', [])
            if isinstance(tratamiento_ids, list):
                for tid in tratamiento_ids:
                    group_name = f"tratamiento_{tid}"
                    await self.channel_layer.group_discard(group_name, self.channel_name)
                    self.groups.discard(group_name)
                
                await self.send_json({
                    'event': 'unsubscribed',
                    'tratamiento_ids': tratamiento_ids
                })
            return

        await self.send_json({
            'event': 'error',
            'message': f'Acción no reconocida: {action}'
        })

    # Métodos para recibir eventos desde el channel_layer

    async def clinica_event(self, event):
        """Recibe eventos de cambio de estado y los envía al cliente."""
        await self.send_json(event['payload'])

    async def tratamiento_estado_changed(self, event):
        """Evento específico: cambio de estado de tratamiento."""
        await self.send_json({
            'event': 'tratamiento_estado_changed',
            'data': event.get('data', {}),
            'timestamp': event.get('timestamp')
        })

    async def control_academico_aprobado(self, event):
        """Evento: Control académico aprobado por docente."""
        await self.send_json({
            'event': 'control_academico_aprobado',
            'data': event.get('data', {}),
            'timestamp': event.get('timestamp')
        })

    async def pago_procesado(self, event):
        """Evento: Pago procesado en caja."""
        await self.send_json({
            'event': 'pago_procesado',
            'data': event.get('data', {}),
            'timestamp': event.get('timestamp')
        })

    async def despacho_almacen(self, event):
        """Evento: Despacho de almacén realizado."""
        await self.send_json({
            'event': 'despacho_almacen',
            'data': event.get('data', {}),
            'timestamp': event.get('timestamp')
        })
>>>>>>> Stashed changes
