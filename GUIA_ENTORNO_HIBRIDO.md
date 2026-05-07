# 📚 GUÍA DE DESARROLLO HÍBRIDO (CONTROL TOTAL)
## Sistema de Evaluación Diagnóstica - SiCRER

Esta guía resume cómo trabajar de forma segura conectándote a la base de datos externa (`168.255.101.99`) y usando Docker solo para los servicios de soporte.

---

### 1. ⚙️ Configuración del Entorno
Tu archivo `graphql-server/.env` debe tener siempre estos valores para conectar a la oficina/casa:

```env
DB_HOST=168.255.101.99
DB_PORT=5432
DB_NAME=EvaluacionDiagnosticaQA
DB_USER=usr_evaluaciond_qa
```

---

### 2. 🚀 Flujo de Trabajo Diario

Para arrancar el sistema, sigue estos 3 pasos en orden:

#### Paso A: Encender Soporte (Docker)
En una terminal en la raíz del proyecto:
```powershell
docker-compose up -d
```
*Esto encenderá el SFTP. **No** encenderá ninguna base de datos local.*

#### Paso B: Encender Backend (GraphQL)
En otra terminal:
```powershell
cd graphql-server
npm run start:dev
```
*Verifica que en el log diga: `✓ Conexión establecida en host: 168.255.101.99`*

#### Paso C: Encender Frontend (Angular)
En una tercera terminal:
```powershell
cd web/frontend
ng serve
```

---

### 3. 🛡️ Preguntas Frecuentes

**¿Por qué no veo datos?**
Verifica que tu internet tenga acceso a la IP `168.255.101.99`. Si estás en una red restringida, podrías necesitar VPN.

**¿Qué pasa si quiero usar una BD local de verdad?**
1. Instala PostgreSQL en Windows (como dice la guía Win11).
2. Cambia `DB_HOST=localhost` en tu `.env`.
3. **Nunca** uses la base de datos de Docker para desarrollo de código, ya que los datos se borran al borrar el contenedor.

**¿Cómo sé que no estoy en el Docker equivocado?**
Hemos comentado la base de datos en `docker-compose.yml`. Si intentas conectarte a algo que no sea la IP o tu Postgres de Windows, el sistema simplemente fallará en lugar de darte datos falsos.
