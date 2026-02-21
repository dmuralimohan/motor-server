// mqttManager.js
/**
 * MQTT Manager — single shared client that handles ALL motor topics.
 *
 * Topic layout:
 *   motors/{motorId}/control   → Server → Motor  (commands: on/off, timer, phase, etc.)
 *   motors/{motorId}/status    → Motor  → Server  (live readings: voltage, current, state)
 *   motors/{motorId}/heartbeat → Motor  → Server  (online/offline heartbeat)
 *
 * When a motor publishes to  motors/{id}/status  the handler:
 *   1. Parses the JSON payload
 *   2. Updates Firebase Realtime DB  → app picks it up via existing onValue listener
 *   3. Stores a notification entry
 *   4. Sends Expo push notifications to subscribed users
 */

const mqtt = require('mqtt');
const config = require('../../config/config');

// ── Lazy-loaded deps (avoid circular requires at startup) ───────────────────
let _motorModel = null;
let _userModel  = null;

function motorModel() {
  if (!_motorModel) _motorModel = require('../motor');
  return _motorModel;
}
function userModel() {
  if (!_userModel) _userModel = require('../user');
  return _userModel;
}

// ── Broker URL — falls back to the EC2 Mosquitto broker ─────────────────────
const BROKER_URL = config.MQTT_URL
  || process.env.MQTT_URL
  || 'ws://67.202.62.65:9001/mqtt';

// ── Single shared MQTT client ───────────────────────────────────────────────
let client = null;
const subscribedMotors = new Set();

function getClient() {
  if (client) return client;

  client = mqtt.connect(BROKER_URL, {
    clientId: `makx-server-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    ...(process.env.MQTT_USER ? { username: process.env.MQTT_USER } : {}),
    ...(process.env.MQTT_PASS ? { password: process.env.MQTT_PASS } : {}),
  });

  client.on('connect', () => {
    console.log(`[MQTT] Connected to broker: ${BROKER_URL}`);
    // Re-subscribe to all previously tracked motors on reconnect
    subscribedMotors.forEach((motorId) => _subscribeMotor(motorId));
  });

  client.on('message', _handleIncomingMessage);

  client.on('error', (err) => {
    console.error('[MQTT] Client error:', err.message);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting...');
  });

  client.on('offline', () => {
    console.warn('[MQTT] Client offline');
  });

  return client;
}

// ── Subscribe to a motor's inbound topics ───────────────────────────────────
function _subscribeMotor(motorId) {
  if (!client || !client.connected) return;
  const topics = [
    `motors/${motorId}/status`,
    `motors/${motorId}/heartbeat`,
  ];
  client.subscribe(topics, { qos: 1 }, (err) => {
    if (err) console.error(`[MQTT] Subscribe error for ${motorId}:`, err);
    else console.log(`[MQTT] Subscribed: ${topics.join(', ')}`);
  });
}

/**
 * Register a motor so the server listens to its status updates.
 * Called on startup for all known motors, or when a new device is added.
 */
function subscribeToMotor(motorId) {
  subscribedMotors.add(motorId);
  getClient(); // ensure client exists
  _subscribeMotor(motorId);
}

// ── Handle incoming MQTT message from any motor ─────────────────────────────
async function _handleIncomingMessage(topic, payload) {
  const parts = topic.split('/');
  if (parts.length < 3 || parts[0] !== 'motors') return;

  const motorId   = parts[1];
  const channel   = parts[2]; // "status" | "heartbeat"
  const raw       = payload.toString();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error(`[MQTT] Bad JSON from ${topic}: ${raw.substring(0, 100)}`);
    return;
  }

  console.log(`[MQTT] (Motor ➜ Server) ${channel} from ${motorId}:`, data);

  // ── Heartbeat ────────────────────────────────────────────────────────────
  if (channel === 'heartbeat') {
    try {
      await motorModel().updateMotorDetails(motorId, {
        lastSeen: new Date().toISOString(),
        online: true,
      });
    } catch (e) {
      console.error('[MQTT] Heartbeat update failed:', e.message);
    }
    return;
  }

  // ── Status update (voltage, current, motor state, etc.) ──────────────────
  if (channel === 'status') {
    try {
      // 1. Update Firebase → triggers realtime update to all connected apps
      await motorModel().updateMotorDetails(motorId, data);
      console.log(`[MQTT] Firebase updated for motor ${motorId}`);

      // 2. Build a human-readable notification message
      const changes = Object.entries(data)
        .map(([k, v]) => {
          if (typeof v === 'object' && v !== null) {
            return `${k}: ${v.status || v.defaultValue || JSON.stringify(v)}`;
          }
          return `${k}: ${v}`;
        })
        .join(', ');

      const notification = `Motor updated — ${changes}`;

      // 3. Store notification in Firebase
      await motorModel().updateNotification('motor-device', motorId, notification);

      // 4. Send push notifications to all users of this motor
      await _sendPushNotificationsForMotor(motorId, notification, data);
    } catch (e) {
      console.error(`[MQTT] Status processing error for ${motorId}:`, e.message);
    }
    return;
  }
}

// ── Push notification helper ────────────────────────────────────────────────
async function _sendPushNotificationsForMotor(motorId, message, data) {
  try {
    const tokens = await userModel().getPushTokensForMotor(motorId);
    if (!tokens || tokens.length === 0) return;

    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t))
      .map((pushToken) => ({
        to: pushToken,
        sound: 'default',
        title: 'Motor Status Update',
        body: message,
        data: { motorid: motorId, ...data },
        channelId: 'motor-alerts',
      }));

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (e) {
        console.error('[MQTT] Push chunk error:', e.message);
      }
    }
    console.log(`[MQTT] Sent ${messages.length} push notification(s) for motor ${motorId}`);
  } catch (e) {
    console.error('[MQTT] Push send failed:', e.message);
  }
}

// ── Publish a command to a motor ────────────────────────────────────────────
async function sendMessage(motorId, message) {
  const c = getClient();
  const topic = `motors/${motorId}/control`;
  const payload = JSON.stringify(message);

  // Ensure we're subscribed to this motor's responses
  subscribeToMotor(motorId);

  if (c.connected) {
    console.log(`[MQTT] (Server ➜ Motor) ${topic}: ${payload}`);
    return c.publish(topic, payload, { qos: 1 });
  }

  // Wait for connect if not ready
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('MQTT publish timeout')), 5000);
    c.once('connect', () => {
      clearTimeout(timeout);
      c.publish(topic, payload, { qos: 1 });
      console.log(`[MQTT] (Server ➜ Motor) ${topic}: ${payload}`);
      resolve();
    });
  });
}

// ── Boot: subscribe to all known motors from Firebase ───────────────────────
async function initMqttSubscriptions() {
  try {
    const { motorCollection } = require('../../plugins/firebase');
    const snapshot = await motorCollection.once('value');
    const motors = snapshot.val();
    if (!motors) {
      console.log('[MQTT] No motors found in Firebase');
      return;
    }

    const motorIds = Object.keys(motors);
    console.log(`[MQTT] Subscribing to ${motorIds.length} motor(s): ${motorIds.join(', ')}`);
    motorIds.forEach((id) => subscribeToMotor(id));
  } catch (e) {
    console.error('[MQTT] Init subscriptions failed:', e.message);
  }
}

// ── Disconnect / cleanup ────────────────────────────────────────────────────
function disconnectClient(motorId) {
  if (motorId) {
    subscribedMotors.delete(motorId);
    if (client && client.connected) {
      client.unsubscribe([
        `motors/${motorId}/status`,
        `motors/${motorId}/heartbeat`,
      ]);
    }
  }
}

function shutdown() {
  if (client) {
    client.end(true);
    client = null;
    subscribedMotors.clear();
    console.log('[MQTT] Shutdown complete');
  }
}

module.exports = {
  getClient,
  subscribeToMotor,
  sendMessage,
  disconnectClient,
  initMqttSubscriptions,
  shutdown,
};