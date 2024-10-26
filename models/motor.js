/*
    Configuring motors RealTime Firebase handling
*/

const { auth, db, motorCollection } = require('../plugins/firebase');

const { logger } = require('../plugins/fastify');
const config = require('../config/config');

async function getMotorDetails(motorId){
    logger.info("Getting motorId to get Motor Details... motorId is: "+ motorId);

    try
    {
        const motorSnapShot = await motorCollection.once('value');
        const motors = motorSnapShot.val();
        return motors[motorId];
    }
    catch(error)
    {
        console.log(error);
        logger.error(error);
    }
}

async function isValidMotorUser(userId, motorId){
    return false;
}

async function updateMotorDetails(motorData){
    return false;
}

async function addUser(userId, motorId){
    return false;
}

module.exports = {
    getMotorDetails,
    isValidMotorUser,
    updateMotorDetails,
    addUser
}