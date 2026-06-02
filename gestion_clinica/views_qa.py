# -*- coding: utf-8 -*-
"""
Vista para ejecutar pruebas QA con Playwright desde el Frontend
Permite ejecutar suites de prueba y devolver resultados con evidencias
"""

import asyncio
import sys
import os
from pathlib import Path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import json
from asgiref.sync import sync_to_async
import threading

# Agregar el directorio raíz al path para importar qa_agent_runner
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Importar las clases del QA Runner
try:
    from qa_agent_runner import (
        M1AsignacionClinicaTestSuite,
        M2DiagnosticoTestSuite,
        M6ReportesTestSuite,
        M7FunctionalTestSuite,
        M8NonFunctionalTestSuite,
    )
except ImportError as e:
    print(f"⚠️ Error importando qa_agent_runner: {e}")


def run_async_suite(suite):
    """Ejecutar suite async en un nuevo event loop (para uso desde django)"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(suite.ejecutar_pruebas())
        return suite.to_report()
    finally:
        loop.close()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ejecutar_qa_command(request):
    """
    Ejecutar un comando QA específico con Playwright
    
    Parámetros esperados (JSON):
    {
        "modulo": "M1" | "M2" | "M6",
        "credenciales": {"email": "user@example.com", "password": "pass123"} (opcional)
    }
    
    Devuelve:
    {
        "modulo": "M1",
        "nombre_modulo": "Asignación Clínica y Recepción",
        "resultados": [...],
        "estado_general": "PASA" | "FALLA"
    }
    """
    try:
        # Obtener parámetros del request
        data = request.data
        modulo = data.get('modulo', '').upper()
        credenciales = data.get('credenciales', {})
        
        # Validar módulo
        if modulo not in ['M1', 'M2', 'M6', 'M7', 'M8']:
            return Response(
                {'error': f'Módulo {modulo} no válido. Use M1, M2, M6, M7 o M8'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mapeo de suites
        suites_map = {
            'M1': M1AsignacionClinicaTestSuite,
            'M2': M2DiagnosticoTestSuite,
            'M6': M6ReportesTestSuite,
            'M7': M7FunctionalTestSuite,
            'M8': M8NonFunctionalTestSuite,
        }
        
        # Instanciar y ejecutar suite
        suite_class = suites_map.get(modulo)
        if not suite_class:
            return Response(
                {'error': f'Suite para {modulo} no encontrada'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        suite = suite_class()
        
        # Si hay credenciales, almacenarlas temporalmente (para M1)
        if credenciales and modulo == 'M1':
            suite.credenciales_custom = credenciales
        
        # Ejecutar suite en thread separado con su propio event loop
        report = run_async_suite(suite)
        
        return Response(report, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"❌ Error ejecutando QA: {e}")
        traceback.print_exc()
        return Response(
            {
                'error': f'Error ejecutando QA: {str(e)}',
                'traceback': traceback.format_exc() if hasattr(e, '__traceback__') else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_evidencias(request):
    """
    Listar todas las evidencias (screenshots) capturadas
    """
    try:
        evidence_dir = Path("frontend/public/qa-evidence")
        
        if not evidence_dir.exists():
            return Response(
                {'evidencias': [], 'total': 0},
                status=status.HTTP_200_OK
            )
        
        # Listar archivos PNG
        evidencias = []
        for file in sorted(evidence_dir.glob("*.png")):
            evidencias.append({
                'nombre': file.name,
                'ruta': f"/qa-evidence/{file.name}",
                'tamaño': file.stat().st_size,
                'creado': file.stat().st_mtime
            })
        
        return Response(
            {'evidencias': evidencias, 'total': len(evidencias)},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def limpiar_evidencias(request):
    """
    Limpiar todas las evidencias capturadas
    """
    try:
        if not (request.user.is_superuser or getattr(request.user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']):
            return Response(
                {'error': 'Solo administradores pueden limpiar evidencias'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        evidence_dir = Path("frontend/public/qa-evidence")
        
        if not evidence_dir.exists():
            return Response(
                {'mensaje': 'No hay evidencias que limpiar', 'eliminadas': 0},
                status=status.HTTP_200_OK
            )
        
        # Eliminar archivos PNG
        count = 0
        for file in evidence_dir.glob("*.png"):
            file.unlink()
            count += 1
        
        return Response(
            {'mensaje': f'{count} evidencias eliminadas', 'eliminadas': count},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

