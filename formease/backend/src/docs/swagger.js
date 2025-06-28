// Fichier de configuration Swagger pour la documentation API
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FormEase API',
      version: '1.0.0',
      description: 'Documentation de l’API FormEase',
    },
    servers: [
      { url: 'http://localhost:3000' }
    ],
  },
  apis: ['./src/routes/*.js'], // Ajoutez vos fichiers de routes ici
};

const specs = swaggerJsdoc(options);
module.exports = specs;
