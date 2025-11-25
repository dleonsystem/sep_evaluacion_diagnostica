# Frontend

Proyecto Angular generado manualmente para servir como base de la aplicación de Evaluación Diagnóstica.

## Scripts disponibles
- `npm start`: inicia el servidor de desarrollo.
- `npm run build`: genera el build de producción.
- `npm test`: ejecuta las pruebas unitarias con Karma.

> Nota: la instalación de dependencias puede requerir acceso a internet para descargar los paquetes de npm.

## Solución de advertencias en `npm install`
Si durante la instalación aparecen avisos de dependencias obsoletas o vulnerabilidades, sigue estos pasos para mitigarlos:

1. **Actualizar npm** para obtener correcciones de auditoría más recientes:
   ```bash
   npm install -g npm@latest
   ```
2. **Ejecutar la auditoría automática** tras la instalación de dependencias:
   ```bash
   npm audit fix
   ```
3. **Forzar la actualización de paquetes vulnerables** (puede incluir cambios mayores, úsalo con precaución):
   ```bash
   npm audit fix --force
   ```

Los avisos de paquetes obsoletos (por ejemplo, `inflight` o `glob@7`) son emitidos por dependencias transitivas del ecosistema de Node y no impiden que el proyecto funcione. Tras aplicar los pasos anteriores, revisa nuevamente la salida de `npm audit` para confirmar que las vulnerabilidades se hayan reducido.
