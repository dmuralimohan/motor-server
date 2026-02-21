/*
    Performing user related requests
*/

const UserController = require('../controllers/user');
// const Authenticate = require('../middleware/auth');

function userRoutes(fastify, opt, done) {
  fastify.get('/', (req, rep) => rep.status(200).send({ message: 'AgroTech Motor Server v1.0' }));
  fastify.post('/signin', UserController.signIn);
  fastify.post('/signup', UserController.signUp);
  fastify.post('/validateotp', UserController.validateOTP);
  fastify.post('/adddevice', UserController.addDevice);
  fastify.post('/register-token', UserController.registerToken);
  fastify.post('/notify-motor-users', UserController.notifyMotorUsers);
  done();
}

module.exports = userRoutes;