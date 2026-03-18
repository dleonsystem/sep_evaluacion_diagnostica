# 🚀 GUÍA DE INSTALACIÓN LOCAL - WINDOWS 11
## Sistema de Evaluación Diagnóstica SEP - SiCRER

**Última actualización:** 18 de marzo de 2026  
**Sistema Operativo:** Windows 11  
**Propósito:** Instalación completa para desarrollo y pruebas locales

---

## 📑 TABLA DE CONTENIDOS

1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación de Software Base](#-instalación-de-software-base)
3. [Configuración de PostgreSQL](#-configuración-de-postgresql)
4. [Configuración del Backend (GraphQL Server)](#-configuración-del-backend-graphql-server)
5. [Configuración del Frontend (Angular)](#-configuración-del-frontend-angular)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Inicialización de la Base de Datos](#-inicialización-de-la-base-de-datos)
8. [Ejecución de la Aplicación](#-ejecución-de-la-aplicación)
9. [Verificación de Instalación](#-verificación-de-instalación)
10. [Solución de Problemas Comunes](#-solución-de-problemas-comunes)
11. [Servicios Externos Opcionales](#-servicios-externos-opcionales)
12. [Scripts Útiles](#-scripts-útiles)

---

## ✅ REQUISITOS PREVIOS

### Hardware Mínimo Recomendado

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **CPU** | Intel Core i5 (4 cores) | Intel Core i7 (8 cores) |
| **RAM** | 8 GB | 16 GB |
| **Disco** | 10 GB libres (SSD) | 20 GB libres (SSD) |
| **Red** | Conexión a Internet | Conexión estable |

### Software que Instalarás

- ✅ Node.js 18.x o superior
- ✅ PostgreSQL 14.x o superior
- ✅ Git (si aún no lo tienes)
- ✅ Editor de código (VS Code recomendado)
- ✅ PowerShell 7.x (opcional pero recomendado)

### Conocimientos Previos

- 🔧 Uso básico de terminal/PowerShell
- 📦 Conceptos de npm/package managers
- 🗄️ Conceptos básicos de bases de datos

---

## 🛠️ INSTALACIÓN DE SOFTWARE BASE

### 1. Instalar Node.js

**Opción A: Descarga Oficial (Recomendado)**

1. Ve a [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión **LTS** (Long Term Support) - actualmente v18.x o v20.x
3. Ejecuta el instalador `.msi`
4. Durante la instalación:
   - ✅ Marca "Automatically install the necessary tools" (Chocolatey)
   - ✅ Marca "Add to PATH"
5. Reinicia PowerShell después de instalar

**Verificar instalación:**

```powershell
# Abrir PowerShell y ejecutar:
node --version
# Debe mostrar: v18.x.x o superior

npm --version
# Debe mostrar: 9.x.x o superior
```

**Opción B: Usando winget (Windows Package Manager)**

```powershell
# En PowerShell como Administrador:
winget install OpenJS.NodeJS.LTS
```

---

### 2. Instalar PostgreSQL

**Opción A: Instalador Oficial (Recomendado para principiantes)**

1. Ve a [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Descarga **PostgreSQL 14** o superior
3. Ejecuta el instalador
4. Durante la instalación:
   - **Puerto:** Deja el predeterminado `5432`
   - **Superusuario:** `postgres`
   - **Contraseña:** Elige una segura y **ANÓTALA** (ej: `postgres123`)
   - **Locale:** Spanish, Mexico o English, United States
   - Componentes:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4 (interfaz gráfica)
     - ✅ Command Line Tools
     - ❌ Stack Builder (opcional)

5. Al finalizar, marca "Launch Stack Builder" si quieres herramientas adicionales

**Opción B: Usando winget**

```powershell
# En PowerShell como Administrador:
winget install PostgreSQL.PostgreSQL

# Después, configurar contraseña del usuario postgres:
# Se hará en el siguiente paso
```

**Verificar instalación:**

```powershell
# Verificar que psql esté disponible:
psql --version
# Debe mostrar: psql (PostgreSQL) 14.x o superior

# Si no funciona, agregar a PATH manualmente:
# C:\Program Files\PostgreSQL\14\bin
```

**Agregar PostgreSQL al PATH (si es necesario):**

```powershell
# Abrir PowerShell como Administrador y ejecutar:
$env:Path += ";C:\Program Files\PostgreSQL\14\bin"

# Para hacerlo permanente:
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\PostgreSQL\14\bin",
    "Machine"
)
```

---

### 3. Instalar Git (si no lo tienes)

```powershell
# Verificar si ya tienes Git:
git --version

# Si no está instalado, usar winget:
winget install Git.Git

# O descargar desde: https://git-scm.com/download/win
```

---

### 4. Instalar Visual Studio Code (Opcional)

```powershell
winget install Microsoft.VisualStudioCode
```

**Extensiones recomendadas para VS Code:**
- PostgreSQL (por Chris Kolkman)
- TypeScript
- Angular Language Service
- ESLint
- Prettier

---

## 🗄️ CONFIGURACIÓN DE POSTGRESQL

### 1. Crear Base de Datos

**Opción A: Usando pgAdmin 4 (Interfaz Gráfica)**

1. Abre **pgAdmin 4** desde el menú de inicio
2. Conéctate al servidor local (te pedirá la contraseña que pusiste)
3. Click derecho en "Databases" → "Create" → "Database..."
4. Configuración:
   - **Database name:** `eia_db`
   - **Owner:** `postgres`
   - **Encoding:** `UTF8`
   - **Template:** `template0`
   - **Collation:** `es_MX.UTF-8` o `en_US.UTF-8`
5. Click "Save"

**Opción B: Usando línea de comandos (Recomendado)**

```powershell
# Abrir PowerShell y ejecutar:

# Crear base de datos
psql -U postgres -c "CREATE DATABASE eia_db ENCODING 'UTF8' LC_COLLATE='es_MX.UTF-8' LC_CTYPE='es_MX.UTF-8' TEMPLATE=template0;"

# Si tienes error de locale, usa:
psql -U postgres -c "CREATE DATABASE eia_db ENCODING 'UTF8';"

# Te pedirá la contraseña de postgres
```

**Si hay problemas con locale:**

```powershell
# Usar locale en inglés:
psql -U postgres -c "CREATE DATABASE eia_db ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0;"

# O crear sin especificar locale:
psql -U postgres -c "CREATE DATABASE eia_db;"
```

### 2. Crear Usuario de Aplicación (Opcional pero recomendado)

```powershell
# Crear usuario específico para la aplicación:
psql -U postgres -c "CREATE USER eia_user WITH ENCRYPTED PASSWORD 'eia_password_2026';"

# Dar permisos al usuario:
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE eia_db TO eia_user;"

# Conectar a la base de datos:
psql -U postgres -d eia_db -c "GRANT ALL ON SCHEMA public TO eia_user;"
```

### 3. Verificar Conexión

```powershell
# Conectarse a la base de datos:
psql -U postgres -d eia_db

# Deberías ver el prompt:
# eia_db=#

# Ejecutar un query de prueba:
SELECT version();

# Salir:
\q
```

---

## 🔧 CONFIGURACIÓN DEL BACKEND (GRAPHQL SERVER)

### 1. Navegar al Directorio del Proyecto

```powershell
# Abrir PowerShell y navegar al proyecto:
cd C:\VLP\GitHub\sep_evaluacion_diagnostica

# Verificar que estés en el directorio correcto:
Get-Location
# Debe mostrar: C:\VLP\GitHub\sep_evaluacion_diagnostica

# Ir al directorio del backend:
cd graphql-server
```

### 2. Instalar Dependencias del Backend

```powershell
# Estando en C:\VLP\GitHub\sep_evaluacion_diagnostica\graphql-server

# Limpiar caché de npm (opcional pero recomendado):
npm cache clean --force

# Instalar todas las dependencias:
npm install

# Esto instalará:
# - Apollo Server
# - TypeScript
# - node-postgres (pg)
# - XLSX
# - Nodemailer
# - ssh2-sftp-client
# - Y todas las demás dependencias
```

**Tiempo estimado:** 2-5 minutos dependiendo de tu conexión.

**Salida esperada:**
```
added 523 packages, and audited 524 packages in 2m

89 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### 3. Compilar TypeScript

```powershell
# Compilar el código TypeScript a JavaScript:
npm run build

# Esto ejecuta: tsc (TypeScript Compiler)
# Genera archivos .js en la carpeta dist/ o similar
```

**Si hay errores de compilación:**

```powershell
# Ver configuración de TypeScript:
Get-Content tsconfig.json

# Verificar que tienes TypeScript instalado:
npx tsc --version
```

### 4. Verificar Estructura de Archivos

```powershell
# Listar archivos principales:
Get-ChildItem -Recurse -Depth 1 | Select-Object Name

# Deberías ver:
# - src/
# - package.json
# - tsconfig.json
# - node_modules/
# - scripts/
```

---

## 🎨 CONFIGURACIÓN DEL FRONTEND (ANGULAR)

### 1. Navegar al Directorio del Frontend

```powershell
# Desde la raíz del proyecto:
cd C:\VLP\GitHub\sep_evaluacion_diagnostica\web

# Verificar ubicación:
Get-Location
# Debe mostrar: C:\VLP\GitHub\sep_evaluacion_diagnostica\web
```

### 2. Instalar Angular CLI Globalmente

```powershell
# Instalar Angular CLI de forma global:
npm install -g @angular/cli@18

# Verificar instalación:
ng version

# Debe mostrar:
# Angular CLI: 18.x.x
```

### 3. Instalar Dependencias del Frontend

```powershell
# Estando en C:\VLP\GitHub\sep_evaluacion_diagnostica\web

# Instalar dependencias:
npm install

# Esto instalará:
# - Angular 18
# - RxJS
# - SweetAlert2
# - XLSX
# - Y todas las demás dependencias
```

**Tiempo estimado:** 3-7 minutos.

### 4. Compilar (Opcional - para verificar)

```powershell
# Compilar el proyecto Angular (modo desarrollo):
ng build

# O en modo producción:
ng build --configuration production
```

---

## 🔐 VARIABLES DE ENTORNO

### Backend - Archivo `.env`

```powershell
# Navegar al backend:
cd C:\VLP\GitHub\sep_evaluacion_diagnostica\graphql-server

# Crear archivo .env desde PowerShell:
New-Item -ItemType File -Name ".env" -Force

# Abrir con notepad:
notepad .env
```

**Contenido del archivo `.env`:**

```env
# ===================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eia_db
DB_USER=postgres
DB_PASSWORD=postgres123
# ⚠️ Cambia 'postgres123' por TU contraseña real

# Pool de conexiones
DB_POOL_MIN=2
DB_POOL_MAX=10

# ===================================
# CONFIGURACIÓN DEL SERVIDOR
# ===================================
PORT=4000
NODE_ENV=development

# URL de la aplicación (para emails)
APP_URL=http://localhost:4200

# ===================================
# CONFIGURACIÓN DE EMAIL (Gmail)
# ===================================
# ⚠️ IMPORTANTE: Gmail requiere "App Password" si tienes 2FA
# Generar en: https://myaccount.google.com/apppasswords

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password-aqui

# Email "desde" para notificaciones
EMAIL_FROM=Sistema EIA <tu-email@gmail.com>

# ===================================
# CONFIGURACIÓN DE SFTP (OPCIONAL)
# ===================================
# Si no tienes servidor SFTP, puedes dejar valores dummy
# El sistema funcionará sin SFTP (solo no sincronizará archivos)

SFTP_HOST=localhost
SFTP_PORT=2222
SFTP_USER=sftp_user
SFTP_PASSWORD=sftp_password

# ===================================
# CONFIGURACIÓN DE SEGURIDAD
# ===================================
# Secreto para tokens (genera uno aleatorio)
JWT_SECRET=cambiar_por_secreto_aleatorio_muy_largo_y_seguro_2026

# CORS - Permitir frontend local
CORS_ORIGIN=http://localhost:4200

# ===================================
# LOGS Y DEBUG
# ===================================
LOG_LEVEL=debug
# Opciones: error, warn, info, debug, verbose

# ===================================
# OTROS
# ===================================
# Timeout de queries (milisegundos)
DB_QUERY_TIMEOUT=30000

# Tamaño máximo de archivo (bytes) - 10MB
MAX_FILE_SIZE=10485760
```

**Guardar el archivo** (Ctrl+S) y cerrar Notepad.

### Configuración de Gmail para Envío de Correos

**Si usas Gmail con autenticación de dos factores (2FA):**

1. Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Inicia sesión con tu cuenta de Gmail
3. Click en "Generar" → Nombre: "Sistema EIA"
4. Copia la contraseña generada (16 caracteres sin espacios)
5. Pégala en `SMTP_PASSWORD` en el archivo `.env`

**Si NO usas 2FA (menos seguro):**

1. Ve a [https://myaccount.google.com/lesssecureapps](https://myaccount.google.com/lesssecureapps)
2. Activa "Permitir aplicaciones menos seguras"
3. Usa tu contraseña normal en `SMTP_PASSWORD`

**Alternativa: Usar servicio de prueba (Mailtrap, Ethereal)**

```env
# Ejemplo con Ethereal (emails de prueba)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario-generado@ethereal.email
SMTP_PASSWORD=password-generado

# Registrarse en: https://ethereal.email/
```

### Frontend - Variables de Entorno (Opcional)

El frontend de Angular generalmente no necesita archivo `.env` para desarrollo local, ya que apunta automáticamente a `http://localhost:4000/graphql` cuando detecta que está en puerto 4200.

**Si necesitas configurar manualmente:**

Abre `web/frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  graphqlEndpoint: 'http://localhost:4000/graphql',
  apiUrl: 'http://localhost:4000',
};
```

---

## 🗃️ INICIALIZACIÓN DE LA BASE DE DATOS

### 1. Ejecutar DDL Principal

El archivo `ddl_generated.sql` contiene todas las definiciones de tablas, funciones, triggers, etc.

```powershell
# Navegar a la raíz del proyecto:
cd C:\VLP\GitHub\sep_evaluacion_diagnostica

# Ejecutar el DDL completo:
psql -U postgres -d eia_db -f ddl_generated.sql

# Te pedirá la contraseña de postgres
```

**Salida esperada:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE FUNCTION
CREATE TRIGGER
...
(muchas líneas)
...
ALTER TABLE
COMMENT ON TABLE
```

**Si hay errores:**

- **Error: "extension uuid-ossp does not exist"**
  ```powershell
  psql -U postgres -d eia_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
  ```

- **Error: "role does not exist"**
  ```powershell
  # Crear el usuario primero (ver sección de PostgreSQL)
  ```

### 2. Ejecutar Scripts de Datos Iniciales

```powershell
# Navegar al directorio de scripts:
cd graphql-server\scripts

# Listar scripts disponibles:
Get-ChildItem *.sql | Select-Object Name

# Ejecutar scripts importantes en orden:

# 1. Crear usuario administrador:
psql -U postgres -d eia_db -f crear_usuario_admin.sql

# 2. Datos semilla (catálogos):
psql -U postgres -d eia_db -f seed-data.sql

# 3. Otros scripts según necesidad:
# psql -U postgres -d eia_db -f nombre_script.sql
```

### 3. Verificar que las Tablas se Crearon

```powershell
# Conectar a la base de datos:
psql -U postgres -d eia_db

# Listar todas las tablas:
\dt

# Deberías ver algo como:
# public | usuarios | table | postgres
# public | escuelas | table | postgres
# public | estudiantes | table | postgres
# public | evaluaciones | table | postgres
# ... (59 tablas en total)

# Ver estructura de una tabla:
\d usuarios

# Contar registros en usuarios:
SELECT COUNT(*) FROM usuarios;

# Salir:
\q
```

### 4. Crear Usuario Administrador Inicial (Manual)

Si el script `crear_usuario_admin.sql` no existe o no funcionó:

```powershell
# Conectar a la BD:
psql -U postgres -d eia_db
```

```sql
-- Insertar usuario administrador:
INSERT INTO usuarios (
    email,
    password_hash,
    nombre,
    apepaterno,
    apematerno,
    rol,
    activo,
    fecha_registro,
    updated_at
) VALUES (
    'admin@sep.gob.mx',
    -- Password: Admin2026! (ya hasheado con scrypt)
    -- Tendrás que generar el hash real o usar contraseña temporal
    'salt:hash',
    'Administrador',
    'Sistema',
    'EIA',
    'COORDINADOR_FEDERAL',
    true,
    NOW(),
    NOW()
);
```

**Nota:** Para generar el hash correcto, es mejor crear el usuario desde la aplicación usando la mutation `createUser` una vez que el servidor esté corriendo.

### 5. Verificar Funciones y Triggers

```powershell
psql -U postgres -d eia_db
```

```sql
-- Listar funciones:
\df

-- Listar triggers:
SELECT tgname, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgisinternal = false
ORDER BY tgrelid::regclass::text, tgname;

-- Salir:
\q
```

---

## ▶️ EJECUCIÓN DE LA APLICACIÓN

### 1. Iniciar el Backend (GraphQL Server)

**Opción A: Modo Desarrollo (con auto-reload)**

```powershell
# Abrir una nueva ventana de PowerShell
# Navegar al backend:
cd C:\VLP\GitHub\sep_evaluacion_diagnostica\graphql-server

# Iniciar en modo desarrollo:
npm run dev

# Esto ejecuta: nodemon o ts-node-dev con auto-reload
```

**Opción B: Modo Producción (compilado)**

```powershell
# Compilar primero:
npm run build

# Iniciar:
npm start
```

**Salida esperada:**
```
🚀 GraphQL Server ready at http://localhost:4000/graphql
🗄️  Database connected successfully
📧 Mail service configured
📁 SFTP service configured
```

**Si hay errores:**

- **"Error: connect ECONNREFUSED 127.0.0.1:5432"**
  - PostgreSQL no está corriendo
  - Solución: Iniciar servicio PostgreSQL
    ```powershell
    # En PowerShell como Administrador:
    Start-Service postgresql-x64-14
    
    # O buscar el servicio:
    Get-Service *postgres* | Start-Service
    ```

- **"Error: password authentication failed for user"**
  - Contraseña incorrecta en `.env`
  - Verifica `DB_PASSWORD` en el archivo `.env`

- **"Error: database 'eia_db' does not exist"**
  - No creaste la base de datos
  - Vuelve a la sección de PostgreSQL

### 2. Verificar Backend con GraphQL Playground

1. Abre tu navegador
2. Ve a: [http://localhost:4000/graphql](http://localhost:4000/graphql)
3. Deberías ver **Apollo Sandbox** o **GraphQL Playground**
4. Ejecuta una query de prueba:

```graphql
query HealthCheck {
  healthCheck {
    status
    timestamp
    database {
      connected
      latency
    }
  }
}
```

**Respuesta esperada:**
```json
{
  "data": {
    "healthCheck": {
      "status": "OK",
      "timestamp": "2026-03-18T10:30:00.000Z",
      "database": {
        "connected": true,
        "latency": 5
      }
    }
  }
}
```

### 3. Iniciar el Frontend (Angular)

**Abrir OTRA ventana de PowerShell** (mantén la del backend abierta):

```powershell
# Navegar al frontend:
cd C:\VLP\GitHub\sep_evaluacion_diagnostica\web

# Iniciar servidor de desarrollo:
ng serve

# O con puerto específico:
ng serve --port 4200 --open

# --open abre el navegador automáticamente
```

**Salida esperada:**
```
✔ Browser application bundle generation complete.

Initial Chunk Files   | Names         |  Raw Size
main.js               | main          |  XXX kB
polyfills.js          | polyfills     |  XXX kB
styles.css            | styles        |  XXX kB

                      | Initial Total |  XXX kB

Build at: 2026-03-18T10:35:00.000Z - Hash: xxxxx - Time: 5000ms

** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **


√ Compiled successfully.
```

### 4. Abrir la Aplicación en el Navegador

1. Abre tu navegador (Chrome, Edge, Firefox)
2. Ve a: [http://localhost:4200](http://localhost:4200)
3. Deberías ver la **página de inicio** de la aplicación EIA

---

## ✔️ VERIFICACIÓN DE INSTALACIÓN

### Checklist Completo

#### 1. PostgreSQL

```powershell
# Verificar servicio corriendo:
Get-Service *postgres*

# Estado debe ser "Running"

# Verificar conexión:
psql -U postgres -d eia_db -c "SELECT version();"
```

#### 2. Backend

```powershell
# Verificar que el proceso esté corriendo:
Get-Process -Name node

# Debe mostrar al menos 1 proceso de node.js

# Verificar endpoint GraphQL:
# En navegador: http://localhost:4000/graphql
# Debe mostrar Apollo Sandbox
```

**Prueba completa de backend:**

```graphql
# En Apollo Sandbox (http://localhost:4000/graphql)

# 1. HealthCheck
query {
  healthCheck {
    status
    database { connected }
  }
}

# 2. Listar usuarios
query {
  listUsers(limit: 10) {
    nodes {
      id
      email
      nombre
    }
    totalCount
  }
}

# 3. Obtener preguntas frecuentes
query {
  getPreguntasFrecuentes {
    id
    pregunta
    respuesta
  }
}
```

#### 3. Frontend

```powershell
# Verificar que ng serve está corriendo:
# Deberías tener una ventana de PowerShell con logs de Angular

# Abrir navegador en:
# http://localhost:4200
```

**Prueba completa de frontend:**

1. **Página de Inicio:**
   - ✅ Logo SEP visible
   - ✅ Menú de navegación funcional
   - ✅ Botón "Iniciar Sesión" funcional

2. **Página de Login:**
   - ✅ Formulario con email/contraseña
   - ✅ Link "¿Olvidaste tu contraseña?"
   - ✅ Validación de campos

3. **Carga Masiva (sin login):**
   - ✅ Botón de selección de archivo
   - ✅ Validación de formato
   - ✅ Mensajes de error si subes archivo inválido

4. **Preguntas Frecuentes:**
   - ✅ Lista de preguntas cargadas desde BD
   - ✅ Acordeón funcional

#### 4. Integración Frontend ↔ Backend

```javascript
// Abrir DevTools en el navegador (F12)
// Ir a Console y ejecutar:

fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '{ healthCheck { status } }'
  })
})
.then(r => r.json())
.then(d => console.log(d));

// Debe retornar:
// { data: { healthCheck: { status: "OK" } } }
```

#### 5. Base de Datos

```powershell
# Conectar:
psql -U postgres -d eia_db

# Ejecutar:
\dt  -- Listar tablas (debe mostrar ~59 tablas)
SELECT COUNT(*) FROM usuarios;  -- Debe ser > 0 si creaste admin
SELECT COUNT(*) FROM cat_nivel_educativo;  -- Debe tener catálogos
\q
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: "Puerto 4000 ya está en uso"

```powershell
# Encontrar proceso usando el puerto 4000:
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess

# Ver qué proceso es:
Get-Process -Id <PID_DEL_PROCESO>

# Matar el proceso:
Stop-Process -Id <PID_DEL_PROCESO> -Force

# O cambiar el puerto en .env:
# PORT=4001
```

### Problema 2: "Puerto 4200 ya está en uso"

```powershell
# Angular en otro puerto:
ng serve --port 4201

# O matar proceso:
Get-NetTCPConnection -LocalPort 4200 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Problema 3: "CORS error" en navegador

**Error en consola:**
```
Access to fetch at 'http://localhost:4000/graphql' from origin 'http://localhost:4200'
has been blocked by CORS policy
```

**Solución:**

Verificar en `graphql-server/src/index.ts` que CORS esté configurado:

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
});
```

O en `.env`:
```env
CORS_ORIGIN=http://localhost:4200
```

### Problema 4: "Cannot find module" en backend

```powershell
# Reinstalar dependencias:
cd graphql-server
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problema 5: "Error de conexión a PostgreSQL"

```powershell
# Verificar que PostgreSQL está corriendo:
Get-Service *postgres*

# Si está detenido:
Start-Service postgresql-x64-14

# Verificar puerto correcto (5432):
psql -U postgres -h localhost -p 5432

# Verificar password en .env coincide con la real
```

### Problema 6: "Module not found" en Angular

```powershell
cd web
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
ng serve
```

### Problema 7: "Cannot read properties of undefined" en frontend

**Causa:** Backend no está corriendo o no responde.

**Solución:**
1. Verifica que el backend esté corriendo (`npm run dev` en graphql-server)
2. Verifica en DevTools → Network que la petición a GraphQL se hace correctamente
3. Verifica que no hay errores en la consola del backend

### Problema 8: "Compilation errors" en TypeScript (backend)

```powershell
# Ver errores detallados:
npx tsc --noEmit

# Soluciones comunes:
# 1. Verificar que tsconfig.json es correcto
# 2. Instalar tipos faltantes:
npm install --save-dev @types/node @types/uuid

# 3. Limpiar caché:
npx tsc --build --clean
npm run build
```

### Problema 9: Email no se envía

**Síntomas:** Timeout al intentar enviar email.

**Soluciones:**

1. **Verificar credenciales Gmail:**
   - ¿Usas App Password si tienes 2FA?
   - ¿Contraseña correcta en `.env`?

2. **Firewall bloqueando puerto 465/587:**
   ```powershell
   # Probar conexión:
   Test-NetConnection -ComputerName smtp.gmail.com -Port 465
   
   # Debe mostrar: TcpTestSucceeded : True
   ```

3. **Usar servicio de prueba temporal:**
   - Ethereal: [https://ethereal.email/](https://ethereal.email/)
   - Mailtrap: [https://mailtrap.io/](https://mailtrap.io/)

### Problema 10: Worker Thread falla al procesar Excel

**Error:** `Worker exited with code 1`

**Soluciones:**

1. **Verificar que worker-excel.js existe:**
   ```powershell
   Get-ChildItem graphql-server\src\workers\worker-excel.*
   
   # Debe existir worker-excel.ts
   # Y después de compilar, worker-excel.js en dist/
   ```

2. **Compilar TypeScript:**
   ```powershell
   cd graphql-server
   npm run build
   ```

3. **Ver logs del worker:**
   - Los logs aparecen en la consola del backend
   - Buscar líneas con "Worker error"

### Problema 11: Archivos Excel no se validan

**Síntomas:** Archivo válido muestra errores de validación.

**Causas comunes:**
- Formato Excel incorrecto (debe ser `.xlsx`)
- Hojas con nombres en mayúsculas/minúsculas incorrectas
- CCT con formato inválido
- Valoraciones fuera del rango 0-3

**Solución:**
1. Verifica el archivo con plantilla oficial
2. Revisa mensajes de error específicos en la interfaz
3. Consulta logs del backend para detalles

---

## 🌐 SERVICIOS EXTERNOS OPCIONALES

### SFTP Server (Opcional)

El sistema puede funcionar **sin SFTP**. Los archivos se guardarán en la base de datos pero no se sincronizarán a servidor externo.

**Si quieres instalar un servidor SFTP local para pruebas:**

#### Opción 1: OpenSSH Server (Incluido en Windows 11)

```powershell
# Verificar si OpenSSH Server está instalado:
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'

# Si no está instalado:
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# Iniciar servicio:
Start-Service sshd

# Configurar inicio automático:
Set-Service -Name sshd -StartupType 'Automatic'

# Verificar que está corriendo:
Get-Service sshd

# El servidor SFTP estará en puerto 22
```

**Configurar en `.env`:**
```env
SFTP_HOST=localhost
SFTP_PORT=22
SFTP_USER=tu-usuario-windows
SFTP_PASSWORD=tu-password-windows
```

#### Opción 2: Docker con servidor SFTP

```powershell
# Si tienes Docker Desktop instalado:
docker run -d `
  -p 2222:22 `
  -e SFTP_USERS='sftp_user:sftp_password:::uploads' `
  --name sftp-server `
  atmoz/sftp

# Configurar en .env:
# SFTP_HOST=localhost
# SFTP_PORT=2222
# SFTP_USER=sftp_user
# SFTP_PASSWORD=sftp_password
```

### Mailtrap (Servicio de Email de Prueba)

Si no quieres usar tu Gmail real:

1. Regístrate en [https://mailtrap.io/](https://mailtrap.io/) (gratis)
2. Crea un inbox
3. Copia las credenciales SMTP
4. Actualiza `.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=tu-usuario-mailtrap
SMTP_PASSWORD=tu-password-mailtrap
```

**Ventaja:** Todos los emails se capturan en Mailtrap, puedes verlos sin enviarlos realmente.

---

## 📜 SCRIPTS ÚTILES

### Script 1: Iniciar Todo (Backend + Frontend)

Crea un archivo `start-all.ps1` en la raíz del proyecto:

```powershell
# C:\VLP\GitHub\sep_evaluacion_diagnostica\start-all.ps1

Write-Host "🚀 Iniciando Sistema EIA..." -ForegroundColor Green

# Verificar PostgreSQL
$pgService = Get-Service *postgres* -ErrorAction SilentlyContinue
if ($pgService.Status -ne 'Running') {
    Write-Host "⚠️  Iniciando PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
}

# Iniciar Backend en nueva ventana
Write-Host "📡 Iniciando Backend GraphQL..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\graphql-server'; npm run dev"

# Esperar 5 segundos
Write-Host "⏳ Esperando backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar Frontend en nueva ventana
Write-Host "🎨 Iniciando Frontend Angular..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\web'; ng serve --open"

Write-Host "✅ Sistema iniciado!" -ForegroundColor Green
Write-Host "Backend: http://localhost:4000/graphql" -ForegroundColor White
Write-Host "Frontend: http://localhost:4200" -ForegroundColor White
```

**Ejecutar:**
```powershell
cd C:\VLP\GitHub\sep_evaluacion_diagnostica
.\start-all.ps1
```

### Script 2: Resetear Base de Datos

Crea `reset-database.ps1`:

```powershell
# C:\VLP\GitHub\sep_evaluacion_diagnostica\reset-database.ps1

Write-Host "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos!" -ForegroundColor Red
$confirm = Read-Host "¿Estás seguro? (escribe 'SI' para confirmar)"

if ($confirm -eq 'SI') {
    Write-Host "🗑️  Eliminando base de datos..." -ForegroundColor Yellow
    psql -U postgres -c "DROP DATABASE IF EXISTS eia_db;"
    
    Write-Host "🆕 Creando base de datos nueva..." -ForegroundColor Cyan
    psql -U postgres -c "CREATE DATABASE eia_db;"
    
    Write-Host "📊 Ejecutando DDL..." -ForegroundColor Cyan
    psql -U postgres -d eia_db -f "$PSScriptRoot\ddl_generated.sql"
    
    Write-Host "🌱 Cargando datos semilla..." -ForegroundColor Cyan
    psql -U postgres -d eia_db -f "$PSScriptRoot\graphql-server\scripts\seed-data.sql"
    
    Write-Host "✅ Base de datos reseteada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "❌ Operación cancelada." -ForegroundColor Yellow
}
```

### Script 3: Verificar Estado del Sistema

Crea `check-status.ps1`:

```powershell
# C:\VLP\GitHub\sep_evaluacion_diagnostica\check-status.ps1

Write-Host "🔍 Verificando estado del sistema..." -ForegroundColor Cyan
Write-Host ""

# PostgreSQL
Write-Host "--- PostgreSQL ---" -ForegroundColor Yellow
$pgStatus = Get-Service *postgres* -ErrorAction SilentlyContinue
if ($pgStatus) {
    Write-Host "✅ Servicio: $($pgStatus.Status)" -ForegroundColor Green
} else {
    Write-Host "❌ No encontrado" -ForegroundColor Red
}

# Backend (puerto 4000)
Write-Host ""
Write-Host "--- Backend GraphQL ---" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/graphql" -Method GET -TimeoutSec 2
    Write-Host "✅ Respondiendo en puerto 4000" -ForegroundColor Green
} catch {
    Write-Host "❌ No responde" -ForegroundColor Red
}

# Frontend (puerto 4200)
Write-Host ""
Write-Host "--- Frontend Angular ---" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200" -Method GET -TimeoutSec 2
    Write-Host "✅ Respondiendo en puerto 4200" -ForegroundColor Green
} catch {
    Write-Host "❌ No responde" -ForegroundColor Red
}

# Node.js
Write-Host ""
Write-Host "--- Node.js ---" -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Versión: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ No instalado" -ForegroundColor Red
}

# Angular CLI
Write-Host ""
Write-Host "--- Angular CLI ---" -ForegroundColor Yellow
$ngVersion = ng version --json 2>$null | ConvertFrom-Json
if ($ngVersion) {
    Write-Host "✅ Versión: $($ngVersion.angular.cli)" -ForegroundColor Green
} else {
    Write-Host "❌ No instalado" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 Verificación completa" -ForegroundColor Cyan
```

### Script 4: Backup de Base de Datos

Crea `backup-database.ps1`:

```powershell
# C:\VLP\GitHub\sep_evaluacion_diagnostica\backup-database.ps1

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$PSScriptRoot\backups\eia_db_backup_$timestamp.sql"

# Crear carpeta backups si no existe
if (!(Test-Path "$PSScriptRoot\backups")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot\backups"
}

Write-Host "💾 Creando backup de base de datos..." -ForegroundColor Cyan

pg_dump -U postgres -d eia_db -F p -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
    
    # Mostrar tamaño
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "📦 Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor White
} else {
    Write-Host "❌ Error al crear backup" -ForegroundColor Red
}
```

### Script 5: Restaurar Backup

Crea `restore-database.ps1`:

```powershell
# C:\VLP\GitHub\sep_evaluacion_diagnostica\restore-database.ps1

Write-Host "📂 Backups disponibles:" -ForegroundColor Cyan
Get-ChildItem "$PSScriptRoot\backups\*.sql" | ForEach-Object {
    Write-Host "  - $($_.Name)"
}

$backupName = Read-Host "Nombre del archivo a restaurar"
$backupPath = "$PSScriptRoot\backups\$backupName"

if (!(Test-Path $backupPath)) {
    Write-Host "❌ Archivo no encontrado" -ForegroundColor Red
    exit
}

Write-Host "⚠️  Esto eliminará la base de datos actual!" -ForegroundColor Yellow
$confirm = Read-Host "¿Continuar? (SI/NO)"

if ($confirm -eq 'SI') {
    Write-Host "🗑️  Eliminando base de datos actual..." -ForegroundColor Yellow
    psql -U postgres -c "DROP DATABASE IF EXISTS eia_db;"
    
    Write-Host "🆕 Creando base de datos..." -ForegroundColor Cyan
    psql -U postgres -c "CREATE DATABASE eia_db;"
    
    Write-Host "📥 Restaurando backup..." -ForegroundColor Cyan
    psql -U postgres -d eia_db -f $backupPath
    
    Write-Host "✅ Restauración completa" -ForegroundColor Green
} else {
    Write-Host "❌ Cancelado" -ForegroundColor Yellow
}
```

---

## 🎯 PRIMEROS PASOS DESPUÉS DE LA INSTALACIÓN

### 1. Crear Usuario Administrador

**Opción A: Desde GraphQL Playground**

1. Ve a [http://localhost:4000/graphql](http://localhost:4000/graphql)
2. Ejecuta esta mutation:

```graphql
mutation CrearAdmin {
  createUser(input: {
    email: "admin@sistema.local"
    nombre: "Coordinador"
    apepaterno: "Sistema"
    apematerno: "EIA"
    rol: "COORDINADOR_FEDERAL"
    password: "Admin2026!"
  }) {
    id
    email
    rol
  }
}
```

**Opción B: Desde SQL**

```powershell
psql -U postgres -d eia_db
```

```sql
-- Generar hash (temporal - cambiar después):
-- Password: Admin2026!
-- Salt: 0123456789abcdef (ejemplo)
-- Hash: (ejecutar en Node.js para generar hash real)

INSERT INTO usuarios (
    email, password_hash, nombre, apepaterno, apematerno,
    rol, activo, fecha_registro, updated_at
) VALUES (
    'admin@sistema.local',
    'ejemplo_salt:ejemplo_hash',
    'Coordinador', 'Sistema', 'EIA',
    'COORDINADOR_FEDERAL',
    true, NOW(), NOW()
);
```

### 2. Crear Usuario Regular para Pruebas

```graphql
mutation CrearDirector {
  createUser(input: {
    email: "director@escuela.local"
    nombre: "Juan"
    apepaterno: "Pérez"
    apematerno: "García"
    rol: "DIRECTOR"
    password: "Director2026!"
    clavesCCT: ["09DPR0001A"]
  }) {
    id
    email
    rol
    centrosTrabajo {
      claveCCT
      nombre
    }
  }
}
```

### 3. Probar Login

1. Ve a [http://localhost:4200/login](http://localhost:4200/login)
2. Ingresa credenciales:
   - Email: `admin@sistema.local`
   - Password: `Admin2026!`
3. Deberías ser redirigido a `/admin/dashboard`

### 4. Probar Carga de Archivo Excel

**Necesitas un archivo Excel de prueba con la estructura correcta.**

Ejemplo de estructura mínima (hoja ESC):

| | A | B | C | D |
|---|---|---|---|---|
| 8 | | | CCT : | 09DPR0001A |
| 10 | | | TURNO : | MATUTINO |
| 12 | | | NOMBRE DE LA ESCUELA : | ESCUELA PRUEBA |
| 17 | | | CORREO: | director@escuela.local |

Hoja PRIMERO (ejemplo):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| NÚM. LISTA | NOMBRE | SEXO | GRUPO | VALORACIÓN | C1-A1 | C1-A2 | ... |
| 1 | Juan Pérez | M | A | | 2 | 3 | ... |

1. Ve a [http://localhost:4200/carga-masiva](http://localhost:4200/carga-masiva)
2. Selecciona archivo Excel
3. Sistema validará estructura
4. Si es válido, generará credenciales
5. Guarda el archivo en BD
6. Descarga comprobante PDF

---

## 📚 RECURSOS ADICIONALES

### Documentación del Proyecto

- [RESUMEN_IMPLEMENTACION_ACTUAL.md](RESUMEN_IMPLEMENTACION_ACTUAL.md) - Documentación técnica completa
- [API_SPECIFICATION.md](API_SPECIFICATION.md) - Especificación de API GraphQL
- [FLUJO_DE_DATOS_COMPLETO.md](FLUJO_DE_DATOS_COMPLETO.md) - Flujos de datos
- [ESTRUCTURA_DE_DATOS.md](ESTRUCTURA_DE_DATOS.md) - Modelo de datos

### Tutoriales y Referencias

**PostgreSQL:**
- [Documentación oficial](https://www.postgresql.org/docs/)
- [Tutorial psql](https://www.postgresql.org/docs/current/app-psql.html)

**Node.js:**
- [Node.js Docs](https://nodejs.org/docs/)
- [npm Docs](https://docs.npmjs.com/)

**GraphQL:**
- [GraphQL Docs](https://graphql.org/learn/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)

**Angular:**
- [Angular Docs](https://angular.io/docs)
- [Angular CLI](https://angular.io/cli)

### Herramientas Recomendadas

1. **Postman** - Para probar API GraphQL
   - [Descargar](https://www.postman.com/downloads/)

2. **DBeaver** - Cliente alternativo para PostgreSQL
   - [Descargar](https://dbeaver.io/download/)

3. **Altair GraphQL Client** - Cliente GraphQL standalone
   - [Descargar](https://altairgraphql.dev/)

---

## 🆘 SOPORTE

### Logs del Sistema

**Backend logs:**
```powershell
# Los logs aparecen en la consola donde ejecutaste npm run dev
# Para guardar en archivo:
cd graphql-server
npm run dev 2>&1 | Tee-Object -FilePath logs.txt
```

**Frontend logs:**
- Abrir DevTools en navegador (F12)
- Pestaña "Console" para errores JavaScript
- Pestaña "Network" para peticiones HTTP/GraphQL

**PostgreSQL logs:**
```powershell
# Ubicación típica:
# C:\Program Files\PostgreSQL\14\data\log\

# Ver últimos logs:
Get-Content "C:\Program Files\PostgreSQL\14\data\log\*.log" -Tail 50
```

### Comandos de Diagnóstico

```powershell
# Ver procesos Node.js:
Get-Process node

# Ver puertos en uso:
Get-NetTCPConnection | Where-Object {$_.LocalPort -in @(4000,4200,5432)}

# Ver servicios PostgreSQL:
Get-Service *postgres*

# Probar conexión a BD:
Test-NetConnection -ComputerName localhost -Port 5432

# Ver versiones instaladas:
node --version
npm --version
ng version
psql --version
```

---

## 🎉 ¡LISTO PARA DESARROLLAR!

Si llegaste hasta aquí y todos los pasos funcionaron, deberías tener:

✅ PostgreSQL corriendo con base de datos inicializada  
✅ Backend GraphQL respondiendo en [http://localhost:4000/graphql](http://localhost:4000/graphql)  
✅ Frontend Angular corriendo en [http://localhost:4200](http://localhost:4200)  
✅ Integración frontend-backend funcionando  
✅ Usuario administrador creado  
✅ Sistema listo para pruebas y desarrollo

### Próximos Pasos Recomendados

1. **Familiarízate con la interfaz:**
   - Explora el dashboard administrativo
   - Prueba crear un ticket de soporte
   - Navega por las diferentes secciones

2. **Prueba el flujo completo de carga:**
   - Valida un archivo Excel
   - Guarda en la base de datos
   - Verifica que los datos se insertaron correctamente

3. **Explora la API GraphQL:**
   - Ejecuta diferentes queries en Apollo Sandbox
   - Prueba las mutations
   - Familiarízate con el esquema

4. **Revisa el código:**
   - Backend: `graphql-server/src/`
   - Frontend: `web/frontend/src/app/`
   - Entiende la arquitectura

5. **Configura servicios opcionales:**
   - SFTP para sincronización de archivos
   - Email real para notificaciones

---

**¿Encontraste algún problema no listado aquí?**

Revisa los logs del backend y frontend, y verifica que:
- Todas las dependencias se instalaron correctamente
- PostgreSQL está corriendo
- Las variables de entorno están bien configuradas
- No hay conflictos de puertos

**¡Éxito en tu desarrollo!** 🚀

---

*Documento creado el 18 de marzo de 2026*  
*Para instalación en Windows 11*
