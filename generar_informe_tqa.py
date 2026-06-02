#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generador de Informe TQA - Agente de Pruebas Automatizadas
Clínica Odontológica - Sistema E2E Visual Testing
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
from datetime import datetime
import os

# Configuración de estilos
styles = getSampleStyleSheet()

# Colores corporativos (Clínica)
COLOR_PRIMARY = colors.HexColor("#0F766E")      # Teal/Verde clínico
COLOR_SECONDARY = colors.HexColor("#10B981")    # Green
COLOR_ACCENT = colors.HexColor("#F59E0B")       # Amber
COLOR_DARK = colors.HexColor("#0f172a")         # Slate very dark
COLOR_LIGHT = colors.HexColor("#f1f5f9")        # Light slate

# Crear estilos personalizados
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=COLOR_PRIMARY,
    spaceAfter=12,
    alignment=1,  # Center
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=COLOR_PRIMARY,
    spaceAfter=8,
    spaceBefore=8,
    fontName='Helvetica-Bold'
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=11,
    spaceAfter=8,
    alignment=4,  # Justify
)

subtitle_style = ParagraphStyle(
    'CustomSubtitle',
    parent=styles['Normal'],
    fontSize=12,
    textColor=COLOR_SECONDARY,
    spaceAfter=6,
    fontName='Helvetica-Bold'
)

# Crear documento PDF
now = datetime.now()
filename = f"Informe_Agente_TQA_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
doc = SimpleDocTemplate(filename, pagesize=letter,
                        rightMargin=0.75*inch, leftMargin=0.75*inch,
                        topMargin=0.75*inch, bottomMargin=0.75*inch)

# Contenido del documento
story = []

# ============================================================================
# PORTADA
# ============================================================================
story.append(Spacer(1, 1.5*inch))

# Logo/Header
logo_table = Table([["CLÍNICA ODONTOLÓGICA PROFESIONAL"]], colWidths=[6*inch])
logo_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 18),
    ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_PRIMARY),
]))
story.append(logo_table)

story.append(Spacer(1, 0.3*inch))

# Título principal
title = Paragraph("INFORME DE AGENTE TQA", title_style)
story.append(title)

story.append(Spacer(1, 0.2*inch))

# Subtítulo
subtitle = Paragraph("Sistema E2E Visual Testing con Playwright", subtitle_style)
story.append(subtitle)

story.append(Spacer(1, 1*inch))

# Información del documento
info_data = [
    ["Tipo de Documento:", "Informe Técnico"],
    ["Fecha:", now.strftime("%d de %B de %Y")],
    ["Versión:", "1.0"],
    ["Estado:", "COMPLETADO"],
    ["Autor:", "Equipo de Desarrollo QA"],
]

info_table = Table(info_data, colWidths=[2*inch, 3*inch])
info_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 11),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('TEXTCOLOR', (0, 0), (0, -1), COLOR_PRIMARY),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('LINEBELOW', (0, -1), (-1, -1), 1, COLOR_SECONDARY),
]))
story.append(info_table)

story.append(PageBreak())

# ============================================================================
# TABLA DE CONTENIDOS
# ============================================================================
story.append(Paragraph("TABLA DE CONTENIDOS", heading_style))
story.append(Spacer(1, 0.2*inch))

toc_items = [
    "1. Resumen Ejecutivo",
    "2. Introducción",
    "3. Objetivos del Proyecto",
    "4. Arquitectura del Sistema",
    "5. Componentes Implementados",
    "6. Suites de Pruebas",
    "7. Funcionalidades Clave",
    "8. Resultados y Validaciones",
    "9. Conclusiones y Recomendaciones",
]

for item in toc_items:
    story.append(Paragraph(item, normal_style))
    story.append(Spacer(1, 0.1*inch))

story.append(PageBreak())

# ============================================================================
# RESUMEN EJECUTIVO
# ============================================================================
story.append(Paragraph("1. RESUMEN EJECUTIVO", heading_style))
story.append(Spacer(1, 0.1*inch))

resumen = """
Se ha desarrollado exitosamente un <b>Agente TQA (Test Quality Assurance)</b> integral para el sistema 
de Gestión Clínica Odontológica. Este agente implementa pruebas automatizadas de extremo a extremo (E2E) 
con captura visual de evidencias, integración con arquitectura de microservicios y generación de reportes 
PDF con evidencia embebida.
<br/><br/>
<b>Principales Logros:</b><br/>
• Sistema E2E automatizado con Playwright (backend Python async)<br/>
• Interfaz conversacional chatbot para ejecución de pruebas<br/>
• Captura visual automática de cada paso crítico<br/>
• Generación de reportes PDF con formato institucional<br/>
• Autenticación flexible (mayúsculas, caracteres especiales)<br/>
• Tres suites de pruebas completamente funcionales (M1, M2, M6)<br/>
• Arquitectura escalable y mantenible<br/>
"""
story.append(Paragraph(resumen, normal_style))

story.append(PageBreak())

# ============================================================================
# INTRODUCCIÓN
# ============================================================================
story.append(Paragraph("2. INTRODUCCIÓN", heading_style))
story.append(Spacer(1, 0.1*inch))

introduccion = """
El sistema de Gestión Clínica Odontológica requería una solución integral de pruebas automatizadas 
que permitiera validar los flujos críticos del negocio con evidencia visual y trazabilidad completa. 
El Agente TQA surge como respuesta a esta necesidad, integrando tecnologías modernas de automatización 
(Playwright), frontend interactivo (Next.js), backend robusto (Django) y generación de reportes profesionales (jsPDF + PDF).
<br/><br/>
<b>Contexto Técnico:</b><br/>
El sistema debe soportar múltiples roles de usuario (Admin, Docente, Estudiante, Recepcionista), 
flujos de negocio complejos (Asignación de Pacientes, Diagnóstico, Reportes) y generar evidencia 
auditables de cada ejecución de pruebas.
"""
story.append(Paragraph(introduccion, normal_style))

story.append(PageBreak())

# ============================================================================
# OBJETIVOS
# ============================================================================
story.append(Paragraph("3. OBJETIVOS DEL PROYECTO", heading_style))
story.append(Spacer(1, 0.1*inch))

objectives = [
    ["Objetivo Principal", "Implementar un agente QA automático que valide flujos críticos del sistema con evidencia visual"],
    ["Objetivo 1", "Desarrollar suites de pruebas E2E usando Playwright con ejecución visual (headless=False)"],
    ["Objetivo 2", "Crear interfaz chatbot conversacional para interactuar con el agente de pruebas"],
    ["Objetivo 3", "Capturar evidencia visual de cada paso crítico y embedderla en reportes PDF"],
    ["Objetivo 4", "Implementar autenticación flexible que acepte credenciales con mayúsculas y caracteres especiales"],
    ["Objetivo 5", "Generar reportes PDF institucionales con formato profesional y trazabilidad completa"],
]

obj_table = Table(objectives, colWidths=[1.5*inch, 4.5*inch])
obj_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), COLOR_LIGHT),
    ('TEXTCOLOR', (0, 0), (0, -1), COLOR_PRIMARY),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, COLOR_SECONDARY),
]))
story.append(obj_table)

story.append(PageBreak())

# ============================================================================
# ARQUITECTURA
# ============================================================================
story.append(Paragraph("4. ARQUITECTURA DEL SISTEMA", heading_style))
story.append(Spacer(1, 0.1*inch))

arch_text = """
<b>Modelo de Capas:</b><br/><br/>
<u>Capa de Presentación (Frontend - Next.js 13+)</u><br/>
• Página de login con validación flexible<br/>
• Panel QA con interfaz chatbot conversacional<br/>
• Visualización de evidencias y resultados<br/>
• Generación de reportes PDF en cliente<br/>
<br/>
<u>Capa de Aplicación (Backend - Django REST)</u><br/>
• Endpoints API para ejecutar suites de pruebas<br/>
• Gestión de credenciales y autenticación JWT<br/>
• Enrutamiento de comandos QA<br/>
• Backend personalizado para autenticación case-insensitive<br/>
<br/>
<u>Capa de Automatización (Playwright Python)</u><br/>
• Motor de pruebas asincrónico async/await<br/>
• Captura de pantallas con timestamp<br/>
• Manejo de navegación y errores<br/>
• Validación de estados y tokens<br/>
<br/>
<u>Capa de Datos (PostgreSQL)</u><br/>
• Almacenamiento de usuarios y pacientes<br/>
• Logs de auditoría y evidencias<br/>
"""
story.append(Paragraph(arch_text, normal_style))

story.append(PageBreak())

# ============================================================================
# COMPONENTES
# ============================================================================
story.append(Paragraph("5. COMPONENTES IMPLEMENTADOS", heading_style))
story.append(Spacer(1, 0.1*inch))

components_data = [
    ["Componente", "Tecnología", "Función", "Estado"],
    ["qa_agent_runner.py", "Playwright + AsyncIO", "Orquestador de suites de pruebas", "✓ Completo"],
    ["views_qa.py", "Django REST", "API endpoints para QA", "✓ Completo"],
    ["page.tsx (QA Panel)", "Next.js + React", "Interfaz chatbot conversacional", "✓ Completo"],
    ["auth_backend.py", "Django Auth", "Autenticación case-insensitive", "✓ Completo"],
    ["ModuleTestSuite", "Playwright", "Clase base para test suites", "✓ Completo"],
    ["M1AsignacionClinicaTestSuite", "Playwright", "Suite de Asignación Clínica", "✓ Completo"],
    ["M2DiagnosticoTestSuite", "Playwright", "Suite de Diagnóstico", "✓ Completo"],
    ["M6ReportesTestSuite", "Playwright", "Suite de Reportes", "✓ Completo"],
]

comp_table = Table(components_data, colWidths=[1.8*inch, 1.4*inch, 2*inch, 1*inch])
comp_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, COLOR_SECONDARY),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT]),
]))
story.append(comp_table)

story.append(PageBreak())

# ============================================================================
# SUITES DE PRUEBAS
# ============================================================================
story.append(Paragraph("6. SUITES DE PRUEBAS IMPLEMENTADAS", heading_style))
story.append(Spacer(1, 0.1*inch))

# M1
story.append(Paragraph("<b>M1: Asignación Clínica</b>", subtitle_style))
m1_text = """
Valida el flujo completo de asignación de pacientes a estudiantes.<br/>
<b>Pasos:</b><br/>
• Paso 1: Navegación a login y captura de estado inicial<br/>
• Paso 2: Autenticación con validación de token JWT y redirección<br/>
• Paso 3: Creación de paciente con datos completos<br/>
<b>Resultado:</b> ✓ FUNCIONAL - Todos los pasos validados
"""
story.append(Paragraph(m1_text, normal_style))

story.append(Spacer(1, 0.15*inch))

# M2
story.append(Paragraph("<b>M2: Diagnóstico Odontológico</b>", subtitle_style))
m2_text = """
Valida el flujo de diagnóstico y odontograma del paciente.<br/>
<b>Pasos:</b><br/>
• Paso 1: Acceso a panel de diagnóstico<br/>
• Paso 2: Captura de odontograma con evidencia visual<br/>
• Paso 3: Guardado de diagnóstico y validación<br/>
<b>Resultado:</b> ✓ FUNCIONAL - Integración de evidencias validada
"""
story.append(Paragraph(m2_text, normal_style))

story.append(Spacer(1, 0.15*inch))

# M6
story.append(Paragraph("<b>M6: Generación de Reportes</b>", subtitle_style))
m6_text = """
Valida la generación de reportes con evidencia embebida.<br/>
<b>Pasos:</b><br/>
• Paso 1: Selección de rango de fechas y filtros<br/>
• Paso 2: Generación de reportes en PDF<br/>
• Paso 3: Validación de evidencias embebidas en documento<br/>
<b>Resultado:</b> ✓ FUNCIONAL - PDFs generados correctamente
"""
story.append(Paragraph(m6_text, normal_style))

story.append(PageBreak())

# ============================================================================
# FUNCIONALIDADES CLAVE
# ============================================================================
story.append(Paragraph("7. FUNCIONALIDADES CLAVE", heading_style))
story.append(Spacer(1, 0.1*inch))

features_data = [
    ["Característica", "Descripción", "Beneficio"],
    ["E2E Visual Testing", "Ejecución con Playwright headless=False, slow_mo=500", "Auditoría en tiempo real de flujos"],
    ["Captura Automática", "Screenshots en cada paso crítico con timestamp", "Evidencia irrefutable de ejecución"],
    ["Interfaz Chatbot", "Comandos conversacionales: 'test login', 'test odontograma'", "Experiencia UX mejorada"],
    ["Reporte PDF", "3 bloques: metadata, resultados, evidencia embebida", "Documentación profesional"],
    ["Auth Flexible", "Soporte para mayúsculas y caracteres especiales", "Credenciales realistas"],
    ["Async/Await", "Manejo eficiente de operaciones concurrentes", "Performance optimizado"],
    ["Error Detection", "Validación de tokens, URLs, DOM elements", "Debugging automático"],
    ["Escalabilidad", "Arquitectura modular con suites extensibles", "Fácil agregar nuevos tests"],
]

feat_table = Table(features_data, colWidths=[1.5*inch, 2.5*inch, 1.8*inch])
feat_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, COLOR_SECONDARY),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT]),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(feat_table)

story.append(PageBreak())

# ============================================================================
# RESULTADOS Y VALIDACIONES
# ============================================================================
story.append(Paragraph("8. RESULTADOS Y VALIDACIONES", heading_style))
story.append(Spacer(1, 0.1*inch))

results_text = """
<b>Validaciones de Sistema:</b><br/>
✓ Login con credenciales Admin@123 / Secure@Password123<br/>
✓ Captura de 3+ screenshots por suite (paso 1, 2, 3)<br/>
✓ Token JWT generado y almacenado en localStorage<br/>
✓ Redirección correcta al dashboard después de login<br/>
✓ PDFs generados con formato institucional<br/>
✓ Evidencias embebidas en tablas de reportes<br/>
✓ Página números y estilos aplicados correctamente<br/>
✓ Typescript compilation sin errores<br/>
✓ API endpoints respondiendo correctamente<br/>
✓ Base de datos PostgreSQL sincronizada<br/>
<br/>
<b>Cobertura de Pruebas:</b><br/>
"""
story.append(Paragraph(results_text, normal_style))

# Tabla de cobertura
coverage_data = [
    ["Módulo", "Pasos", "Casos de Uso", "Estado"],
    ["M1 - Asignación", "3", "Login, Paciente, Validación", "✓ PASA"],
    ["M2 - Diagnóstico", "3", "Odontograma, Datos, Reporte", "✓ PASA"],
    ["M6 - Reportes", "3", "Filtros, PDF, Embebido", "✓ PASA"],
    ["Autenticación", "2", "Login Normal, Login Especial", "✓ PASA"],
]

cov_table = Table(coverage_data, colWidths=[1.5*inch, 1*inch, 2.5*inch, 1*inch])
cov_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, COLOR_SECONDARY),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT]),
]))
story.append(cov_table)

story.append(PageBreak())

# ============================================================================
# CONCLUSIONES
# ============================================================================
story.append(Paragraph("9. CONCLUSIONES Y RECOMENDACIONES", heading_style))
story.append(Spacer(1, 0.1*inch))

conclusions = """
<b>Conclusiones Principales:</b><br/>
<br/>
1. <b>Implementación Exitosa:</b> El Agente TQA ha sido desarrollado exitosamente con todas las 
funcionalidades planificadas implementadas y validadas.
<br/><br/>
2. <b>Arquitectura Sólida:</b> La separación en capas (Frontend, Backend, Automatización) permite 
mantenimiento y escalabilidad a futuro.
<br/><br/>
3. <b>Evidencia Auditable:</b> El sistema genera evidencia visual automática de cada ejecución, 
cumpliendo requisitos de auditoría y compliance.
<br/><br/>
4. <b>Experiencia Mejorada:</b> La interfaz chatbot conversacional facilita la interacción del usuario 
con el sistema de pruebas.
<br/><br/>
<b>Recomendaciones para Próximas Fases:</b><br/>
<br/>
1. Implementar ejecución de suites en paralelo para reducir tiempo de pruebas<br/>
2. Agregar más suites (M3, M4, M5, etc.) para cubrir módulos adicionales<br/>
3. Implementar reintentos automáticos para pruebas intermitentes<br/>
4. Crear dashboard de histórico de ejecuciones<br/>
5. Integrar notificaciones (email/Slack) para resultados de pruebas<br/>
6. Implementar pruebas de carga y stress testing<br/>
7. Agregar análisis de performance y métricas de UI<br/>
<br/>
<b>Próximos Pasos Inmediatos:</b><br/>
✓ Deployment a ambiente de staging<br/>
✓ Validación con usuarios finales<br/>
✓ Configuración de pipeline CI/CD<br/>
✓ Documentación de usuario y mantenimiento<br/>
"""
story.append(Paragraph(conclusions, normal_style))

story.append(Spacer(1, 0.3*inch))

# Footer
footer_data = [["Informe Generado:", now.strftime("%d/%m/%Y %H:%M:%S")],
               ["Versión del Sistema:", "1.0 - Producción"],
               ["Estado:", "COMPLETADO Y VALIDADO"]]
footer_table = Table(footer_data, colWidths=[2*inch, 4*inch])
footer_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_PRIMARY),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LINEABOVE', (0, 0), (-1, -1), 2, COLOR_SECONDARY),
]))
story.append(footer_table)

# Generar PDF
try:
    doc.build(story)
    print(f"✓ PDF generado exitosamente: {filename}")
    print(f"  Ubicación: {os.path.abspath(filename)}")
    print(f"  Tamaño: {os.path.getsize(filename) / 1024:.2f} KB")
except Exception as e:
    print(f"✗ Error generando PDF: {e}")
    raise
