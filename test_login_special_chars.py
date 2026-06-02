#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de prueba: Validar login con mayúsculas y caracteres especiales
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from playwright.async_api import async_playwright


async def test_login_with_special_chars():
    """Test login con mayúsculas y caracteres especiales"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        try:
            # Navegar a login
            print("[1] Navegando a login...")
            await page.goto("http://localhost:3000/login")
            await page.wait_for_load_state("networkidle")
            
            # Prueba 1: Escribir mayúsculas en username
            print("[2] Escribiendo 'Admin@123' en usuario...")
            username_input = page.locator("#username")
            await username_input.click()
            await page.type("#username", "Admin@123")
            
            # Verificar que se escribió correctamente
            username_value = await username_input.input_value()
            print(f"   Valor en input: '{username_value}'")
            assert "Admin@123" in username_value or "admin@123" in username_value, f"Username no se escribió correctamente: {username_value}"
            
            # Prueba 2: Escribir contraseña con mayúsculas y caracteres especiales
            print("[3] Escribiendo 'Secure@Password123' en contraseña...")
            password_input = page.locator("#password")
            await password_input.click()
            await page.type("#password", "Secure@Password123")
            
            # Verificar que se escribió correctamente
            password_value = await password_input.input_value()
            print(f"   Valor en input: '{password_value}'")
            
            # Prueba 3: Enviar formulario
            print("[4] Enviando formulario de login...")
            submit_button = page.locator("button[type='submit']")
            await submit_button.click()
            
            # Esperar respuesta
            await asyncio.sleep(3)
            
            # Verificar si login fue exitoso
            current_url = page.url
            print(f"   URL actual: {current_url}")
            
            if "/dashboard" in current_url:
                print("✓ LOGIN EXITOSO con mayúsculas y caracteres especiales")
            elif "/login" in current_url:
                # Check error message
                error_msg = await page.locator("text=/Usuario|contraseña|incorrectos/i").text_content()
                print(f"✗ LOGIN FALLIDO: {error_msg}")
            else:
                print(f"? URL inesperada: {current_url}")
            
            # Tomar screenshot
            await page.screenshot(path="/tmp/login_test.png")
            print("[5] Screenshot guardado en /tmp/login_test.png")
            
        except Exception as e:
            print(f"✗ Error durante el test: {e}")
            await page.screenshot(path="/tmp/login_test_error.png")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(test_login_with_special_chars())
