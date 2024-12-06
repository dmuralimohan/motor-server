/*
    Performing motor related requests
*/

const motorController = require('../controllers/motor');
// const authenticate = require('../middleware/auth');

function userMotorRoutes(fastify, opt, done){
    fastify.get("/motor", motorController.getMotorDetails);
    fastify.post("/motor", motorController.updateMotorDetails); //only validated credentials to add or admin can add
    fastify.post("/motor/adddevice", motorController.addMotorDetails);
    // fastify.put("/motor/update", { preHandler: authenticate }, motorController.updateMotorDetails);
    // fastify.post("/sendmessage", motorController.sendMessage); //alert message to every users(admin based)
    done();
}

module.exports = userMotorRoutes;