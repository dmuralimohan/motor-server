// mqttManager.js
/**
 * Handling MQTT based clients
 */

const mqtt = require('mqtt');
const config = require('../../config/config');

const clients = {};

function getMqttClient(motorId) {
  if (!clients[motorId]) {
    const client = mqtt.connect(config.MQTT_URL || 'wss://broker.emqx.io:8084/mqtt', {
      clientId: `motor-${motorId}-${Date.now()}`,
      clean: true,
      username: 'emqx_online_test_c10017c7',
      password: '1234567890',
    });

    client.on('connect', () => {
      console.log(`MQTT client connected for motorId: ${motorId}`);
      client.subscribe(`motors/${motorId}/status`, (err) => {
        if (err) console.error('Subscribe error:', err);
      });
    });

    client.on('message', (topic, message) => {
      const id = topic.split('/')[1];
      try {
        const data = JSON.parse(message.toString());
        console.log(`(Motor =====> Server) Received from motor ${id}:`, data);
        // Future: handle incoming motor state and update Firebase
      } catch (e) {
        console.error('Failed to parse MQTT message:', e);
      }
    });

    client.on('error', (err) => {
      console.error(`MQTT error for motorId ${motorId}:`, err.message);
    });

    client.on('offline', () => {
      console.warn(`MQTT client offline for motorId ${motorId}`);
    });

    clients[motorId] = client;
  }

  return clients[motorId];
}

async function sendMessage(motorId, message) {
  const client = getMqttClient(motorId);
  if (client && client.connected) {
    console.log(`(Server =====> Motor) Sending to ${motorId}: ${JSON.stringify(message)}`);
    return client.publish(`motors/${motorId}/control`, JSON.stringify(message));
  }
  // If not connected yet, wait briefly
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('MQTT publish timeout')), 5000);
    client.once('connect', () => {
      clearTimeout(timeout);
      client.publish(`motors/${motorId}/control`, JSON.stringify(message));
      resolve();
    });
  });
}

function disconnectClient(motorId) {
  if (clients[motorId]) {
    clients[motorId].end();
    delete clients[motorId];
  }
}

module.exports = {
  getMqttClient,
  sendMessage,
  disconnectClient,
};