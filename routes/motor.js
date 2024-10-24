/*
    Performing motor related requests
*/

const motorController = require('../controllers/motor');
const authenticate = require('../middleware/auth');

function userMotorRoutes(fastify, opt, done){
    fastify.get("/motor", { preHandler: authenticate }, motorController.getMotorDetails);
    fastify.post("/motor", { preHandler: authenticate }, motorController.addMotorDetails); //only validated credentials to add or admin can add
    // fastify.put("/motor/update", { preHandler: authenticate }, motorController.updateMotorDetails);
    // fastify.post("/sendmessage", motorController.sendMessage); //alert message to every users(admin based)
    done();
}

module.exports = userMotorRoutes;