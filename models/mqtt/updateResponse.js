/*
    Update response handler — processes incoming motor messages
    and syncs state to Firebase Realtime DB for all connected users.
    
    This module is now mostly handled inside mqttManager._handleIncomingMessage.
    Kept for any custom client-message logic.
*/

const motorModel = require('../motor');

/**
 * Process a raw message from a motor device and update Firebase.
 * @param {string} motorId - Motor identifier
 * @param {object} message - Parsed JSON payload from the motor
 */
async function handlingClientMessage(motorId, message) {
  try {
    console.log(`[updateResponse] Processing message for motor ${motorId}`);
    await motorModel.updateMotorDetails(motorId, message);
    return true;
  } catch (e) {
    console.error(`[updateResponse] Failed for ${motorId}:`, e.message);
    return false;
  }
}

module.exports = { handlingClientMessage };