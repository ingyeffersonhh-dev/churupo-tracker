# 📊 Churupo Tracker — Documentación del Sistema

> **Sistema de Gestión de Finanzas Personales Bi-Monetario (VES/USD)**
> Versión 2.0.0 | Mayo 2026

---

## 📋 Tabla de Contenidos

1. [¿Qué es Churupo Tracker?](#qué-es-churupo-tracker)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Funcionalidades](#funcionalidades)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [API — Referencia de Endpoints](#api--referencia-de-endpoints)
7. [Bot de Telegram](#bot-de-telegram)
8. [Base de Datos](#base-de-datos)
9. [Despliegue en Producción](#despliegue-en-producción)
10. [Variables de Entorno](#variables-de-entorno)
11. [Hoja de Ruta — Ideas de Mejora](#hoja-de-ruta--ideas-de-mejora)

---

## ¿Qué es Churupo Tracker?

Churupo Tracker es un **sistema completo de gestión de finanzas personales** diseñado específicamente para usuarios en Venezuela que manejan dos monedas simultáneamente: **Bolívares (VES)** y **Dólares (USD)**.

El sistema permite registrar gastos desde un elegante panel web o directamente desde **Telegram** con lenguaje natural (ejemplo: *"Comida 15 USD"*), y convierte automáticamente entre monedas usando la tasa **BCV** del día.

### Problema que resuelve

En Venezuela, la dualidad monetaria hace difícil tener una vista clara de cuánto se gasta realmente. Churupo Tracker:
- Unifica todos los gastos en un equivalente USD para comparación real.
- Permite registrar gastos al instante desde Telegram sin abrir ninguna app.
- Envía resúmenes automáticos diarios, semanales y mensuales.
- Alerta cuando un presupuesto está por agotarse.

---

## Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Frontend — Vercel"
        A["Next.js 15<br/>App Router"]
    end

    subgraph "Backend — Render"
        B["FastAPI<br/>Python 3.11+"]
        C["NLP Parser"]
        D["BCV Scraper"]
        E["Chart Generator"]
    end

    subgraph "Bot — Render"
        F["python-telegram-bot<br/>Long Polling"]
        G["APScheduler<br/>Resúmenes Automáticos"]
    end

    subgraph "Base de Datos — Supabase"
        H["PostgreSQL"]
        I["Auth (JWT)"]
    end

    A -->|REST API + JWT| B
    F -->|REST API + Secret| B
    B --> H
    B --> I
    A --> I
    D -->|Scrape BCV| J["bcv.org.ve"]
    G -->|Cron Jobs| F
```

### Flujo de Datos

1. **Usuario Web** → Se autentica con Supabase Auth → Recibe JWT → Llama al Backend con el JWT → Backend consulta PostgreSQL.
2. **Usuario Telegram** → Envía texto al bot → Bot llama al Backend con `x-bot-secret` → Backend parsea el texto con NLP → Guarda en PostgreSQL.
3. **Scheduler** → A las 10pm cada día, el bot consulta el backend y envía resúmenes a todos los usuarios vinculados.

---

## Funcionalidades

### 🖥️ Panel Web (Frontend)

| Módulo | Descripción |
|---|---|
| **Dashboard** | Resumen mensual con total gastado, ingresos, balance y desglose por categoría con indicadores de semáforo (🟢🟡🔴). |
| **Transacciones** | CRUD completo con filtros por fecha, categoría, moneda y fuente. Búsqueda por texto. |
| **Categorías** | Crear/editar/eliminar categorías personalizadas con tipo (gasto o ingreso) e icono. |
| **Presupuestos** | Asignar límites mensuales por categoría. Visualización de porcentaje consumido. |
| **Configuración** | Reglas de auto-categorización por comercio (merchant rules). |
| **Importación CSV** | Carga masiva de transacciones desde archivos CSV. |
| **Modo Claro/Oscuro** | Toggle de tema visual. |
| **Autenticación** | Registro e inicio de sesión con email/contraseña vía Supabase Auth. |

### 🤖 Bot de Telegram

| Comando | Descripción |
|---|---|
| `/start` | Vincula la cuenta de Telegram con Supabase (email + contraseña). |
| `/ayuda` o `/help` | Muestra todos los comandos disponibles. |
| `/tasa` | Consulta la tasa BCV del día en tiempo real. |
| `/presupuestos` | Estado actual de todos los presupuestos con semáforo. |
| `/ultimos` | Últimas 5 transacciones registradas. |
| `/grafico` | Genera y envía un gráfico PNG del desglose mensual. |
| *(texto libre)* | Parsea automáticamente: `"Comida 15 USD"` → registra el gasto. |

### ⏰ Resúmenes Automáticos (Scheduler)

| Frecuencia | Hora (Venezuela) | Contenido |
|---|---|---|
| **Diario** | 10:00 PM | Gastos del día + total en USD. |
| **Semanal** | Domingo 8:00 PM | Top 3 categorías + alertas de presupuesto. |
| **Mensual** | Último día del mes, 9:00 PM | Total del mes + presupuestos excedidos. |

### 🧠 Motor NLP (Procesamiento de Lenguaje Natural)

El parser entiende múltiples formatos de entrada:

```
"Comida 15 USD"          → $15.00 USD — Comida
"Gasolina 50000 VES"     → Bs. 50,000 VES — Gasolina
"Uber 8.5$"              → $8.50 USD — Uber
"Mercado 120,50 bs"      → Bs. 120.50 VES — Mercado
"Netflix 12 dolares"     → $12.00 USD — Netflix
"15 USD comida"          → $15.00 USD — Comida
```

Detecta automáticamente: `$`, `USD`, `dólares`, `VES`, `Bs`, `bolívares` y variaciones.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Frontend** | Next.js (App Router) | 15.x |
| **Estilos** | CSS custom (globals.css) | — |
| **Backend** | FastAPI | 0.115.x |
| **Lenguaje Backend** | Python | 3.11+ |
| **Base de Datos** | PostgreSQL (Supabase) | 15.x |
| **Autenticación** | Supabase Auth (JWT) | — |
| **Bot** | python-telegram-bot | 21.x |
| **Scheduler** | APScheduler | 3.10.x |
| **Scraping** | httpx + BeautifulSoup | — |
| **Gráficos** | matplotlib | — |
| **Hosting Frontend** | Vercel | — |
| **Hosting Backend** | Render | — |

---

## Estructura del Proyecto

```
churupo-tracker/
├── backend/                    # API FastAPI
│   ├── main.py                 # Entry point + CORS
│   ├── config.py               # Pydantic Settings
│   ├── dependencies.py         # Auth middleware (JWT)
│   ├── supabase_client.py      # Conexión a Supabase
│   ├── routers/
│   │   ├── analytics.py        # GET /analytics/summary
│   │   ├── bot_internal.py     # POST /bot/* (autenticado con secret)
│   │   ├── budgets.py          # CRUD /budgets/
│   │   ├── categories.py       # CRUD /categories/
│   │   ├── merchant_rules.py   # CRUD /merchant-rules/
│   │   └── transactions.py     # CRUD /transactions/
│   ├── services/
│   │   ├── bcv_scraper.py      # Scraping tasa BCV
│   │   ├── chart_generator.py  # Genera gráficos PNG
│   │   ├── csv_processor.py    # Procesa archivos CSV
│   │   ├── database.py         # Helpers de DB
│   │   └── nlp_parser.py       # Parser de lenguaje natural
│   ├── schemas/                # Pydantic models
│   └── requirements.txt
│
├── frontend/                   # Next.js 15
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/      # Panel principal
│   │   │   ├── transacciones/  # Lista de transacciones
│   │   │   ├── categorias/     # Gestión de categorías
│   │   │   ├── presupuestos/   # Gestión de presupuestos
│   │   │   ├── configuracion/  # Merchant rules
│   │   │   ├── login/          # Inicio de sesión
│   │   │   ├── register/       # Registro
│   │   │   └── import/         # Importación CSV
│   │   ├── components/         # Componentes reutilizables
│   │   └── lib/
│   │       ├── api.ts          # Cliente HTTP con auth
│   │       └── supabase.ts     # Cliente Supabase
│   ├── vercel.json             # Configuración de despliegue
│   ├── next.config.ts
│   └── package.json
│
├── telegram_bot/               # Bot de Telegram
│   ├── bot.py                  # Entry point
│   ├── config.py               # Variables de entorno
│   ├── api_client.py           # Cliente HTTP al backend
│   ├── scheduler.py            # Resúmenes automáticos
│   ├── handlers/
│   │   ├── start.py            # /start (vinculación)
│   │   ├── expense.py          # Texto libre → gasto
│   │   ├── tasa.py             # /tasa
│   │   ├── budgets.py          # /presupuestos
│   │   ├── transactions.py     # /ultimos
│   │   ├── chart.py            # /grafico
│   │   └── help.py             # /ayuda
│   └── requirements.txt
│
├── supabase/                   # Migraciones y config
├── iniciar_proyecto.bat        # Script para dev local
└── iniciar_bot.bat             # Script para bot local
```

---

## API — Referencia de Endpoints

> Todos los endpoints (excepto `/health` y `/bot/*`) requieren header `Authorization: Bearer <JWT>`.

### Health Check
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor. Retorna `{"status": "ok"}` |

### Transacciones (`/transactions/`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/transactions/` | Lista transacciones con filtros opcionales. |
| `POST` | `/transactions/` | Crear nueva transacción. |
| `GET` | `/transactions/{id}` | Detalle de una transacción. |
| `PUT` | `/transactions/{id}` | Editar transacción. |
| `DELETE` | `/transactions/{id}` | Eliminar transacción. |

### Categorías (`/categories/`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/categories/` | Listar categorías del usuario. |
| `POST` | `/categories/` | Crear categoría. |
| `PUT` | `/categories/{id}` | Editar categoría. |
| `DELETE` | `/categories/{id}` | Eliminar categoría. |

### Presupuestos (`/budgets/`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/budgets/?month=5&year=2026` | Presupuestos del mes. |
| `POST` | `/budgets/` | Crear presupuesto. |
| `DELETE` | `/budgets/{id}` | Eliminar presupuesto. |

### Analytics (`/analytics/`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/analytics/summary?month=5&year=2026` | Resumen mensual completo. |

### Merchant Rules (`/merchant-rules/`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/merchant-rules/` | Listar reglas. |
| `POST` | `/merchant-rules/` | Crear regla (keyword → categoría). |
| `DELETE` | `/merchant-rules/{id}` | Eliminar regla. |

### Bot Internal (`/bot/`) — Auth: `x-bot-secret`
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/bot/link-user` | Vincular Telegram con Supabase. |
| `POST` | `/bot/expense` | Registrar gasto por texto natural. |
| `GET` | `/bot/budgets/{telegram_id}` | Estado de presupuestos. |
| `GET` | `/bot/transactions/{telegram_id}` | Últimas transacciones. |
| `GET` | `/bot/chart/{telegram_id}` | Gráfico PNG mensual. |
| `GET` | `/bot/tasa` | Tasa BCV actual. |
| `GET` | `/bot/all-users` | Todos los usuarios vinculados. |

---

## Bot de Telegram

### Flujo de Vinculación

```mermaid
sequenceDiagram
    participant U as Usuario Telegram
    participant B as Bot
    participant API as Backend (FastAPI)
    participant S as Supabase Auth

    U->>B: /start
    B->>U: "¿Cuál es tu email?"
    U->>B: yeffry@gmail.com
    B->>U: "¿Cuál es tu contraseña?"
    U->>B: ********
    B->>API: POST /bot/link-user
    API->>S: sign_in_with_password()
    S-->>API: user_id
    API-->>B: {success: true}
    B->>U: "✅ Cuenta vinculada!"
```

### Flujo de Registro de Gasto

```mermaid
sequenceDiagram
    participant U as Usuario Telegram
    participant B as Bot
    participant API as Backend
    participant NLP as NLP Parser
    participant DB as Supabase DB

    U->>B: "Comida 15 USD"
    B->>API: POST /bot/expense {text: "Comida 15 USD"}
    API->>NLP: parse_expense("Comida 15 USD")
    NLP-->>API: {amount: 15, currency: "USD", description: "Comida"}
    API->>DB: INSERT INTO transactions
    DB-->>API: {id: "abc123"}
    API-->>B: {success, category_name, usd_equivalent}
    B->>U: "✅ Comida — $15.00 USD"
```

---

## Base de Datos

### Tablas Principales

```mermaid
erDiagram
    users ||--o{ transactions : "registra"
    users ||--o{ categories : "crea"
    users ||--o{ budgets : "define"
    users ||--o{ merchant_rules : "configura"
    users ||--o{ telegram_users : "vincula"
    categories ||--o{ transactions : "clasifica"
    categories ||--o{ budgets : "limita"
    categories ||--o{ merchant_rules : "asocia"

    users {
        uuid id PK
        string email
        string password_hash
    }

    transactions {
        uuid id PK
        uuid user_id FK
        decimal amount
        string currency
        decimal usd_equivalent
        string description
        uuid category_id FK
        date transaction_date
        string source
    }

    categories {
        uuid id PK
        uuid user_id FK
        string name
        string type
        string icon
    }

    budgets {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        decimal limit_amount
        string currency
        int month
        int year
    }

    merchant_rules {
        uuid id PK
        uuid user_id FK
        string keyword
        uuid category_id FK
    }

    telegram_users {
        uuid id PK
        uuid user_id FK
        bigint telegram_id
        string telegram_username
    }

    exchange_rates {
        uuid id PK
        date rate_date
        decimal bcv_rate
    }
```

---

## Despliegue en Producción

### Frontend — Vercel

| Configuración | Valor |
|---|---|
| **Repositorio** | `github.com/ingyeffersonhh-dev/churupo-tracker` |
| **Root Directory** | `frontend` |
| **Framework** | Next.js (auto-detectado via `vercel.json`) |
| **Build Command** | `next build` |
| **URL** | `https://churupo-tracker.vercel.app` |

### Backend — Render

| Configuración | Valor |
|---|---|
| **Tipo** | Web Service |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **URL** | `https://churupo-backend.onrender.com` |

### Bot de Telegram — Render

| Configuración | Valor |
|---|---|
| **Tipo** | Web Service |
| **Root Directory** | `telegram_bot` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python -m http.server $PORT & python bot.py` |

---

## Variables de Entorno

### Frontend (Vercel)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase | `eyJhbGci...` |
| `NEXT_PUBLIC_API_URL` | URL del backend en Render | `https://churupo-backend.onrender.com` |

### Backend (Render)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Clave de servicio (full access) | `eyJhbGci...` |
| `SUPABASE_ANON_KEY` | Clave pública | `eyJhbGci...` |
| `TELEGRAM_BOT_TOKEN` | Token de BotFather | `8640103975:AAE...` |
| `BOT_INTERNAL_SECRET` | Secreto compartido bot↔backend | `changeme-super-secret-key` |
| `ALLOWED_ORIGINS` | URL del frontend (CORS) | `https://churupo-tracker.vercel.app` |

### Bot (Render)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token de BotFather | `8640103975:AAE...` |
| `BACKEND_URL` | URL del backend | `https://churupo-backend.onrender.com` |
| `BOT_INTERNAL_SECRET` | Debe coincidir con el del backend | `changeme-super-secret-key` |

---

## Hoja de Ruta — Ideas de Mejora

### 🔴 Prioridad Alta (Impacto inmediato)

#### 1. Gastos Recurrentes Automáticos
Permitir que el usuario defina gastos fijos mensuales (Netflix, alquiler, internet) que se registren automáticamente el día configurado.
- **Impacto**: Reduce fricción del usuario y aumenta precisión del tracking.

#### 2. Exportar a Excel/PDF
Botón en el Dashboard para descargar reporte mensual en `.xlsx` o `.pdf` con desglose por categoría, gráficos y totales.
- **Impacto**: Útil para contabilidad personal, declaraciones o simplemente archivo.

#### 3. Edición de Transacciones desde el Frontend
Actualmente solo se puede crear y eliminar. Falta un botón de **editar** para corregir montos, descripciones o categorías.
- **Impacto**: Funcionalidad básica que todo CRUD necesita.

#### 4. Cambiar el `BOT_INTERNAL_SECRET`
El secreto actual es el valor por defecto (`changeme-super-secret-key`). Cambiarlo a un UUID o string aleatorio largo en ambos servicios.
- **Impacto**: Seguridad crítica en producción.

---

### 🟡 Prioridad Media (Experiencia de usuario)

#### 5. Notificaciones Push en el Frontend
Cuando un presupuesto supere el 80%, mostrar una notificación en el panel web (banner o toast).
- **Impacto**: El usuario no siempre revisa Telegram; las alertas en la web complementan.

#### 6. Gráficos Interactivos en el Dashboard
Reemplazar la tabla de categorías por gráficos de dona/pie interactivos con librerías como **Recharts** o **Chart.js**.
- **Impacto**: Mucho más visual y atractivo.

#### 7. Multi-Idioma (i18n)
Agregar soporte para inglés además de español. El bot podría detectar el idioma del usuario.
- **Impacto**: Amplía la base de usuarios potenciales.

#### 8. Fotos de Recibos
Permitir al usuario enviar una **foto de un recibo** por Telegram, procesarla con OCR (Tesseract o Google Vision) y extraer automáticamente el monto y descripción.
- **Impacto**: Caso de uso muy solicitado — "fotografía y olvídate".

#### 9. Objetivos de Ahorro
Crear un módulo donde el usuario defina una meta (ej: *"Ahorrar $500 para vacaciones"*) y el sistema muestre el progreso automáticamente basado en ingresos vs gastos.
- **Impacto**: Gamificación y motivación para el ahorro.

#### 10. Historial de Tasa BCV
Guardar un registro diario de la tasa BCV y mostrar un gráfico de evolución en el Dashboard. Útil para entender tendencias de devaluación.
- **Impacto**: Información valiosa para contexto económico.

---

### 🟢 Prioridad Baja (Nice-to-have)

#### 11. App Móvil Nativa (React Native)
Crear una versión móvil con acceso a la cámara (para recibos), notificaciones push nativas y geolocalización para auto-detectar el comercio.
- **Impacto**: Experiencia premium, pero alto esfuerzo de desarrollo.

#### 12. Inteligencia Artificial Predictiva
Usar los datos históricos para predecir gastos futuros del mes, alertando al usuario: *"Según tu patrón, este mes gastarás ~$450 USD, un 15% más que el mes pasado"*.
- **Impacto**: Diferenciador frente a otras apps de finanzas.

#### 13. Compartir Presupuesto Familiar
Permitir que dos o más usuarios compartan categorías y presupuestos (ej: parejas o familias).
- **Impacto**: Caso de uso real para hogares venezolanos donde ambos aportan.

#### 14. Integración con Bancos (Open Banking)
Conectar con APIs bancarias (cuando estén disponibles en Venezuela) para importar transacciones automáticamente.
- **Impacto**: Eliminaría completamente la entrada manual.

#### 15. PWA (Progressive Web App)
Hacer que el frontend funcione offline y pueda instalarse en el teléfono como app nativa.
- **Impacto**: Acceso rápido sin descargar nada de una tienda.

---

> **Nota**: Esta documentación fue generada el 9 de mayo de 2026. Para la versión más actualizada del código, consultar el repositorio en GitHub: `github.com/ingyeffersonhh-dev/churupo-tracker`.
