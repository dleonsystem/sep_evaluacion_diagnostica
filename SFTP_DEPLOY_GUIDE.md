# Guía de Despliegue SFTP - Evaluación Diagnóstica

## 1. Configuración Previa

Crear archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editar las variables SFTP en `.env`:
```env
SFTP_HOST=sftp
SFTP_PORT=22
SFTP_USER=eia_user
SFTP_PASSWORD=TU_PASSWORD_SEGURA_AQUI
SFTP_USERS=eia_user:TU_PASSWORD_SEGURA_AQUI:1001
```

## 2. Pasos para Levantar SFTP

### Opción A: Docker Compose Standalone (desarrollo/local)

```bash
# 1. Crear red si no existe
docker network create app-net

# 2. Crear volumen para datos
docker volume create sftp-data

# 3. Levantar servicio
docker-compose -f docker-compose.sftp.yml up -d

# 4. Verificar logs
docker logs -f eia_sftp
```

### Opción B: Docker Swarm (producción)

```bash
# 1. Asegurar que la red existe en el swarm
docker network create --driver overlay --attachable app-net

# 2. Desplegar stack
docker stack deploy -c docker-compose.sftp.yml eia-sftp

# 3. Verificar servicio
docker service ls | grep sftp
docker service logs eia-sftp_sftp -f
```

## 3. Verificación del Servicio

### Test de conexión:
```bash
# Desde el nodo backend
curl -v telnet://localhost:2222

# O con cliente SFTP
sftp -P 2222 eia_user@localhost
```

### Ver logs:
```bash
# Standalone
docker logs eia_sftp

# Swarm
docker service logs eia-sftp_sftp --tail 100
```

## 4. Configuración GraphQL Server

Asegurar que el `.env` del graphql-server tenga:
```env
SFTP_HOST=sftp
SFTP_PORT=22
SFTP_USER=eia_user
SFTP_PASSWORD=TU_PASSWORD_SEGURA_AQUI
```

Para Swarm, usa el servicio name:
```env
SFTP_HOST=eia-sftp_sftp  # nombre del servicio en la red overlay
SFTP_PORT=22
```

## 5. Estructura de Archivos

```
sep_evaluacion_diagnostica/
├── docker-compose.sftp.yml    # ← Configuración SFTP
├── docker-compose.yml           # Configuración principal
├── .env                         # Variables de entorno
└── SFTP_DEPLOY_GUIDE.md        # ← Esta guía
```

## 6. Troubleshooting

### Error: "Connection refused"
```bash
# Verificar que el puerto está abierto
netstat -tlnp | grep 2222
docker ps | grep sftp
```

### Error: "Authentication failed"
```bash
# Verificar variables de entorno
docker exec eia_sftp printenv | grep SFTP
cat .env | grep SFTP
```

### Reiniciar servicio:
```bash
# Standalone
docker-compose -f docker-compose.sftp.yml restart

# Swarm
docker service update --force eia-sftp_sftp
```

## 7. Comandos Útiles

```bash
# Entrar al contenedor
docker exec -it eia_sftp sh

# Listar archivos subidos
docker exec eia_sftp ls -la /home/eia_user/upload

# Copiar archivo al SFTP
docker cp archivo.txt eia_sftp:/home/eia_user/upload/

# Ver espacio de volumen
docker system df -v | grep sftp-data
```
