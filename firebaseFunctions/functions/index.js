/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Ensure the Firebase Admin SDK is initialized only once
if(!admin.apps.length){
  admin.initializeApp();
}

exports.sendNotificationOnMotorDataChange = functions.database.ref('/motorData/{motorId}')
  .onUpdate(async (change, context) => {
    const afterData = change.after.val();
    const motorId = context.params.motorId;

    const connectedUsers = afterData.users || {};
    const notificationMessage = afterData.notificationMessage || 'There is a change in the motor status!';

    const deviceTokens = await getDeviceTokensForUsers(Object.keys(connectedUsers));

    if (deviceTokens.length > 0) {
      const message = {
        notification: {
          title: `Motor Update: ${motorId}`,
          body: notificationMessage,
          sound: 'default',
        },
        tokens: deviceTokens,
      };

      // Send multicast message
      try {
        const response = await admin.messaging().sendMulticast(message);
        console.log('Notifications sent successfully:', response);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
    return null;
  });

/**
 * Helper function to fetch device tokens for users.
 * Assumes tokens are stored in the database at `/userTokens/{userId}`
 */
async function getDeviceTokensForUsers(userIds) {
  const tokens = [];
  const userTokensRef = admin.database().ref('/userTokens');

  try {
    const snapshot = await userTokensRef.once('value');
    const userTokensData = snapshot.val();

    userIds.forEach(userId => {
      if (userTokensData && userTokensData[userId]) {
        const token = userTokensData[userId].token;
        if (token) {
          tokens.push(token);
        }
      }
    });
  } catch (error) {
    console.error('Error fetching device tokens:', error);
  }

  return tokens;
}
