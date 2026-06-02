#!/usr/bin/env python
# -*- coding: utf-8 -*-
from docx import Document
import os

src = 'Documento_Plantilla_TQA_FINAL.docx'
if os.path.exists(src):
    doc = Document(src)
    print('=== ESTRUCTURA DEL DOCUMENTO ===\n')
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip():
            print(f'{i}: {p.text[:120]}')
        if i > 80:
            break
else:
    print(f"Archivo no encontrado: {src}")
    print(f"Archivos .docx: {[f for f in os.listdir('.') if f.endswith('.docx')]}")
