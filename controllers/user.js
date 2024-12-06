/*
    Control all the user Routes with corresponding requests and responses
*/

const bcrypt = require('bcrypt');


const UserModel = require('../models/user');
const logger = require('../plugins/fastify').logger;
const Utils = require('../utils');

async function signIn(request, reply){
    try{
        console.log("signIn request landed");
        logger.info(`Data is received: ${JSON.stringify(request.body)}`);
        const { username, phonenumber, activationcode } = request.body;
        logger.info(`User has sign in request ${username} ${phonenumber}`);

        if(!username || !phonenumber || !activationcode){
            return reply.code(401).send("Invalid Credentials");
        }

        const userObj = await UserModel.getUserByPhoneNumber(phonenumber);
        console.log("userDetails:"+ JSON.stringify(userObj));

        if(!userObj || !userObj.email || !userObj.phonenumber){
            logger.info(`User not found Email id: ${username}`);
            return reply.code(404).send({error: "User Not Found"});
        }
        logger.info("Logged User:"+ JSON.stringify(userObj));

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

        delete userObj.password;
        userObj.isSuccess = true;

        reply.status(200).send({
            data: userObj
        });

        logger.info(`User Logged in Successfully USERNAME: ${username} in ${new Date()}`);
        
    } catch(err){
        console.log(err);
        logger.error(`Something error occurred in login "+ ${err}`);

        return new Error("Some error occurred in login");
    }
}

async function signUp(request, reply){
    try {
        const { username, phonenumber, email, activationcode } = request.body;

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
            return reply.status(400).send(user.error);
        }
        else
        {
            return reply.status(200).send({
                message: "You have Registered Sucessfully",
                isSuccess: true
            });
        }
    } catch(err) {
        logger.error(err);
        throw new Error(err);
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
    isNewUserId
};