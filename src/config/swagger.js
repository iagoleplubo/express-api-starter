// config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Foodtruck API',
            version: '1.0.0',
            description: 'RESTful API for foodtruck management (SQLite, Express).'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local dev server' }
        ]
    },
    apis: ['./src/resources/**/*.js', './src/routes/*.js'] // pick up JSDoc in resources and routes
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;