# 🔧 Comandos Git para Explorar Diferencias entre Branches

## 📋 Guía de Comandos

Este documento contiene comandos git útiles para explorar las diferencias entre `DEV_VLP_EstructuraDeDatos` y `task/pepenautamx-001-correo-electronico`.

---

## 🎯 Comandos Básicos de Comparación

### Ver archivos modificados

```powershell
# Lista de archivos con su estado (A=Añadido, D=Eliminado, M=Modificado)
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Estadísticas de cambios por archivo
git diff --stat task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Resumen de archivos cambiados
git diff --numstat task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos
```

### Ver commits únicos

```powershell
# Commits en DEV_VLP que NO están en pepenauta
git log --oneline task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Commits en pepenauta que NO están en DEV_VLP
git log --oneline DEV_VLP_EstructuraDeDatos..task/pepenautamx-001-correo-electronico

# Ver con autor y fecha
git log --pretty=format:"%h - %an, %ar : %s" task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos
```

---

## 🔍 Explorar Diferencias Específicas

### Base de Datos

```powershell
# Ver diferencias en DDL
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- ddl_generated.sql

# Ver diferencias en documentación de estructura
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- ESTRUCTURA_DE_DATOS.md

# Ver solo migraciones nuevas
git diff --name-only task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- migration_*.sql
```

### GraphQL Server

```powershell
# Ver cambios en resolvers
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- graphql-server/src/schema/resolvers.ts

# Ver cambios en typeDefs
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- graphql-server/src/schema/typeDefs.ts

# Ver servicios eliminados/añadidos
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- graphql-server/src/services/

# Ver package.json del servidor
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- graphql-server/package.json
```

### Frontend Angular

```powershell
# Ver componentes modificados
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- web/frontend/src/app/components/

# Ver servicios modificados
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- web/frontend/src/app/services/

# Ver rutas modificadas
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- web/frontend/src/app/app.routes.ts

# Ver estilos globales
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- web/frontend/src/styles.scss
```

---

## 📄 Ver Contenido de Archivos en Branches

### Ver archivo específico en cada branch

```powershell
# Ver archivo en pepenauta
git show task/pepenautamx-001-correo-electronico:graphql-server/src/services/mailing.service.ts

# Ver archivo en DEV_VLP (si existe)
git show DEV_VLP_EstructuraDeDatos:ddl_generated.sql

# Comparar un archivo entre branches
git diff task/pepenautamx-001-correo-electronico:graphql-server/package.json DEV_VLP_EstructuraDeDatos:graphql-server/package.json
```

### Ver archivos eliminados

```powershell
# Listar todos los archivos eliminados en DEV_VLP
git diff --name-only --diff-filter=D task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Ver contenido de un archivo eliminado (última versión en pepenauta)
git show task/pepenautamx-001-correo-electronico:graphql-server/src/services/mailing.service.ts
```

### Ver archivos añadidos

```powershell
# Listar todos los archivos añadidos en DEV_VLP
git diff --name-only --diff-filter=A task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Ver contenido de un archivo nuevo
git show DEV_VLP_EstructuraDeDatos:migration_agregar_archivos_tickets.sql
```

---

## 🔀 Comandos de Merge (Preparación)

### Simular merge sin aplicarlo

```powershell
# Ver qué conflictos habría (sin hacer el merge)
git merge --no-commit --no-ff task/pepenautamx-001-correo-electronico

# Si quieres abortar después de revisar
git merge --abort
```

### Crear branch de prueba para merge

```powershell
# Asegurarte de estar en DEV_VLP
git checkout DEV_VLP_EstructuraDeDatos
git pull origin DEV_VLP_EstructuraDeDatos

# Crear branch temporal
git checkout -b temp/test-merge

# Intentar merge
git merge task/pepenautamx-001-correo-electronico

# Si hay conflictos, revisarlos
git status

# Ver archivos con conflictos
git diff --name-only --diff-filter=U

# Abortar si no quieres continuar
git merge --abort

# Volver a DEV_VLP y eliminar branch temporal
git checkout DEV_VLP_EstructuraDeDatos
git branch -D temp/test-merge
```

---

## 📊 Análisis Avanzado

### Analizar cambios por autor

```powershell
# Commits por autor en DEV_VLP
git shortlog --summary --numbered task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Commits por autor en pepenauta
git shortlog --summary --numbered DEV_VLP_EstructuraDeDatos..task/pepenautamx-001-correo-electronico
```

### Buscar cambios específicos

```powershell
# Buscar commits que mencionan "mailing" o "correo"
git log --all --grep="mailing\|correo" --oneline

# Buscar commits que modificaron mailing.service.ts
git log --all --oneline -- graphql-server/src/services/mailing.service.ts

# Ver cuándo se eliminó un archivo
git log --all --full-history -- graphql-server/src/services/mailing.service.ts
```

### Analizar tamaño de cambios

```powershell
# Ver cambios línea por línea (resumen)
git diff --shortstat task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# Ver cambios por tipo de archivo
git diff --stat --diff-filter=A task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "*.ts"
git diff --stat --diff-filter=A task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "*.sql"
git diff --stat --diff-filter=A task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "*.md"
```

---

## 🎯 Cherry-Pick Específico

### Traer commits específicos de pepenauta a DEV_VLP

```powershell
# 1. Identificar el commit que quieres traer
git log task/pepenautamx-001-correo-electronico --oneline | grep -i "correo"

# 2. Ver detalles del commit
git show <commit-hash>

# 3. Asegurarte de estar en DEV_VLP
git checkout DEV_VLP_EstructuraDeDatos

# 4. Traer el commit específico
git cherry-pick <commit-hash>

# Si hay conflictos, resolverlos y continuar
git status
# ... resolver conflictos ...
git add .
git cherry-pick --continue

# O abortar si no funciona
git cherry-pick --abort
```

### Traer archivo específico de pepenauta

```powershell
# Traer mailing.service.ts de pepenauta sin hacer merge
git checkout task/pepenautamx-001-correo-electronico -- graphql-server/src/services/mailing.service.ts

# Ver qué cambió
git status
git diff

# Si te gusta, commitear
git add graphql-server/src/services/mailing.service.ts
git commit -m "feat: restore mailing service from pepenauta branch"

# Si no te gusta, revertir
git checkout HEAD -- graphql-server/src/services/mailing.service.ts
```

---

## 🔍 Encontrar Archivos Clave

### Buscar archivos por patrón

```powershell
# Buscar archivos de migración en pepenauta
git ls-tree -r --name-only task/pepenautamx-001-correo-electronico | Select-String "migration"

# Buscar servicios en DEV_VLP
git ls-tree -r --name-only DEV_VLP_EstructuraDeDatos | Select-String "service"

# Buscar componentes de Angular
git ls-tree -r --name-only task/pepenautamx-001-correo-electronico | Select-String "component.ts$"
```

---

## 📝 Exportar Diferencias

### Crear patch file para revisión

```powershell
# Crear patch de todas las diferencias
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos > diferencias_branches.patch

# Crear patch solo de archivos específicos
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- ddl_generated.sql ESTRUCTURA_DE_DATOS.md > diferencias_db.patch

# Ver el patch
Get-Content diferencias_branches.patch | Select-Object -First 100
```

### Exportar lista de archivos modificados

```powershell
# Exportar a archivo de texto
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos > lista_archivos_modificados.txt

# Ver estadísticas y exportar
git diff --stat task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos > estadisticas_cambios.txt
```

---

## 🛡️ Comandos de Seguridad

### Backup antes de merge

```powershell
# Crear branch de respaldo
git branch backup/pre-merge-$(Get-Date -Format "yyyyMMdd-HHmm")

# Crear tag de respaldo
git tag -a backup-pre-merge -m "Backup antes de merge con pepenauta"

# Push del tag al remoto
git push origin backup-pre-merge
```

### Verificar estado limpio

```powershell
# Verificar que no hay cambios sin commitear
git status

# Verificar que estás en el branch correcto
git branch --show-current

# Verificar la última sincronización con remoto
git fetch --all
git status
```

---

## 📚 Referencias Rápidas

### Ver diferencias en documentación

```powershell
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "*.md"
```

### Ver diferencias en configuración

```powershell
git diff task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- package.json .gitignore "*.config.*"
```

### Ver diferencias en tests

```powershell
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "*.spec.ts" "*.test.ts"
```

---

## 🎬 Workflow Recomendado de Exploración

```powershell
# 1. Actualizar ambos branches
git fetch --all

# 2. Ver resumen general
git diff --stat task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos

# 3. Ver archivos modificados por categoría
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "*.sql"
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "graphql-server/"
git diff --name-status task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos -- "web/frontend/"

# 4. Explorar archivos específicos de interés
git show task/pepenautamx-001-correo-electronico:graphql-server/src/services/mailing.service.ts

# 5. Ver commits relevantes
git log --oneline task/pepenautamx-001-correo-electronico..DEV_VLP_EstructuraDeDatos | Select-Object -First 20

# 6. Decidir estrategia de integración basado en hallazgos
```

---

**Nota:** Todos estos comandos son **de solo lectura** excepto los de la sección "Cherry-Pick" y "Merge". Puedes ejecutarlos sin miedo a modificar tu repositorio.

**Tip:** Usa `| Select-Object -First 50` en PowerShell para limitar la salida de comandos largos.

---

**Creado:** 11 de marzo de 2026  
**Para:** Exploración de diferencias entre branches  
**Repositorio:** dleonsystem/sep_evaluacion_diagnostica
