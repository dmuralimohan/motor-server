/*
    Control all the user motor Routes with corresponding requests and responses
*/

const userModel = require('../models/user');
const motorModel = require('../models/motor');
const logger = require('../plugins/fastify').logger;
const utils = require('../utils');

async function getMotorDetails(request, reply){
    try{
        console.log("motor get request landed");
        logger.info(`motorData is received: ${JSON.stringify(request.query)}`);
        console.log(request.query);

        const { motorId } = request.query;
        console.log(motorId);
        if(!motorId)
        {
            return reply.code(401).send("required params not found");
        }
        // const userId = request.userId; //authenticated from middleware

        const motorDetails = await motorModel.getMotorDetails(motorId); //motorModel.isValidMotorUser(userId, motorId);
        if(!motorDetails)
        {
            return reply.code(401).send("Unauthorized motor details");
        }
        reply.status(200).send(motorDetails);
    }
    catch(error)
    {
        console.log(error);
        logger.error(`Something error occurred [getMotorDetails]"+ ${error}`);

        return new Error("Some error occurred getting motor details");
    }
}

async function addMotorDetails(request, reply){
    try{
        console.log("motor post request landed");
        const { emailId, motorId, motorToken } = request.body;
        
        if(!emailId || !motorId || !motorToken)
        {
            logger.info("invalid credentials from addMotorDetails");
            return reply.code(401).send("Invalid Credentials");
        }

        if(!motorModel.isValidMotorAdmin(motorId, motorToken))
        {
            logger.info("invalid motor credentials from addMotorDetails");
            reply.code(400).send("Unauthorized user");
        }

        const addedCode = motorModel.addUser(emailId, motorId);
        if(addedCode === 1)
        {
            logger.info("adding user is not registered");
            return reply.code(401).send({
                error: "Adding user is not registered"
            });
        }
        return reply.code(200).send({
            message: "added Successfully"
        });
    }
    catch(error){
        console.log(error);
        logger.error(`Something error occurred [addMotorDetails]"+ ${error}`);

        return new Error("Some error occurred adding motor details");
    }
}

async function updateMotorDetails(request, reply){
    try{
        console.log("landed from updateMotorDetails");
        
        const { motorId, ...motorData } = request.body;
        const userId = request.userId;

        /*const motorDetails = motorModel.isValidMotorUser(userId, motorId);
        if(!motorDetails)
        {
            return reply.code(401).send("Unauthorized user");
        }*/
        
        const isUpdated = motorModel.updateMotorDetails(motorId, motorData);
        if(isUpdated)
        {
            logger.info("motor data updated sucessfully");
            return reply.code(200).send({
                message: "Data updated sucessfully"
            });
        }
        
        logger.info("unable to update the motor details");
        return reply.code(500).send({
            message: "Internal Server Error"
        });
    }
    catch(error){
        console.log(error);
        logger.error(`Something error occurred [updateMotorDetails]"+ ${err}`);

        return new Error("Some error occurred updating motor details");
    }
}

module.exports = {
    addMotorDetails,
    getMotorDetails,
    updateMotorDetails
}