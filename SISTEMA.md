# 💸 Churupo Tracker (v2.0.2)
> Sistema Bi-Monetario de Gestión de Finanzas Personales con integración de Telegram.

## 📋 ¿Qué es Churupo Tracker?
Churupo Tracker es una plataforma diseñada para el mercado venezolano (y cualquier entorno multi-moneda) que permite rastrear ingresos y egresos en USD y VES de forma automática. El sistema utiliza una estética **Neo-Brutalista** moderna y se enfoca en la rapidez de registro a través de un Bot de Telegram con procesamiento de lenguaje natural.

---

## 🛠️ Arquitectura del Sistema

El sistema está compuesto por tres pilares fundamentales:

### 1. Frontend (Next.js + Tailwind)
- **Dashboard Interactivo**: Visualización de KPIs (Gasto total, Balance, Presupuestos).
- **Gestión de Categorías**: Personalización de tus límites de gasto.
- **Gastos Fijos**: Automatización de pagos recurrentes (Netflix, Alquiler, etc.).
- **Reportes**: Exportación de datos a Excel y PDF para análisis externo.

### 2. Backend (FastAPI + Python)
- **API REST**: Procesa todas las operaciones de la web y el bot.
- **Procesador de Lenguaje Natural**: Entiende comandos como "Cena 20 USD" y los categoriza.
- **Sync con Tasas**: Actualización automática de la tasa oficial BCV (Venezuela).

### 3. Telegram Bot (@Churupo_Track_bot)
- **Registro Rápido**: Envía un mensaje y el bot registra el gasto al instante.
- **Consultas**: Revisa tu saldo, presupuestos y gráficos directamente en el chat.

### 4. Base de Datos (Supabase)
- Almacenamiento seguro de transacciones, usuarios y configuraciones.
- Gestión de autenticación segura.

---

## 🚀 Funcionalidades Principales

### 📈 Dashboard Inteligente
Visualiza el progreso de tus presupuestos con indicadores visuales (Verde/Amarillo/Rojo). Compara tu rendimiento con el mes anterior automáticamente.

### 🤖 Registro por Telegram
El bot es el corazón de la entrada de datos. Ejemplos de uso:
- `Mercado 45 USD`
- `Pago movil Cantv 1500 VES` (Usa la tasa del día)
- `/presupuestos` para ver cuánto te queda en cada categoría.
- `/grafico` para recibir una imagen de tus gastos actuales.

### 🔄 Gastos Fijos (Recurrentes)
Configura gastos que se repiten cada mes. El sistema los registrará automáticamente el día que elijas, asegurando que tu balance siempre sea real.

### 📑 Reportes Profesionales
Descarga un desglose detallado de tu mes en formato **.xlsx (Excel)** o **.pdf** con gráficos incluidos.

---

## ⚙️ Configuración y Vinculación

### Reglas de Negocio
Puedes crear reglas para que el sistema aprenda. Si siempre pagas "Farmatodo", puedes crear una regla para que cualquier descripción que contenga esa palabra se asigne a la categoría "Salud".

### Vincular Telegram
1. Abre el bot en Telegram.
2. El bot te pedirá tu email.
3. El sistema te enviará un código o pedirá tu clave para asegurar que eres tú.
4. Una vez vinculado, el bot sabrá exactamente en qué cuenta guardar tus churupos.

---

## 💡 Ideas para el Futuro
1. **OCR de Recibos**: Subir una foto del ticket al bot y que extraiga el monto.
2. **Metas de Ahorro**: Configurar objetivos (ej: "Ahorrar para laptop") y ver el progreso.
3. **Multi-Cuentas**: Separar gastos personales de gastos de negocio.
4. **Notificaciones de Exceso**: Que el bot te avise proactivamente cuando estés por pasar un límite.

---
*Diseñado con ❤️ por Antigravity para el control financiero moderno.*
