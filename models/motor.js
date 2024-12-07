/*
    Configuring motors RealTime Firebase handling
*/

const { auth, db, motorCollection } = require('../plugins/firebase');

const { logger } = require('../plugins/fastify');

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

async function isValidMotorId(motorId){
    const motorDetails = getMotorDetails(motorId);
    if(motorDetails)
    {
        return true;
    }
    return false;
}

async function updateFirebaseData(ref, data){
    for(const key in data){
      if(typeof data[key] === 'object' && data[key] !== null){
        await updateFirebaseData(ref.child(key), data[key]);
      }
      else{
        await ref.child(key).set(data[key]);
      }
    }
    return true;
}

async function updateMotorDetails(motorId, motorData){
    try{
        const ref = motorCollection.child(motorId);
        await updateFirebaseData(ref, motorData);
        return true;
    }
    catch(error){
        logger.error(error);
        return false;
    }
}

async function addUser(userId, motorId){
    return false;
}

async function updateNotification(userId, motorid, event){
    return true;
}

module.exports = {
    getMotorDetails,
    isValidMotorId,
    updateMotorDetails,
    addUser
}