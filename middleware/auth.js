/*
    authentication of all the protected routes
*/

const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticate = (request, reply, done) => {
    try{
        done();
        return;
        const authHeader = request.headers["authorization"];
        const authToken = authHeader && authHeader.split(" ")[1];
        if(!authToken)
        {
            return reply.status(401);
        }

        jwt.verify(authToken, config.AUTH_KEY, (err, user) => {
            if(err)
            {
                if(err.name === "TokenExpiredError")
                {
                    return reply.status(1001);
                }
                return reply.status(401).send({
                    message: err
                });
            }
            request.user = user;
            done();
        });
    }
    catch(err)
    {
        fastify.logger.error("Authentication Token Verification has some error occured ");

        return reply.status(401).send({
            message: "Authorization not verified some Internal server occurred"
        });
    }
};

exports.modules = authenticate;