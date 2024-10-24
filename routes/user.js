/*
    Performing user related requests
*/

const UserController = require('../controllers/user');
// const Authenticate = require('../middleware/auth');

function userRoutes(fastify, opt, done){
    fastify.get("/", (req, rep) => rep.status(200).send({message:"helloWorld"}));
    fastify.post("/signin", UserController.signIn);
    fastify.post("/signup", UserController.signUp);
    // fastify.post("/update", UserController.update);
    done();
}

module.exports = userRoutes;