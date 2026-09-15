# CVMatch AI — MVP comercial

CVMatch AI compara un CV con una oferta laboral, calcula un Match Score, identifica keywords presentes/faltantes, detecta brechas y puede generar una versión optimizada del CV sin inventar experiencia.

## Funcionalidades incluidas

- Landing page comercial.
- Carga de CV en PDF/DOCX.
- Pegado de oferta laboral.
- Análisis ATS + Match Score.
- Keywords encontradas y faltantes.
- Fortalezas y brechas.
- Recomendaciones.
- Optimización del CV.
- Descarga del resultado en HTML para imprimir/guardar como PDF.
- Límites de uso FREE/PRO/PREMIUM simulados en el MVP.
- Arquitectura preparada para conectar autenticación, PostgreSQL/Supabase y Culqi.

## Importante

Este paquete es un MVP ejecutable. Para análisis con IA debes colocar tu `OPENAI_API_KEY` en `.env`.
No pongas la clave en el frontend.

## Instalación

1. Instala Node.js 20+.
2. Abre una terminal en esta carpeta.
3. Ejecuta:

```bash
npm install
```

4. Copia `.env.example` como `.env`.
5. Coloca tu clave de OpenAI.
6. Ejecuta:

```bash
npm start
```

7. Abre `http://localhost:3000`.

## Producción

Antes de cobrar a usuarios reales, conectar:
- Supabase Auth + PostgreSQL.
- Storage privado para CV.
- Culqi Checkout + webhooks.
- Rate limiting.
- Logs y monitoreo.
- Política de privacidad y términos.
- Dominio propio.
- HTTPS.

## Precios planteados

FREE: S/0 — 1 análisis inicial.
PRO: S/19.90/mes — 10 análisis, optimización, PDF/DOCX y historial.
PREMIUM: S/39.90/mes — PRO + entrevista, carta y LinkedIn.
Compra única: S/29.90 — un CV optimizado.

## Mensaje comercial

"Sube tu CV, pega la oferta laboral y descubre en menos de 2 minutos qué tan bien encaja tu perfil con el puesto."

## Regla crítica

La IA no debe inventar experiencia, títulos, certificaciones, tecnologías ni logros.
