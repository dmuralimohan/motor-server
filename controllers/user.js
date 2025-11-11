/*
    Control all the user Routes with corresponding requests and responses
*/

// const dotenv = require("dotenv");
// dotenv.config();

const bcrypt = require('bcrypt');
const twilio = require('twilio');


const UserModel = require('../models/user');
const MotorModel = require('../models/motor');
const logger = require('../plugins/fastify').logger;
const Utils = require('../utils');

async function signIn(request, reply){
    try{
        console.log("signIn request landed");
        logger.info(`Data is received: ${JSON.stringify(request.body)}`);
        console.log("Data received:", request.body);
        const { phonenumber } = request.body;
        logger.info(`User has sign in request ${phonenumber}`);

        if(!phonenumber){
            return reply.code(401).send("Invalid Credentials");
        }

        const userObj = await UserModel.getUserByPhoneNumber(phonenumber);
        console.log("userDetails:"+ JSON.stringify(userObj));
        console.log(userObj.email, userObj.phonenumber);

        if(!userObj || !userObj.email || !userObj.phonenumber || !userObj["devices"]?.[activationcode]){
            logger.info(`User not found Email id: ${phonenumber}`);
            return reply.code(404).send({error: "User Not Found"});
        }
        logger.info("Logged User:"+ JSON.stringify(userObj));

        const otp = Math.floor(1000 + Math.random() * 9000);
        const client = await twilio("ACf7b93d833f6ed1bc1c45ff35dbcdb03e", "83ca08c06eea2d04b781c13ec6a8c5d6");
        let response = {};

            try {
                response = await client.messages.create({
                body: 'welcome to max-controle, your otp is '+ otp,
                from: "+17623374723",
                to: '+91'+ phonenumber
                });

                console.log("otpsent", phonenumber);
            } catch (err) {
                console.error(err);
                return reply.code(500).send({ error: 'Failed to send SMS', details: err.message });
            }

        // const isMatch = password === userObj.password; //await bcrypt.compare(password, userObj.password);
        // if(!isMatch){
        //     logger.info("User is unable to login Invalid credentials");
        //     return reply.status(400).send({
        //         message: "Unable to Login",
        //         error: "Invalid Credentials"
        //     });
            
        // }

        let date = new Date();
        date.setDate(date.getDate() + 200);
        const authToken = await UserModel.generateAuthToken({userId:userObj.userId});
        // const refreshToken = await UserModel.generateRefreshToken({email: userObj.email});
        // logger.info(`Token Created Successfully AUTHTOKEN: ${authToken}, REFRESHTOKEN: ${refreshToken}`);

        const authCookie = Utils.createCookie({data:`AUTH_TOKEN=${authToken}`});
        // date.setDate(date.getDate() + 200);
        // const refreshCookie = Utils.createCookie({expires: date,data: `REFRESH_TOKEN=${refreshToken}`});

        reply.header("Set-Cookie", [authCookie]);

        const responseObj = {
            isSuccess: true,
            username: userObj.username,
            userid: userObj.userId,
            motorid: userObj["devices"]?.[activationcode],
            devices: userObj.devices,
            success: true,
            sid: response.sid,
            otp: otp,
        };

        reply.status(200).send({
            data: responseObj
        });

        logger.info(`User Logged in Successfully USERNAME: ${phonenumber} in ${new Date()}`);
        
    } catch(err){
        console.log(err);
        logger.error(`Something error occurred in login "+ ${err}`);

        return new Error("Some error occurred in login");
    }
}

async function signUp(request, reply){
    try {
        const { username, phonenumber, email, activationcode } = request.body;

        console.log(request.body);

        logger.info(`User Signup Request landed...\n ${JSON.stringify(request.body)}`);

        if(!username || !phonenumber || !email  || !activationcode )
        {
            logger.info("Some data are missed, please give requested Data");
            return reply.status(422).send({
                message: "The data is insufficient"
            });
        }

        const user = await UserModel.createUser(request.body);
        if(user.error)
        {
            return reply.status(400).send({
                message: user.error,
                isSuccess: false
            });
        }
        else
        {
            return reply.status(200).send({
                message: "You have Registered Sucessfully",
                isSuccess: true
            });
        }
    } catch(err) {
        console.log(err);
        logger.error(err);
    }
}

async function addDevice(request, reply){
    try{
        console.log("addDevice landed");
        const { phonenumber, devicename = "new Device", deviceid } = request.body;

        if(!phonenumber || !deviceid)
        {
            logger.info("invalid credentials from addMotorDetails");
            return reply.code(401).send("Invalid Credentials");
        }

        if(!MotorModel.isValidMotorId(deviceid))
        {
            logger.info("invalid motor credentials from addMotorDetails");
            reply.code(400).send({
                message: "Invalid MotorId",
                isSuccess: false
            });
        }

        if(!UserModel.isUserExistsByPhoneNumber(phonenumber))
        {
            logger.info("user not exist phonenumber:"+ phonenumber);
            reply.code(400).send({
                message: "user not exist",
                isSuccess: false
            });
        }

        const isDeviceAdded = UserModel.addDevice(phonenumber, devicename, deviceid);
        if(isDeviceAdded)
        {
            logger.info(`user device added successfully, ${phonenumber} ${devicename} ${deviceid}`);
            reply.code(200).send({
                message: "device added successfully",
                deviceid: deviceid,
                isSuccess:true
            });
        }
        else{
            logger.info(`user device not added, ${phonenumber} ${devicename} ${deviceid}`);
            reply.code(400).send({
                message: "device not added, kindly try again later",
                isSuccess: false
            });
        }
    }
    catch(error){
        logger.error(error);
        throw new Error(error);
    }
}

async function isNewUserId(request, reply){
    try {
        const email = request.body.data.email.toString();
        if(!email){
            reply.status(404).send({
                email:"Invalid Email Address 404"
            });
        }
        const isNewUser = await UserModel.isUserExistsByEmailId(email);
        logger.info(`New User or not: ${email} : ${isNewUser}`);
        
        await reply.status(200).send({
            message: isNewUser
        });
    } catch(err) {
        logger.error(err);
        throw new Error(err);
    }
}

module.exports = {
    signIn,
    signUp,
    isNewUserId,
    addDevice
};