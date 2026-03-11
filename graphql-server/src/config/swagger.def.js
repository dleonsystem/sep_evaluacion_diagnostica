/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: API Sistema de Evaluación Diagnóstica EIA
 *   version: 1.0.0
 *   description: Documentación de API REST para integración con sistemas legados y servicios auxiliares.
 * servers:
 *   - url: http://localhost:4000/api
 *     description: Servidor de Desarrollo
 * 
 * /legacy/stats/{cct}:
 *   get:
 *     summary: Obtener estadísticas de evaluación por CCT
 *     tags: [Legacy Integration]
 *     parameters:
 *       - in: path
 *         name: cct
 *         schema:
 *           type: string
 *         required: true
 *         description: Clave de Centro de Trabajo
 *     responses:
 *       200:
 *         description: Estadísticas de avance obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cct:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_estudiantes:
 *                       type: integer
 *                     total_evaluaciones:
 *                       type: integer
 *                     porcentaje_completado:
 *                       type: string
 *       404:
 *         description: CCT no encontrada en el sistema
 *       500:
 *         description: Error interno del servidor
 */
