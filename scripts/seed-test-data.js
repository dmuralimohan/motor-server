/**
 * Seed test data into Firebase Realtime DB.
 * Creates a test user and motor for end-to-end MQTT testing.
 *
 * Run: node scripts/seed-test-data.js
 */

require('dotenv').config();
const { db, userCollection, motorCollection } = require('../plugins/firebase');

const TEST_MOTOR_ID = 'MOTOR_TEST_001';
const TEST_USER_KEY = 'test_user_001';

async function seed() {
  console.log('=== Seeding Test Data ===\n');

  // ── 1. Create test motor ─────────────────────────────────────────────
  const motorData = {
    status: false,
    phase: '3',
    l1: '0',
    l2: '0',
    l3: '0',
    a1: '0',
    a2: '0',
    online: false,
    lastSeen: null,
    notification: [],
    phasearms: {
      option1: 'Star',
      option2: 'Delta',
      defaultValue: 'option1',
      currentValue: 'option1',
      status: 'off',
    },
    phaseenabled: {
      option1: 'Auto',
      option2: 'Manual',
      defaultValue: 'option1',
      currentValue: 'option1',
      status: 'off',
    },
    cyclictimer: {
      option1: 'Off',
      option2: 'On',
      defaultValue: 'option1',
      currentValue: 'option1',
      status: 'off',
    },
    runtimer: {
      option1: 'Off',
      option2: 'On',
      defaultValue: 'option1',
      currentValue: 'option1',
      status: 'off',
    },
    dryrunrestarttimer: {
      option1: 'Off',
      option2: 'On',
      defaultValue: 'option1',
      currentValue: 'option1',
      status: 'off',
    },
    'amps&volts': {
      'Dry Run': {
        'Trip Time': 5,
        '3P LA': { value: '2', unit: 'A' },
        '1P LA': { value: '1.5', unit: 'A' },
        toggle: false,
      },
      Overload: {
        'Trip Time': 10,
        '3P HA': { value: '15', unit: 'A' },
        '1P HA': { value: '12', unit: 'A' },
        toggle: false,
      },
      'Low Volt': {
        'Trip Time': 5,
        '3P LV': { value: '180', unit: 'V' },
        '1P LV': { value: '190', unit: 'V' },
        toggle: false,
      },
      'High Volt': {
        'Trip Time': 5,
        '3P HV': { value: '260', unit: 'V' },
        '1P HV': { value: '250', unit: 'V' },
        toggle: false,
      },
      SPP: {
        'Trip Time': 3,
        'SPP Volt': { value: '30', unit: 'V' },
        toggle: false,
      },
    },
    timeinfo: {
      'A Time': 0,
      SDL: 0,
      EXT: 0,
      'Cycle Time': { 'On Time': 30, 'Off Time': 15, Present: 0, toggle: false },
      'Run Time': { Set: 60, Present: 0, toggle: false },
      'Dry Run Time': { Set: 10, Present: 0, toggle: false },
      clocks: {
        'Clock 1': { 'On Time': 0, 'Off Time': 0, toggle: false },
        'Clock 2': { 'On Time': 0, 'Off Time': 0, toggle: false },
        'Clock 3': { 'On Time': 0, 'Off Time': 0, toggle: false },
        'Clock 4': { 'On Time': 0, 'Off Time': 0, toggle: false },
        'Clock 5': { 'On Time': 0, 'Off Time': 0, toggle: false },
      },
      'Repeat Clock': { toggle: false },
    },
  };

  console.log(`Creating motor: ${TEST_MOTOR_ID}`);
  await motorCollection.child(TEST_MOTOR_ID).set(motorData);
  console.log('✓ Motor created\n');

  // ── 2. Create test user ──────────────────────────────────────────────
  const userData = {
    username: 'Test User',
    phonenumber: '9999999999',
    email: 'testuser@makx.io',
    password: 'test1234',
    devices: {
      [TEST_MOTOR_ID]: 'Test Motor',
    },
  };

  console.log(`Creating user: ${TEST_USER_KEY}`);
  await userCollection.child(TEST_USER_KEY).set(userData);
  console.log('✓ User created\n');

  // ── 3. Verify data ──────────────────────────────────────────────────
  const motorSnap = await motorCollection.child(TEST_MOTOR_ID).once('value');
  const userSnap = await userCollection.child(TEST_USER_KEY).once('value');

  console.log('=== Verification ===');
  console.log(`Motor "${TEST_MOTOR_ID}":`, motorSnap.exists() ? '✓ exists' : '✗ MISSING');
  console.log(`User  "${TEST_USER_KEY}":`, userSnap.exists() ? '✓ exists' : '✗ MISSING');
  console.log(`User devices:`, JSON.stringify(userSnap.val()?.devices));

  console.log('\n=== Test Credentials ===');
  console.log(`Phone: 9999999999`);
  console.log(`Password: test1234`);
  console.log(`Motor ID: ${TEST_MOTOR_ID}`);
  console.log(`User ID: ${TEST_USER_KEY}`);

  console.log('\n=== MQTT Test Commands ===');
  console.log('1. Simulate motor sending voltage readings:');
  console.log(`   curl -X POST https://motor-server-tdi2.onrender.com/motor/simulate-status \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"motorid":"${TEST_MOTOR_ID}","data":{"l1":"230","l2":"228","l3":"225","a1":"4.5","a2":"3.8"}}'`);
  console.log('');
  console.log('2. Turn motor ON from server (like user pressing ON):');
  console.log(`   curl -X POST https://motor-server-tdi2.onrender.com/motor \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"motorid":"${TEST_MOTOR_ID}","userid":"${TEST_USER_KEY}","data":{"status":{"defaultValue":true,"status":"on"}}}'`);
  console.log('');
  console.log('3. Simulate motor sending heartbeat:');
  console.log(`   curl -X POST https://motor-server-tdi2.onrender.com/motor/simulate-status \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"motorid":"${TEST_MOTOR_ID}","data":{"online":true,"lastSeen":"${new Date().toISOString()}"}}'`);

  console.log('\nDone! You can now sign in with phone 9999999999 / password test1234');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
