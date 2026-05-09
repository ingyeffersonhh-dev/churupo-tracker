Actúa como un Desarrollador Full-Stack Senior y Arquitecto de Software. Tu tarea es construir el MVP de una aplicación web progresiva (PWA) para la gestión de finanzas personales (PFM).

### 1. STACK TECNOLÓGICO
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Radix UI (para accesibilidad y componentes base), Recharts (para gráficos), React Hook Form + Zod (validación), Zustand (estado global).
- **Backend**: FastAPI (Python), Pandas (para procesamiento de CSV/Excel).
- **Base de Datos y Auth**: Supabase (PostgreSQL con Row Level Security - RLS, Autenticación con email/contraseña).

### 2. CONTEXTO DE NEGOCIO Y REGLAS (CORE)
- **Sistema Bi-Monetario**: La app maneja Bolívares (VES) y Dólares (USD). Toda transacción registrada en VES debe calcular y guardar su equivalente en USD utilizando la tasa de cambio de la fecha de la transacción.
- **Categorización por Reglas**: No usaremos IA para categorizar. Existe una tabla de `merchant_rules`. Si el usuario sube un CSV y la descripción contiene una palabra clave (ej. "PAGO MOVIL"), se asigna automáticamente a la categoría correspondiente.
- **Presupuestos**: Los usuarios pueden definir límites mensuales en USD para cada categoría. El sistema debe calcular el porcentaje consumido y mostrar barras de progreso en 3 colores: Verde (<80%), Amarillo (80%-99%), Rojo (>=100%).

### 3. ESQUEMA DE BASE DE DATOS (Supabase PostgreSQL)
Asume el siguiente esquema relacional protegido por RLS (cada usuario solo ve su data):
- `users`: id (UUID), email. (Manejado por Supabase Auth).
- `exchange_rates`: id, date (DATE), bcv_rate (DECIMAL), parallel_rate (DECIMAL).
- `categories`: id, user_id, name, type ('income', 'expense'), icon.
- `merchant_rules`: id, user_id, keyword (VARCHAR), category_id.
- `budgets`: id, user_id, category_id, limit_amount (DECIMAL), currency, month (INT), year (INT).
- `transactions`: id, user_id, category_id, amount (DECIMAL), currency ('VES', 'USD'), usd_equivalent (DECIMAL), transaction_date (TIMESTAMP), description (TEXT), source ('manual', 'csv').

### 4. INSTRUCCIONES DE DESARROLLO PASO A PASO
Por favor, implementa el sistema estrictamente en el siguiente orden. Pregúntame o pide confirmación antes de pasar a la siguiente fase:

**Fase 1: Configuración e Infraestructura**
1. Inicializa el proyecto Next.js y el entorno virtual de FastAPI.
2. Genera los scripts SQL para crear las tablas en Supabase y las políticas RLS.
3. Configura la conexión de Supabase tanto en el backend (Python) como en el frontend (Next.js).

**Fase 2: Backend - API y Lógica de Negocio**
1. Crea los endpoints CRUD en FastAPI para `categories`, `budgets` y `merchant_rules`.
2. Crea el endpoint de registro de `transactions` manuales (debe recibir VES o USD, consultar la tasa de `exchange_rates` y calcular el `usd_equivalent` si aplica).
3. Crea el endpoint de subida de CSV: Usa Pandas para leer un CSV con columnas (Fecha, Referencia, Descripción, Monto). Implementa la lógica que cruce la 'Descripción' con `merchant_rules` para asignar el `category_id` e inserta los registros.
4. Crea el endpoint de analíticas: Un resumen de gastos agrupados por categoría vs. el presupuesto del mes actual.

**Fase 3: Frontend - UI y Autenticación**
1. Implementa el login/registro con Supabase Auth.
2. Crea el Layout principal (Sidebar/Bottom nav para móvil) y protege las rutas.
3. Desarrolla la página de "Configuración" para gestionar Categorías, Reglas de Comercio y definir los Presupuestos mensuales.

**Fase 4: Frontend - Vistas Core**
1. Desarrolla el Formulario de Ingreso Manual de Gastos (optimizado para móvil, teclado numérico rápido).
2. Desarrolla la vista de "Importar Banco": un Drag & Drop para el CSV que llame al endpoint de FastAPI.
3. Desarrolla el Dashboard (Inicio):
   - Tarjetas de resumen (Total gastado, Total disponible).
   - Componente de "Presupuestos": Mapea las categorías con su barra de progreso (Radix UI Progress) aplicando la lógica de colores (Verde, Amarillo, Rojo).
   - Un gráfico de torta (Recharts) con la distribución de gastos.

### 5. RESTRICCIONES TÉCNICAS
- Escribe código limpio, modular y tipado (TypeScript).
- En Python, usa Pydantic para la validación de todos los esquemas de entrada y salida.
- Maneja los errores de forma elegante en el frontend usando `toast` notifications.
- El diseño debe ser "Mobile-First" utilizando Tailwind CSS.

¿Entendido? Si estás listo, comienza generando la estructura de carpetas y los scripts SQL de la Fase 1.