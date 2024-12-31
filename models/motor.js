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

function deepMerge(target, source) {
    for(const [key, value] of Object.entries(source)){
        if(typeof value === 'object' && value !== null){
            if(!target[key] || typeof target[key] !== 'object'){
                target[key] = {};
            }
            deepMerge(target[key], value);
        }
        else{
            target[key] = value;
        }
    }
    return target;
}

async function updateFirebaseData(ref, newData){
    try{
        const snapshot = await ref.once('value');
        const currentData = snapshot.val() || {};
        const mergedData = deepMerge(currentData, newData);
        await ref.update(mergedData);
        return true;
    }
    catch(error){
        console.error("Error appending data:", error);
        return false;
    }
}

async function updateMotorDetails(motorId, motorData){
    try{
        console.log("motorid from updateMotorDetails", motorId);
        const ref = motorCollection.child(motorId);
        await updateFirebaseData(ref, motorData);
    }
    catch(error){
        console.log(error);
        logger.error(error);
        return false;
    }
    return true;
}

async function addUser(userId, motorId){
    return false;
}

async function updateNotification(userId, motorId, newNotification){
    try{
        console.log(`landed from updateNotification for userId: ${userId}, motorId: ${motorId}`);

        const ref = motorCollection.child(motorId).child('notification');

        await ref.transaction((currentNotifications) =>{
            currentNotifications = currentNotifications || [];
            currentNotifications.unshift({message: newNotification, time: new Date().toISOString() , id: userId});
        
            if(currentNotifications.length > 50){
                currentNotifications = currentNotifications.slice(0, 50);
            }
        
            return currentNotifications;
        });

    }catch(error){
        console.error("Error appending notification:", error);
        logger.error(error);
        return false;
    }
    return true;
}

module.exports = {
    getMotorDetails,
    isValidMotorId,
    updateMotorDetails,
    updateNotification,
    addUser
}