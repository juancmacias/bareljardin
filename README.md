# Bar El Jardin - Carta Digital

Aplicacion web para gestionar y mostrar la carta digital de un restaurante.

El proyecto incluye:

- Home visual tipo landing con carrusel de categorias.
- Vista de detalle por categoria con platos y video vertical corto (aprox. 5 segundos).
- Panel de administracion para gestionar categorias, platos y activos multimedia.
- Soporte de idioma (auto y manual) para la experiencia de usuario.
- Integracion directa con Supabase para datos y almacenamiento.

Toda la informacion funcional del proyecto se guarda en Supabase:

- Base de datos: categorias, platos, horarios, testimonios y textos.
- Storage: imagenes de categorias y videos de platos.

## Para que sirve este proyecto

Sirve para publicar una carta moderna, visual y editable sin backend propio tradicional.

La idea es que el negocio pueda:

- Actualizar contenido desde un panel web (`/admin`).
- Organizar categorias y subplatos con orden y estado activo/inactivo.
- Mostrar videos e imagenes alojados en Supabase Storage.
- Desplegar rapido en Vercel.

## Stack tecnico

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (Database + Storage + Auth)

## Arquitectura resumida

- Frontend puro con Next.js.
- Lectura de datos desde cliente en `src/lib/supabase-public.ts`.
- Operaciones de administracion con cliente de admin en `src/lib/supabase-admin.ts`.
- Sin backend Python ni capa intermedia `api/*`.

## Requisitos previos

- Node.js 20 o superior
- npm
- Proyecto de Supabase creado y accesible

## Puesta en marcha (local)

1. Clona el repositorio.
2. Entra en la carpeta del proyecto.
3. Instala dependencias.
4. Crea el archivo `.env.local`.
5. Ejecuta el entorno de desarrollo.

```bash
npm install
npm run dev
```

Aplicacion local:

- `http://localhost:3000`

## Variables de entorno

Usa `.env.example` como plantilla y copialo a `.env.local`.

Ejemplo (Windows PowerShell):

```powershell
Copy-Item .env.example .env.local
```

Ejemplo (macOS/Linux):

```bash
cp .env.example .env.local
```

Despues, abre `.env.local` y reemplaza los valores de ejemplo por tus datos reales de Supabase y de acceso admin.

Variables esperadas en `.env.local`:

```dotenv
# Supabase publico
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase privado (admin)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Buckets de storage
NEXT_PUBLIC_SUPABASE_MENU_IMAGES_BUCKET=menu-images
NEXT_PUBLIC_SUPABASE_MENU_ITEM_VIDEOS_BUCKET=menu-item-videos

# Acceso admin
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

# Compatibilidad local
BACKEND_INTERNAL_URL=http://localhost:8000
```

Nota: no subas `.env.local` al repositorio.

## Acceso a /admin (credenciales basicas)

La ruta `/admin` usa credenciales basicas definidas en estas variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Debes configurar ambas en `.env.local` para poder iniciar sesion en el panel.

`ADMIN_SESSION_SECRET` tambien es obligatoria para firmar la sesion de admin.

## Preparar base de datos y storage (Supabase)

Ejecuta los scripts SQL en este orden desde el SQL Editor de Supabase:

1. `sql/001_schema.sql`
2. `sql/002_rls_policies.sql`
3. `sql/003_seed.sql`
4. `sql/004_fix_admin_users_rls_recursion.sql`
5. `sql/005_storage_menu_images.sql`
6. `sql/006_i18n_content_schema.sql`
7. `sql/007_menu_items_schema.sql`
8. `sql/008_storage_menu_item_videos.sql`

Con eso quedaran listas las tablas, politicas y buckets necesarios.

## Rutas principales

- `/` Home principal (redirige a experiencia social)
- `/social` Landing con carrusel de categorias
- `/[...slug]` Detalle de categoria/platos
- `/admin` Panel de administracion
- `/admin/menu-cards/[cardId]` Gestion de platos por categoria

## Recomendacion para videos de platos

- Duracion recomendada: alrededor de 5 segundos por plato.
- Formato recomendado: video vertical corto para carga rapida y mejor experiencia movil.
- Ubicacion: bucket `NEXT_PUBLIC_SUPABASE_MENU_ITEM_VIDEOS_BUCKET` en Supabase Storage.

## Idiomas

- Selector de idioma en la home.
- Modo automatico (segun navegador) y modo manual.
- Persistencia en `localStorage` y query param `lang`.

Ejemplos:

- `/?lang=auto`
- `/?lang=es`
- `/?lang=fr`

## Scripts disponibles

- `npm run dev` Inicia entorno de desarrollo.
- `npm run build` Genera build de produccion.
- `npm run start` Arranca la build en modo produccion.
- `npm run lint` Ejecuta linting.

## Despliegue en Vercel

1. Conecta el repositorio correcto en Vercel (Settings > Git).
2. Define todas las variables de entorno del bloque anterior en el proyecto de Vercel.
3. Lanza deploy desde rama `main`.

Si aparece un error de build por TypeScript, revisa primero que Vercel este leyendo el repositorio y rama correctos.

## Estructura breve

- `src/app` Rutas y vistas (home, social, admin, detalle).
- `src/lib` Clientes y acceso a datos de Supabase.
- `src/video` Recursos de video del proyecto.
- `sql` Scripts de base de datos y storage.
- `doc` Notas tecnicas de apoyo.

## Estado del proyecto

Proyecto funcional para carta digital con gestion de contenido y despliegue en Vercel.

Siguiente evolucion recomendada:

- CI con validacion automatica de build y lint.
- Tests de componentes y flujo admin.
- Hardening de seguridad y permisos por rol.
