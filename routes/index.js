/*
    Including all the paths, when the request where to landed and possible to perform all the operations
*/

const userRoutes = require('./user');
const motorRoutes = require('./motor');

async function loadAllRoutes(fastify, options)
{
  fastify.register(userRoutes);
  fastify.register(motorRoutes);
}

module.exports = loadAllRoutes;