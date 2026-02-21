/*
    Control all the user motor Routes with corresponding requests and responses
*/

const userModel = require('../models/user');
const motorModel = require('../models/motor');
const mqttManager = require('../models/mqtt/mqttManager');
const logger = require('../plugins/fastify').logger;

async function getMotorDetails(request, reply) {
  try {
    const { motorId } = request.query;
    if (!motorId) {
      return reply.code(400).send({ error: 'motorId is required' });
    }

    const motorDetails = await motorModel.getMotorDetails(motorId);
    if (!motorDetails) {
      return reply.code(404).send({ error: 'Motor not found' });
    }

    return reply.status(200).send(motorDetails);
  } catch (error) {
    console.error(error);
    logger.error(`getMotorDetails error: ${error}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

async function addMotorDetails(request, reply) {
  try {
    const { phonenumber, devicename, deviceid } = request.body;

    if (!phonenumber || !devicename || !deviceid) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    if (!(await motorModel.isValidMotorId(deviceid))) {
      return reply.code(400).send({ message: 'Invalid Motor ID' });
    }

    // TODO: Implement addUser logic when needed
    return reply.code(200).send({ message: 'Added successfully' });
  } catch (error) {
    console.error(error);
    logger.error(`addMotorDetails error: ${error}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

async function updateMotorDetails(request, reply) {
  try {
    const { motorid, userid, data } = request.body;

    if (!motorid || !data) {
      return reply.code(400).send({ error: 'motorid and data are required' });
    }

    // Send command to physical motor via MQTT
    try {
      await mqttManager.sendMessage(motorid, data);
    } catch (mqttErr) {
      console.warn('MQTT send failed (motor may be offline):', mqttErr.message);
      // Continue even if MQTT fails - update Firebase anyway
    }

    // Update Firebase
    const isUpdated = await motorModel.updateMotorDetails(motorid, data);
    if (isUpdated) {
      const [key, value] = Object.entries(data)[0];
      const userName = userid ? await userModel.getUserNameByUserId(userid) : 'System';
      const notification = `${key === 'status' ? 'Motor status' : key} is ${value}, updated by ${userName}`;

      await motorModel.updateNotification(userid, motorid, notification);

      // Send push notifications to other connected users
      try {
        const tokens = await userModel.getPushTokensForMotor(motorid, userid);
        if (tokens && tokens.length > 0) {
          // Use Expo push API
          const { Expo } = require('expo-server-sdk');
          const expo = new Expo();
          const messages = tokens
            .filter((t) => Expo.isExpoPushToken(t))
            .map((pushToken) => ({
              to: pushToken,
              sound: 'default',
              title: 'Motor Update',
              body: notification,
              data: { motorid },
              channelId: 'motor-alerts',
            }));

          if (messages.length > 0) {
            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
              try { await expo.sendPushNotificationsAsync(chunk); } catch (e) { console.error('Push error:', e); }
            }
          }
        }
      } catch (pushErr) {
        console.warn('Push notification failed:', pushErr.message);
      }

      return reply.code(200).send({ message: 'Data updated successfully' });
    }

    return reply.code(500).send({ message: 'Failed to update motor details' });
  } catch (error) {
    console.error(error);
    logger.error(`updateMotorDetails error: ${error}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

module.exports = {
  addMotorDetails,
  getMotorDetails,
  updateMotorDetails,
};