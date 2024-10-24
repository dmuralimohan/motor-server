/*
    Configuring firebase credentials
*/

require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('../config/keyfile.json');
const { logger } = require('./fastify');

let auth, db, userCollection, motorCollection;

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://maxcontroller-6b85d-default-rtdb.firebaseio.com"
  });
  
  auth = admin.auth();
  db = admin.database();
  userCollection = db.ref('users');
  motorCollection = db.ref('motors');
  
  logger.info("firebase is connected");
  console.log("firebase connected");
}
catch(err)
{
  logger.error(err);
  throw new Error(err);
}

module.exports = {
    admin,
    auth,
    db,
    userCollection,
    motorCollection
};