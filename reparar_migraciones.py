#!/usr/bin/env python
"""
Script de reparación de migraciones - ImagenClinica
"""
import os
import sys
import subprocess

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def run_command(cmd, description):
    print(f"\n{'='*70}")
    print(f"▶ {description}")
    print(f"{'='*70}")
    print(f"Ejecutando: {cmd}\n")
    
    result = subprocess.run(cmd, shell=True, cwd=os.getcwd())
    
    if result.returncode != 0:
        print(f"\n✗ FALLO: {description}")
        print(f"Código de error: {result.returncode}")
        return False
    else:
        print(f"\n✓ EXITOSO: {description}")
        return True

def main():
    print("\n" + "╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + "REPARACIÓN DE MIGRACIONES - ImagenClinica".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")
    
    pasos = [
        ("python manage.py migrate gestion_clinica 0019", "Aplicar migraciones hasta 0019"),
        ("python manage.py migrate gestion_clinica 0020", "Aplicar migración 0020 (nuevos campos)"),
        ("python manage.py showmigrations gestion_clinica", "Verificar estado de migraciones"),
    ]
    
    resultados = []
    
    for cmd, desc in pasos:
        resultado = run_command(cmd, desc)
        resultados.append((desc, resultado))
        
        if not resultado:
            print(f"\n✗ DETENIDO: No se puede continuar sin completar: {desc}")
            break
    
    print("\n" + "="*70)
    print("RESUMEN")
    print("="*70)
    
    for desc, resultado in resultados:
        estado = "✓ OK" if resultado else "✗ FALLO"
        print(f"{estado}: {desc}")
    
    total_ok = sum(1 for _, r in resultados if r)
    total = len(resultados)
    
    if total_ok == total:
        print(f"\n✓ TODAS LAS MIGRACIONES APLICADAS EXITOSAMENTE ({total}/{total})")
        print("\nAhora puedes ejecutar:")
        print("  python manage.py runserver")
        return 0
    else:
        print(f"\n✗ FALLOS EN MIGRACIONES ({total_ok}/{total})")
        print("\nIntenta:")
        print("  1. Verifica que PostgreSQL está ejecutándose")
        print("  2. Verifica credenciales en settings.py")
        print("  3. Ejecuta: python manage.py migrate --plan")
        return 1

if __name__ == '__main__':
    sys.exit(main())
