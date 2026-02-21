const { fastify , logger } = require('./plugins/fastify');
const { admin } = require('./plugins/firebase');
const { initMqttSubscriptions } = require('./models/mqtt/mqttManager');

//fastify.register(require('./plugins/db'));(mongodb)

fastify.register(require('./routes'));

// ── Start MQTT subscriptions once server is ready ────────────────
fastify.ready().then(() => {
  console.log('[Server] Fastify ready — initializing MQTT subscriptions');
  initMqttSubscriptions().catch((err) => {
    console.error('[Server] MQTT init failed:', err.message);
  });
}).catch((err) => {
  console.error('[Server] Fastify ready error:', err);
});