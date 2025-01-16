const swaggerJSDoc = require('swagger-jsdoc')

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Location API',
      version: '1.0.0',
      description: 'API documentation for ETP Location Service application',
    },
    servers: [
      {
        url: 'http://localhost:3001', 
      },
    ],
    components: {
        securitySchemes: {
          basicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        },
      },
      security: [
        {
          basicAuth: [],
        },
      ],
  };
  
  const options = {
    swaggerDefinition,
    apis: ['./locationServer.js'], // Path to the API docs (adjust as per your project)
  };
  
  const swaggerSpec = swaggerJSDoc(options);
  
  module.exports = swaggerSpec;
  