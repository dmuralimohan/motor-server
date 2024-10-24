/*
    Configure the environmental variables
*/

require('dotenv').config();
const config = {
    mongoDBURL: process.env.MONGODB_URL,

    /* authentication secret key */
    AUTH_KEY: process.env.JWT_SECRET,
    REFRESH_AUTH_KEY: process.env.JWT_REFRESH_SECRET,

    /* firebase Configuration */
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    /*mqtt Configuration*/
    MQTT_URL:process.env.MQTT_URL
};

module.exports = config;