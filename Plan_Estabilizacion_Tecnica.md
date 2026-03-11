# Plan de Estabilización Técnica

Este documento define las acciones requeridas para abordar la Deuda Técnica del Sprint 1 y preparar la infraestructura para el Sprint 2.

## SECCIÓN A: Tareas de Gobernanza (DevOps)

### 1. Integración Continua (CI) con GitHub Actions (US-0.1)
**Objetivo:** Automatizar la validación de código en cada Push y Pull Request.

**Acciones:**
1.  Crear archivo `.github/workflows/ci.yml` en la raíz del proyecto.
2.  Definir dos jobs:
    *   `build-backend`: Setup Node.js 18, `npm ci`, `npm run lint`, `npm run build` (en `graphql-server`).
    *   `build-frontend`: Setup Node.js 18, `npm ci`, `npm run build` (en `web/frontend` si existe, o raíz Angular).

**Configuración Técnica (Borrador):**
```yaml
name: CI Pipeline
on: [push, pull_request]

jobs:
  backend-check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./graphql-server
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      # - run: npm test (Habilitar cuando existan tests)
```

### 2. Calidad de Código con Husky y Lint-Staged (US-0.3)
**Objetivo:** Impedir commits con código sucio o errores de sintaxis.

**Acciones:**
1.  Instalar dependencias de desarrollo en raíz (o por proyecto): `husky`, `lint-staged`.
2.  Inicializar Husky: `npx husky install`.
3.  Configurar script `prepare` en `package.json`.
4.  Crear hook `pre-commit`: `npx husky add .husky/pre-commit "npx lint-staged"`.
5.  Configurar `lint-staged` en `package.json`:
    ```json
    "lint-staged": {
      "graphql-server/src/**/*.{ts,js}": ["eslint --fix", "prettier --write"],
      "web/frontend/src/**/*.{ts,js,html}": ["eslint --fix", "prettier --write"]
    }
    ```

---

## SECCIÓN B: Tareas de Refactorización (Backend)

### 1. Resolución Robusta de Rutas para Worker Threads
**Problema:** La ruta `../workers/worker-excel.js` es relativa y falla si la estructura de ejecución cambia (ej. `src/` con `ts-node` vs `dist/` con `node`).

**Solución Técnica:**
Usar `require.resolve` o lógica dinámica basada en extensión de archivo.

```typescript
// En resolvers.ts
const isTsNode = path.extname(__filename) === '.ts';
const workerFileName = isTsNode ? 'worker-excel.ts' : 'worker-excel.js';
// Si es TS-Node, buscamos en src/workers, si es JS (dist), buscamos en dist/workers
// Asumiendo estructura standard:
// src/schema/resolvers.ts -> src/workers/worker-excel.ts (../workers/)
// dist/schema/resolvers.js -> dist/workers/worker-excel.js (../workers/)
const workerPath = path.resolve(__dirname, '../workers/', workerFileName);
```
*Nota:* `worker_threads` en `ts-node` requiere registro de loader o compilar el worker por separado. Para producción (node), el archivo `.js` debe existir en la carpeta correcta.

### 2. Optimización del Servicio SFTP (Keep-Alive)
**Problema:** `SftpService` conecta y desconecta en cada operación.

**Solución Técnica:**
Implementar un patrón Singleton con gestión de estado de conexión.

```typescript
export class SftpService {
  private client: Client;
  private isConnected: boolean = false;

  // ... constructor ...

  async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    try {
      await this.client.connect(this.getConfig());
      this.isConnected = true;
      return true;
    } catch (err) {
      this.isConnected = false;
      return false;
    }
  }

  async uploadFile(...) {
    if (!this.isConnected) await this.connect();
    // ... upload ...
    // NO llamar a end() aquí.
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
    }
  }
}
```
*Consideración:* Manejar timeouts y errores de conexión caída (reintentar conexión si falla operación).

---

## SECCIÓN C: Backlog Restante (Sprint 2)

Una vez estabilizada la base técnica, las siguientes historias de usuario del Sprint 2 se desbloquean:

1.  **US-2.2 Widgets Dashboard (Frontend):** Consumir el nuevo query `getDashboardMetrics`.
2.  **US-2.6 Cliente SFTP (Backend):** Usar el `SftpService` optimizado para subir archivos reales de evaluaciones.
3.  **US-2.3 Exportar Tickets:** Implementar generación de CSV.
4.  **US-2.5 API Legacy:** Crear endpoints REST para integración.

**Prioridad Inmediata:** Ejecutar Sección A y B antes de iniciar US-2.2.
