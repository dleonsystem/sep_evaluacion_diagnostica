export const environment = {
  production: false,
 // graphqlUri: 'https://qa.api.cerrarlabrecha.sep.gob.mx/graphql',
 graphqlUri: ' http://localhost:5005/graphql',
  captcha: {
    /**
     * En producción siempre debe usarse reCAPTCHA.
     */
    useCustomCaptcha: false,
    /**
     * Desactiva la generación de tokens sintéticos para mantener la seguridad.
     */
    allowSyntheticTokenFallback: false
  }
};
