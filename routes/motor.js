/*
    Performing motor related requests
*/

const motorController = require('../controllers/motor');
// const authenticate = require('../middleware/auth');

function userMotorRoutes(fastify, opt, done){
    fastify.get("/motor", motorController.getMotorDetails);
    fastify.post("/motor", motorController.updateMotorDetails);

    // ── MQTT Debug / Test routes ─────────────────────────────────────
    // Simulate a motor sending status (for testing without real hardware)
    fastify.post("/motor/simulate-status", motorController.simulateMotorStatus);

    // Get MQTT connection status
    fastify.get("/motor/mqtt-status", motorController.getMqttStatus);

    done();
}

module.exports = userMotorRoutes;