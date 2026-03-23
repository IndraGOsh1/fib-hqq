# FIB HQ — Plataforma Web

Sistema interno de gestión para la división FIB. Todo en un solo proyecto Next.js.

---

## Instalación

```bash
npm install
cp .env.local.example .env.local
# Rellena SPREADSHEET_ID y JWT_SECRET
npm run dev
```

Abre http://localhost:3000

---

## Primer acceso

El código **`indraputo0%0`** está precargado con **2 usos** y rol `command_staff`.

1. Ve a `/login` → tab **Registrarse**
2. Usa el código `indraputo0%0`
3. Después crea más códigos desde `/dashboard/admin`

---

## Google Sheets

Necesitas el archivo `credentials.json` de Google Cloud en la raíz del proyecto.
Y 3 hojas en tu Spreadsheet:

**Personal** (columnas A–O):
```
Nombre | Apodo | Discord ID | Fecha Ingreso | Estado | Sección | Rango
N° Agente | Especialidades | S.Leves | S.Moderadas | S.Graves | Fecha Baja | Reingresos | Notas
```

**Historial** (columnas A–F):
```
Fecha | Nombre | Acción | Detalle | Responsable | Discord ID
```

**Sanciones** (columnas A–G):
```
Fecha | Nombre | Discord ID | Tipo | Motivo | Responsable | Estado
```

## Supabase (nuevo)

Se agregó soporte opcional de Supabase para persistencia de datos.

### Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (recomendado para operaciones de servidor)

Si no están definidas, la aplicación usará la memoria en el servidor (no persistente).

### Tablas esperadas

1. `users`
   - id (text PK)
   - username (text unique)
   - passwordHash (text)
   - rol (text)
   - discordId (text)
   - agentNumber (text)
   - nombre (text)
   - createdAt (timestamptz)
   - activo (boolean)

2. `invites`
   - codigo (text PK)
   - rol (text)
   - discordId (text)
   - agentNumber (text)
   - nombre (text)
   - creadoPor (text)
   - creadoEn (timestamptz)
   - maxUsos (integer)
   - usos (integer)
   - usadoPor (text[])

3. `operativos`, `casos`, `tickets`, `config_visual` (opcional)
   - Estructuras complejas con JSON y campos básicos. Puedes usar `jsonb` para `contenido`, `bloques`, `sospechosos`, etc.

### Recomendación rápida (SQL)

```sql
-- users
create table if not exists users (
  id text primary key,
  username text unique not null,
  passwordHash text not null,
  rol text not null,
  discordId text,
  agentNumber text,
  nombre text,
  createdAt timestamptz not null,
  activo boolean not null default true
);

-- invites
create table if not exists invites (
  codigo text primary key,
  rol text not null,
  discordId text,
  agentNumber text,
  nombre text,
  creadoPor text,
  creadoEn timestamptz,
  maxUsos int,
  usos int,
  usadoPor text[]
);
```

### ¿Dónde configurar en Netlify?

En el panel de Netlify, agrega las variables de entorno arriba. La app ya lee el valor en `src/lib/supabase-client.ts`.


---

## Despliegue en Netlify

### Preparación

1. **Instala Git** (si no lo tienes): Descárgalo de https://git-scm.com/

2. **Configura variables de entorno**:
   - Copia `.env.local.example` a `.env.local`
   - Rellena `SPREADSHEET_ID` con tu ID de Google Sheets
   - Genera `JWT_SECRET`: Ejecuta `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Para `GOOGLE_CREDENTIALS`: Pega el contenido completo de `credentials.json` como string JSON escapado

3. **Inicializa Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **Sube a GitHub**: Crea un repo en GitHub y ejecuta:
   ```bash
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

### Despliegue

1. Ve a [Netlify](https://netlify.com) y conecta tu repo de GitHub
2. Configura el build:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
3. Agrega variables de entorno en Netlify:
   - `SPREADSHEET_ID`
   - `JWT_SECRET`
   - `GOOGLE_CREDENTIALS` (contenido de credentials.json)
4. Despliega

### ⚠️ Importante: Base de datos volátil

**Problema crítico**: La aplicación usa almacenamiento en memoria (JavaScript Maps) que se pierde en cada reinicio de función serverless en Netlify.

**Datos afectados**:
- Usuarios y códigos de invitación
- Operativos, casos, tickets, chat

**Solución recomendada**: Migrar a una base de datos persistente como Supabase (gratuito) o MongoDB Atlas.

Para una migración rápida:
1. Instala Supabase: `npm install @supabase/supabase-js`
2. Crea un proyecto en [supabase.com](https://supabase.com)
3. Actualiza `src/lib/db.ts` y otros archivos `-db.ts` para usar Supabase en lugar de Maps
4. Crea tablas en Supabase para cada entidad

Sin esto, los datos se perderán en cada despliegue o cold start.

---

## Módulos completados (Fase 1)

- Página pública (landing, unidades, rangos)
- Login y registro con código de invitación
- Dashboard con estadísticas
- Tabla de personal con filtros
- Fichas de agentes (ver, editar, sancionar, historial)
- Panel de administración (códigos de invitación, usuarios web)

## Próximos módulos

- Operativos e informes públicos
- Carpetas de investigación (casos)
- Allanamientos con PDF
- Sistema de tickets
- Chat en tiempo real (WebSockets)
- Carpeta personal del agente

---

## Deploy en Vercel

1. Sube a GitHub
2. Importa en vercel.com
3. Agrega variables de entorno: `SPREADSHEET_ID`, `JWT_SECRET`
4. Para `credentials.json` en Vercel: copia el contenido como variable `GOOGLE_CREDENTIALS` y ajusta `sheets.ts` para leerlo
