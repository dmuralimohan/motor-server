const { fastify , logger } = require('./plugins/fastify');
const { admin } = require('./plugins/firebase');

//fastify.register(require('./plugins/db'));(mongodb)

fastify.register(require('./routes'));