/*
    Performing user related requests
*/

const UserController = require('../controllers/user');
// const Authenticate = require('../middleware/auth');

function userRoutes(fastify, opt, done){
    fastify.post("/signin", UserController.signIn);
    fastify.post("/signup", UserController.signUp);
    // fastify.post("/update", UserController.update);
    done();
}

module.exports = userRoutes;