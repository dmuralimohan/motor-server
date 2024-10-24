/*
    Configuring fastify credentials and logger writter
*/

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}
const logFilePath = path.join(logDir, 'app.log');
if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
}

const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const logTracer = (log) => {
    console.error(log);
    console.trace(log);
}

const logger = {
    info : (log) => {
        fastify.log.info(log);
    },
    error : (log) => {
        fastify.log.error(log);
    },
    trace : (log) => {
        fastify.log.trace(log);
    }
}

const fastify = require('fastify')({
    logger: {
        level: 'info',
        stream: logStream,
        serializers: {
            res(reply) {
                return {
                    status: reply.status,
                    statusCode: reply.statusCode
                }
            },
            req(request) {
                return {
                    method: request.method,
                    url: request.url,
                    path: request.routerPath,
                    parameters: request.parameters,
                    headers: request.headers
                };
            },
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        logTracer
    }
});

fastify.addHook('preHandler', function (req, reply, done){
    if(req.body)
    {
      req.log.info({ body: req.body }, 'parsed body')
    }
    done()
});

fastify.setErrorHandler((error, request, reply) => {
    console.log(error);
    logger.trace("Some Internal Error Occured in the Server\n"+ error);
 
     reply.status(500).send({
         error: "Internal Server Error",
         message: "Something went wrong"
     });
 });
 
fastify.addHook('onSend', (request, reply, payload, done) => {
    logger.info("Request is processed "+ request.url);
    done();
});
 
fastify.addHook("onClose", (instance, done) => {
    logger.info("Server is now closed....");
    done();
});

fastify.register(require('@fastify/cors'),
{
    origin: "*",
    methods: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
});

const port = process.env.PRODUCTION_PORT || 3001;

fastify.listen({
    port: port,
    host: 'localhost'
}).then((address) => {
    logger.info("Server is Started in "+ port +" Address:"+ address);
    console.log(`Server started`);
}).catch((err) => {
    if(err){
        logger.trace("Server is not Started, Somthing have Error\n"+ err);

        process.exit(1);
    }
});

module.exports = {
    fastify,
    logger
}