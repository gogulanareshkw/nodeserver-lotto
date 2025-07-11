const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_doc.json'
const endpointsFiles = ['./server.js']
const doc = {
    info: {
        version: "1.0.0",
        title: "A2ZLotto server API documentation",
        description: "Documentation automatically generated by the <b>swagger-autogen</b> module."
    },
    host: "localhost:3001",
    //host: "a2zlotto.com",
    basePath: "/",
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
}

swaggerAutogen(outputFile, endpointsFiles, doc)