# Plan de Pase a Producción
**Sistema de Recepción del Formato de Valoraciones y Emisión de Resultados (SiRVER)**

## Objetivo
Establecer una ruta clara y ordenada para el despliegue en producción del sistema SiRVER, definiendo responsables y criterios de éxito para cada paso del proceso institucional.

---

## Fase 1: Infraestructura y Configuración Inicial
**Objetivo:** Tener el aplicativo desplegado en un servidor interno accesible mediante un nombre de dominio seguro.

* **Paso 1.1: Aprovisionamiento del Servidor Interno**
  * **Responsable:** Equipo de Desarrollo
  * **Acción:** Creación y montaje del servidor para alojar GraphQL y Angular.
* **Paso 1.2: Gestión de DNS y Certificado de Seguridad**
  * **Responsable:** Equipo NUEMS
  * **Acción:** Realizar el trámite para solicitar el DNS y Certificado de seguridad para el servidor interno.
* **Paso 1.3: Configuración de Dominio y Seguridad**
  * **Responsable:** Equipo de Desarrollo
  * **Acción:** Configurar el servidor con el nombre de dominio y el Certificado de Seguridad.

---

## Fase 2: Dictamen de Seguridad (DGTIC)
**Objetivo:** Obtener el visto bueno de seguridad informática por parte de la DGTIC.

* **Paso 2.1: Solicitud de Análisis de Vulnerabilidad**
  * **Responsable:** Equipo NUEMS
  * **Acción:** Solicitar a la DGTIC un análisis de vulnerabilidad al aplicativo o servidor (una vez que sea visible por dominio y con SSL).
* **Paso 2.2: Respuesta de DGTIC**
  * **Responsable:** Equipo DGTIC
  * **Acción:** Responder con las observaciones o recomendaciones técnicas.
* **Paso 2.3: Atención de Observaciones**
  * **Responsable:** Equipo de Desarrollo
  * **Acción:** Atender las observaciones o recomendaciones de seguridad.
* **Paso 2.4: Revisión y Visto Bueno de Seguridad**
  * **Responsable:** Equipo DGTIC
  * **Acción:** Revisar los cambios atendidos y otorgar el visto bueno si todo es correcto.

---

## Fase 3: Validación de Diseño y Comunicación (Comunicación Social)
**Objetivo:** Asegurar que el sistema cumple con los estándares de diseño y estilos institucionales.

* **Paso 3.1: Solicitud de Publicación Inicial**
  * **Responsable:** Equipo NUEMS
  * **Acción:** Realizar la solicitud para la publicación del sistema.
* **Paso 3.2: Solicitud de Revisión de Diseño**
  * **Responsable:** Equipo NUEMS
  * **Acción:** Solicitar a Comunicación Social la revisión del sistema para diseño y estilos.
* **Paso 3.3: Observaciones de Comunicación Social**
  * **Responsable:** Comunicación Social
  * **Acción:** Envío de observaciones y comentarios sobre el diseño.
* **Paso 3.4: Atención de Observaciones de Diseño**
  * **Responsable:** Equipo de Desarrollo y NUEMS
  * **Acción:** Atender las observaciones y comentarios de diseño.
* **Paso 3.5: Visto Bueno de Diseño**
  * **Responsable:** Equipo de Comunicación Social
  * **Acción:** Revisar las observaciones y otorgar el visto bueno si todo es correcto.

---

## Fase 4: Publicación Final a Producción
**Objetivo:** Liberación definitiva del sistema.

* **Paso 4.1: Solicitud de Publicación a Producción**
  * **Responsable:** Equipo NUEMS
  * **Acción:** Con la aprobación del dictamen de Seguridad y de Comunicación Social, solicitar la publicación a producción definitiva del sistema.
