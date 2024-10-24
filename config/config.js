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
    MQTT_URL:process.env.MQTT_URL,

    firebase:{
        type: "service_account",
        project_id: "maxcontroller-6b85d",
        private_key_id: "b0a7945722184d17436b0e9fd17bea3ce60846d6",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCh45jEqdWe4W1v\ntbYD5/eSvpbyGOpbFWgDPFlIi2aSjclqBam4F6Gwl98RU8XEeXx8n7822jzB1DD3\naUAFvfC+HONW4oGijrH1Y+tNn29Zrx2qHUsuQtpCNVGdbv8pd9W+XjZ5GYPoTRfW\nm+H8D6tgcgs+Be97WWgXekxjaBhecf/SxzM4FIjeR9MQHRE0D89RS5bLGkD+N3ms\n4A+lPfLsdmgadZJbTmXvTk5LSpURomzjwBUmyZ4YtR3fMNwG+nCD2QxHbiQrX23h\nk/3dtM0BzWCK2f9GrSgVyfXG1xET+MJHpQc6EXgN+Drttwged82aH7ZTMpe1PduY\nKIBO6PknAgMBAAECggEAA2By9E8ylIDRPo5EwKobAOWW0m/wm3vD0qV0m03FEvOA\nKwT5OEzN45gXYA4mRuXd0d+nJmbA864QY2i/nB8NIXoKx+ormA9v6NVvuAvGT9GW\nRdEcm1drpAvmqukAy4WjYLgoXLhKhxLsl15jBVXyVi2qzF1lVGZWBH9Zjo1CTN39\nYOSeNdk4kihDbFd+NVezkwGT7xosmwJTviWMZnPp8KCa9FDgmSxow7D9rSimmNcU\nyhF8o71mfkXvhqv2aCyJKB4Zz40tZrYVCOTfWVvLHU7JUTZAFVbbjpgnQvoEvVsm\nAV/UJhZD95thQs+qIVWHQ1FN3P/76CsT+kLcmva0QQKBgQDMvNuWrw+h/H7/RfSl\nQMgVOlvZx+EsobmqvAkqosCbjBpSU0bt+9Qa+XrZaLkNrNG5VntTgR/CqtVl0Tpy\nxtUw6woobGhaiqMhc8WCOFZB7bi32oMe9J7Q2K1C1DutHrQmKZCb7p80VKVLj39K\nTOeRqTl3T9eRm8oxSj+7YQznoQKBgQDKbEDM837sndYDzhs1rCJJyBEVdu+5UCTm\norFWfvdeZDC3aHRSto63jw9Qhr6FDftIB7E9w/51zU1PcX/ahjIbtKnS4QR8Tj7f\n0OP5QwZv57dH3q0nL5vv97BLvJ7QgV4yxefwFf8VHgLOvzz+/UL3bbQGBpFZmAzT\ncMWWVM0LxwKBgF1R+AVG5ik/neNdT5XDYW/LmfI6WTiuvqJD8ymr5X8A7T55FuuC\nzbs92/Ec+rxw+WcxNCVrxb5Ff99Y7vtCBgq2F3s1bptWdeTZkD060JZcdMXYo8uI\nVJt9J/w+ILVYOWTrrS5mJcsEihNW5P5I74RFThxEGE4WZKLy5PnT0r4BAoGAErIe\n5g8TSP1m9+EAaFumqxPcaBQdHguF7PtXz7pYVJKCYV43aDBOTCvdaT2YuSdKbyOu\nvhqtFOpKWq0L9v3wANkV2lFIHccITZm4hJwpKwrGxc+ORJFEIMzKrqQUMwPP1Has\n7mLJtYSZE8lb890mYz3xo6DVqeW+QYUn6rOYYJ8CgYAcCmS6TfqisOHAE/MKT6Yj\nvn+Vzh+yRQpYn22mfQr+rbVS5Wg+8UVFuTy6sBBJRIIYRA5O9QKBn3K0bu2fzsek\nQlF5kFc/kr9z7+6I04yTSbS6S2GY09R4KWGXT3j0bOjE97Q0oY7poCIPGyui99xO\nCF8f3YjiqspGoJc5ezCiYQ==\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-mnifo@maxcontroller-6b85d.iam.gserviceaccount.com",
        client_id: "113379721599949873111",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-mnifo%40maxcontroller-6b85d.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
    }
};

module.exports = config;