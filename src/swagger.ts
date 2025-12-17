import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'News API',
      version: '1.0.0',
      description: 'API for News Application',
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'V1 API Server'
      },
      {
        url: 'http://localhost:4000',
        description: 'Root Server'
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, './routes/*.ts'),
    path.join(__dirname, './controllers/*.ts')
  ], 
}

export const specs = swaggerJsdoc(options)
