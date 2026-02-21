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

      // Format value for readable notification text
      let displayValue;
      if (typeof value === 'object' && value !== null) {
        if (value.defaultValue !== undefined) {
          displayValue = value.status || String(value.defaultValue);
        } else {
          displayValue = Object.entries(value)
            .filter(([k]) => k !== 'toggle')
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(', ');
        }
      } else {
        displayValue = String(value);
      }

      const notification = `${key === 'status' ? 'Motor status' : key} is ${displayValue}, updated by ${userName}`;

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

/**
 * Simulate a motor sending an MQTT status message.
 * Useful for testing the full flow without real hardware.
 *
 * POST /motor/simulate-status
 * Body: { motorid: "motor1", data: { l1: "230", l2: "228", a1: "4.5", status: true } }
 */
async function simulateMotorStatus(request, reply) {
  try {
    const { motorid, data } = request.body;

    if (!motorid || !data) {
      return reply.code(400).send({ error: 'motorid and data are required' });
    }

    // Publish to the motor's status topic (as if the motor sent it)
    const mqtt = require('mqtt');
    const config = require('../config/config');
    const brokerUrl = config.MQTT_URL || process.env.MQTT_URL || "ws://67.202.62.65:9001/mqtt";

    const testClient = mqtt.connect(brokerUrl, {
      clientId: `sim-motor-${motorid}-${Date.now()}`,
      clean: true,
      ...(process.env.MQTT_USER ? { username: process.env.MQTT_USER } : {}),
      ...(process.env.MQTT_PASS ? { password: process.env.MQTT_PASS } : {}),
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testClient.end();
        resolve(reply.code(504).send({ error: 'MQTT connection timeout' }));
      }, 8000);

      testClient.once('connect', () => {
        clearTimeout(timeout);
        const topic = `motors/${motorid}/status`;
        const payload = JSON.stringify(data);

        testClient.publish(topic, payload, { qos: 1 }, (err) => {
          testClient.end();
          if (err) {
            resolve(reply.code(500).send({ error: 'Failed to publish', detail: err.message }));
          } else {
            console.log(`[Simulate] Published to ${topic}: ${payload}`);
            resolve(reply.code(200).send({
              message: 'Simulated motor status published',
              topic,
              data,
              broker: brokerUrl,
            }));
          }
        });
      });

      testClient.once('error', (err) => {
        clearTimeout(timeout);
        testClient.end();
        resolve(reply.code(500).send({ error: 'MQTT error', detail: err.message }));
      });
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

/**
 * Get MQTT broker connection status.
 * GET /motor/mqtt-status
 */
async function getMqttStatus(request, reply) {
  try {
    const mqttManager = require('../models/mqtt/mqttManager');
    const client = mqttManager.getClient();

    return reply.code(200).send({
      connected: client ? client.connected : false,
      reconnecting: client ? client.reconnecting : false,
      brokerUrl: config.MQTT_URL || process.env.MQTT_URL || "ws://67.202.62.65:9001/mqtt",
    });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to get MQTT status' });
  }
}

module.exports = {
  addMotorDetails,
  getMotorDetails,
  updateMotorDetails,
  simulateMotorStatus,
  getMqttStatus,
};