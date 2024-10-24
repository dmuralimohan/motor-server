/*
    Configuring motors RealTime Firebase handling
*/

const { auth, db, motorCollection } = require('../plugins/firebase');

const { logger } = require('../plugins/fastify');
const config = require('../config/config');

