const mongoose = require('mongoose');
const config = require('../config/config');


async function dbConnector(fastify, options){
    try{
        await mongoose.connect(config.mongoDBURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        mongoose.connection.on("error", (err) => {
            fastify.log.error("Mysql Database Connection Error "+ err);
            process.exit(1);
        });
        
        fastify.decorate("db", mongoose.connection);

        fastify.log.info("Mongo db is connected "+ config.mongoDBURL);
    }
    catch(err){
        fastify.log.err("Mongo db is not connected... "+ err);
    }
}

module.exports = dbConnector;