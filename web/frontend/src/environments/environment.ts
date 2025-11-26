export const environment = {
  production: true,
  //graphqlUri: 'https://qa.api.cerrarlabrecha.sep.gob.mx/graphql',
 graphqlUri: ' http://localhost:5005/graphql',

  captcha: {
    /**
     * Habilita el uso del CAPTCHA personalizado en lugar de reCAPTCHA.
     * Debe permanecer en "false" en producción.
     */
    useCustomCaptcha: true,
    /**
     * Permite generar un token sintético cuando reCAPTCHA no está disponible.
     * Controla la ruta de escape para entornos no productivos.
     */
    allowSyntheticTokenFallback: true
  }
};
