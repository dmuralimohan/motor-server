/*
    Control all the user Routes with corresponding requests and responses
*/

const bcrypt = require('bcrypt');
const twilio = require('twilio');

const UserModel = require('../models/user');
const MotorModel = require('../models/motor');
const logger = require('../plugins/fastify').logger;
const Utils = require('../utils');

// In-memory OTP store (production: use Redis/DB with TTL)
const otpStore = new Map();

const TWILIO_SID = process.env.TWILIO_SID || 'ACf7b93d833f6ed1bc1c45ff35dbcdb03e';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || 'a5e2314106043b1adad6ca57f0e4d87e';
const TWILIO_FROM = process.env.TWILIO_FROM || '+17623374723';

/**
 * Sign In - supports OTP mode and password mode
 */
async function signIn(request, reply) {
  try {
    console.log('signIn request landed');
    logger.info(`Data is received: ${JSON.stringify(request.body)}`);

    const { phonenumber, password, mode = 'otp' } = request.body;

    if (!phonenumber) {
      return reply.code(400).send({ error: 'Phone number is required', isSuccess: false });
    }

    // ── Test account bypass (admin@agrotech.com / phone: test / password: 123) ──
    if (phonenumber === 'test' && mode === 'password' && password === '123') {
      const { motorCollection, userCollection } = require('../plugins/firebase');
      const mqttManager = require('../models/mqtt/mqttManager');
      const TEST_MOTOR_ID = 'test-motor-001';
      const TEST_USER_ID = 'test-admin';

      // Auto-create test user in Firebase if it doesn't exist
      const userSnap = await userCollection.child(TEST_USER_ID).once('value');
      if (!userSnap.exists()) {
        console.log(`[Test] Creating test user "${TEST_USER_ID}" in Firebase...`);
        await userCollection.child(TEST_USER_ID).set({
          username: 'Admin',
          phonenumber: 'test',
          password: '123',
          devices: { [TEST_MOTOR_ID]: true },
          userId: TEST_USER_ID,
        });
        console.log(`[Test] Test user "${TEST_USER_ID}" created in Firebase`);
      }

      // Auto-create test motor in Firebase if it doesn't exist
      const motorSnap = await motorCollection.child(TEST_MOTOR_ID).once('value');
      if (!motorSnap.exists()) {
        console.log(`[Test] Creating test motor "${TEST_MOTOR_ID}" in Firebase...`);
        await motorCollection.child(TEST_MOTOR_ID).set({
          status: { defaultValue: false, status: 'off' },
          phase: '3',
          l1: '230', l2: '228', l3: '231',
          a1: '4.5', a2: '4.3',
          notification: [],
          phasearms: { option1: '3 PH', option2: '1/3 PH', defaultValue: 'option1', status: 'on' },
          phaseenabled: { option1: 'Auto', option2: 'Manual', defaultValue: 'option1', status: 'on' },
          cyclictimer: { option1: 'ON', option2: 'OFF', defaultValue: 'option1', status: 'on' },
          runtimer: { option1: 'ON', option2: 'OFF', defaultValue: 'option1', status: 'on' },
          dryrunrestarttimer: { option1: 'ON', option2: 'OFF', defaultValue: 'option1', status: 'on' },
          'amps&volts': {
            'Dry Run': { 'Trip Time': 5, '3P LA': { value: '2', unit: 'A' }, '1P LA': { value: '1', unit: 'A' }, toggle: false },
            Overload: { 'Trip Time': 10, '3P HA': { value: '15', unit: 'A' }, '1P HA': { value: '10', unit: 'A' }, toggle: false },
            'Low Volt': { 'Trip Time': 5, '3P LV': { value: '180', unit: 'V' }, '1P LV': { value: '180', unit: 'V' }, toggle: false },
            'High Volt': { 'Trip Time': 5, '3P HV': { value: '260', unit: 'V' }, '1P HV': { value: '260', unit: 'V' }, toggle: false },
            SPP: { 'Trip Time': 3, 'SPP Volt': { value: '50', unit: 'V' }, toggle: false },
          },
          timeinfo: {
            'A Time': 0, SDL: 0, EXT: 0,
            'Cycle Time': { 'On Time': 0, 'Off Time': 0, Present: 0, toggle: false },
            'Run Time': { Set: 0, Present: 0, toggle: false },
            'Dry Run Time': { Set: 0, Present: 0, toggle: false },
            clocks: {
              'Clock 1': { 'On Time': 0, 'Off Time': 0, toggle: false },
              'Clock 2': { 'On Time': 0, 'Off Time': 0, toggle: false },
              'Clock 3': { 'On Time': 0, 'Off Time': 0, toggle: false },
              'Clock 4': { 'On Time': 0, 'Off Time': 0, toggle: false },
              'Clock 5': { 'On Time': 0, 'Off Time': 0, toggle: false },
            },
            'Repeat Clock': { toggle: false },
          },
          online: true,
          lastSeen: new Date().toISOString(),
        });
        console.log(`[Test] Test motor "${TEST_MOTOR_ID}" created in Firebase`);
      }

      // Subscribe to test motor MQTT topics so server listens for status updates
      mqttManager.subscribeToMotor(TEST_MOTOR_ID);
      console.log(`[Test] Subscribed to MQTT topics for "${TEST_MOTOR_ID}"`);

      return reply.status(200).send({
        data: {
          isSuccess: true,
          username: 'Admin',
          userid: 'test-admin',
          motorid: TEST_MOTOR_ID,
          devices: { [TEST_MOTOR_ID]: true },
          mode: 'password',
        },
      });
    }

    const userObj = await UserModel.getUserByPhoneNumber(phonenumber);
    if (!userObj || !userObj.phonenumber) {
      logger.info(`User not found: ${phonenumber}`);
      return reply.code(404).send({ error: 'User Not Found', isSuccess: false });
    }

    const activationcode = Object.keys(userObj.devices || {})[0];

    // Password-based login
    if (mode === 'password') {
      if (!password) {
        return reply.code(400).send({ error: 'Password is required', isSuccess: false });
      }

      const isMatch = userObj.password === password; // TODO: use bcrypt.compare in production
      if (!isMatch) {
        return reply.code(401).send({ error: 'Invalid password', isSuccess: false });
      }

      const authToken = await UserModel.generateAuthToken({ userId: userObj.userId });
      const authCookie = Utils.createCookie({ data: `AUTH_TOKEN=${authToken}` });
      reply.header('Set-Cookie', [authCookie]);

      return reply.status(200).send({
        data: {
          isSuccess: true,
          username: userObj.username,
          userid: userObj.userId,
          motorid: activationcode,
          devices: userObj.devices,
          mode: 'password',
        },
      });
    }

    // OTP-based login
    const otp = Math.floor(1000 + Math.random() * 9000);
    otpStore.set(phonenumber, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min TTL

    let smsResponse = {};
    try {
      const client = twilio(TWILIO_SID, TWILIO_TOKEN);
      smsResponse = await client.messages.create({
        body: `Welcome to GFuture, your OTP is ${otp}`,
        from: TWILIO_FROM,
        to: `+91${phonenumber}`,
      });
      console.log('OTP sent to', phonenumber);
    } catch (err) {
      console.error('Twilio error:', err.message);
      return reply.code(500).send({ error: 'Failed to send SMS', details: err.message });
    }

    const authToken = await UserModel.generateAuthToken({ userId: userObj.userId });
    const authCookie = Utils.createCookie({ data: `AUTH_TOKEN=${authToken}` });
    reply.header('Set-Cookie', [authCookie]);

    return reply.status(200).send({
      data: {
        isSuccess: true,
        username: userObj.username,
        userid: userObj.userId,
        motorid: activationcode,
        devices: userObj.devices,
        success: true,
        sid: smsResponse.sid,
        otp: otp, // Remove in production - only for testing
        mode: 'otp',
      },
    });
  } catch (err) {
    console.error(err);
    logger.error(`signIn error: ${err}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

/**
 * Validate OTP sent during sign in
 */
async function validateOTP(request, reply) {
  try {
    const { phonenumber, otp } = request.body;

    if (!phonenumber || !otp) {
      return reply.code(400).send({ error: 'Phone number and OTP are required', isSuccess: false });
    }

    const stored = otpStore.get(phonenumber);
    if (!stored) {
      return reply.code(400).send({ error: 'No OTP found. Please request a new one.', isSuccess: false });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(phonenumber);
      return reply.code(400).send({ error: 'OTP has expired. Please request a new one.', isSuccess: false });
    }

    if (parseInt(otp) !== stored.otp) {
      return reply.code(401).send({ error: 'Invalid OTP', isSuccess: false });
    }

    // OTP verified - clean up
    otpStore.delete(phonenumber);

    const userObj = await UserModel.getUserByPhoneNumber(phonenumber);
    if (!userObj) {
      return reply.code(404).send({ error: 'User not found', isSuccess: false });
    }

    return reply.status(200).send({
      isSuccess: true,
      message: 'OTP verified successfully',
      userid: userObj.userId,
      username: userObj.username,
    });
  } catch (err) {
    console.error(err);
    logger.error(`validateOTP error: ${err}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

/**
 * Sign Up - register a new user
 */
async function signUp(request, reply) {
  try {
    const { username, phonenumber, email, activationcode } = request.body;

    logger.info(`User Signup Request: ${JSON.stringify(request.body)}`);

    if (!username || !phonenumber || !email || !activationcode) {
      return reply.status(422).send({ message: 'Insufficient data', isSuccess: false });
    }

    const user = await UserModel.createUser(request.body);
    if (user && user.error) {
      return reply.status(400).send({ message: user.error, isSuccess: false });
    }

    return reply.status(200).send({
      message: 'Registered successfully',
      isSuccess: true,
    });
  } catch (err) {
    console.error(err);
    logger.error(`signUp error: ${err}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

/**
 * Add a new device to user account
 */
async function addDevice(request, reply) {
  try {
    const { phonenumber, devicename = 'New Device', deviceid } = request.body;

    if (!phonenumber || !deviceid) {
      return reply.code(400).send({ error: 'Phone number and device ID are required', isSuccess: false });
    }

    if (!(await MotorModel.isValidMotorId(deviceid))) {
      return reply.code(400).send({ message: 'Invalid Motor ID', isSuccess: false });
    }

    if (!(await UserModel.isUserExistsByPhoneNumber(phonenumber))) {
      return reply.code(400).send({ message: 'User does not exist', isSuccess: false });
    }

    const isDeviceAdded = await UserModel.addDevice(phonenumber, devicename, deviceid);
    if (isDeviceAdded) {
      return reply.code(200).send({ message: 'Device added successfully', deviceid, isSuccess: true });
    }

    return reply.code(400).send({ message: 'Failed to add device', isSuccess: false });
  } catch (error) {
    logger.error(`addDevice error: ${error}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

/**
 * Register FCM/Expo push token for a user
 */
async function registerToken(request, reply) {
  try {
    const { userid, token } = request.body;

    if (!userid || !token) {
      return reply.code(400).send({ error: 'User ID and token are required', isSuccess: false });
    }

    const success = await UserModel.updatePushToken(userid, token);
    if (success) {
      return reply.code(200).send({ message: 'Token registered', isSuccess: true });
    }
    return reply.code(500).send({ error: 'Failed to register token', isSuccess: false });
  } catch (error) {
    logger.error(`registerToken error: ${error}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

/**
 * Send push notification to all users connected to a motor
 */
async function notifyMotorUsers(request, reply) {
  try {
    const { motorid, title, body, excludeUserId } = request.body;

    if (!motorid || !title) {
      return reply.code(400).send({ error: 'Motor ID and title are required', isSuccess: false });
    }

    const tokens = await UserModel.getPushTokensForMotor(motorid, excludeUserId);
    if (!tokens || tokens.length === 0) {
      return reply.code(200).send({ message: 'No users to notify', sent: 0 });
    }

    // Send via Expo push notification API
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t))
      .map((pushToken) => ({
        to: pushToken,
        sound: 'default',
        title,
        body: body || '',
        data: { motorid },
        channelId: 'motor-alerts',
      }));

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (err) {
          console.error('Push notification error:', err);
        }
      }
    }

    return reply.code(200).send({ message: 'Notifications sent', sent: messages.length, isSuccess: true });
  } catch (error) {
    logger.error(`notifyMotorUsers error: ${error}`);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

async function isNewUserId(request, reply) {
  try {
    const email = request.body.data.email.toString();
    if (!email) {
      return reply.status(404).send({ email: 'Invalid Email Address' });
    }
    const isNewUser = await UserModel.isUserExistsByEmailId(email);
    return reply.status(200).send({ message: isNewUser });
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
}

module.exports = {
  signIn,
  signUp,
  validateOTP,
  isNewUserId,
  addDevice,
  registerToken,
  notifyMotorUsers,
};