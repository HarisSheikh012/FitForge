import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FitForge API',
      version: '1.0.0',
      description: 'Multi-tenant Gym Management SaaS REST API. All tenant-scoped endpoints require a valid Bearer token.',
      contact: {
        name: 'FitForge — Haris Babar',
        url: 'https://github.com/HarisSheikh012/fitforge',
      },
    },
    servers: [
      {
        url: `${config.appUrl}/api`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
