from channels.generic.websocket import AsyncJsonWebsocketConsumer


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

