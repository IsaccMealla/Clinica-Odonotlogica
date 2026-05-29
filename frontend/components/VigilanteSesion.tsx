"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode, JwtPayload } from 'jwt-decode';

export default function VigilanteSesion() {
    const router = useRouter();
    const pathname = usePathname();
    // Tipamos explícitamente el estado como booleano
    const [mostrarAlerta, setMostrarAlerta] = useState<boolean>(false);

    useEffect(() => {
        // No queremos que el vigilante funcione si ya estamos en el login
        if (pathname === '/login') return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        try {
            // Le decimos a TypeScript que el token decodificado tendrá la forma de un JwtPayload
            const tokenDecodificado = jwtDecode<JwtPayload>(token);
            
            // TypeScript nos pedirá asegurarnos de que 'exp' exista antes de multiplicarlo
            if (!tokenDecodificado.exp) return;

            const fechaExpiracion: number = tokenDecodificado.exp * 1000;

            // Usamos ReturnType para inferir automáticamente el tipado correcto de setInterval
            const intervalo: ReturnType<typeof setInterval> = setInterval(() => {
                const tiempoActual: number = Date.now();
                const tiempoRestante: number = fechaExpiracion - tiempoActual;

                // Si quedan 5 minutos o menos (300,000 ms), mostramos alerta
                if (tiempoRestante <= 300000 && tiempoRestante > 0) {
                    setMostrarAlerta(true);
                }

                // Si se acabó el tiempo, cerramos sesión
                if (tiempoRestante <= 0) {
                    clearInterval(intervalo);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token'); 
                    setMostrarAlerta(false);
                    alert("Tu sesión ha expirado por seguridad. Vuelve a ingresar.");
                    router.push('/login');
                }
            }, 60000); // Revisa cada 60 segundos

            return () => clearInterval(intervalo);
        } catch (error) {
            console.error("Error al decodificar el token", error);
        }
    }, [pathname, router]);

    // Si no hay alerta, no renderizamos nada visualmente
    if (!mostrarAlerta) return null;

    // El diseño de tu alerta
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', 
            backgroundColor: '#ff9800', color: 'white', 
            textAlign: 'center', padding: '10px', zIndex: 9999
        }}>
            ⚠️ Tu sesión expirará en menos de 5 minutos. Guarda tus cambios.
        </div>
    );
}