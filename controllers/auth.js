/*
    Controlling Authentication Token and update Authentication
*/

const User = require('../models/user');

async function updateAuthenticationToken(request, reply, done){
    try{
        console.log("landed auth");
        done();
        // const REFRESH_TOKEN = JSON.parse(request.data);
        // if(!REFRESH_TOKEN)
        // {
        //     reply.status(1000).send({
        //         message: "Invalid Refresh Token"
        //     });
        // }
        // const isValid = User.verifyRefreshToken(REFRESH_TOKEN);
        // if(isValid)
        // {
        //     const newAuthToken = User.generateAuthToken();
        //     reply.status(200).setCookie("AUTH_TOKEN", newAuthToken, {
        //         path: "/",
        //         httpOnly: true,
        //         secure: true,
        //         sameSite: "none",
        //         expires: new Date(Date.getSeconds() + 900)
        //     });
        // }
    }
    catch(err)
    {
        // fastify.logger.error("Error while updating Authentication Token "+ err);

        // reply.status(500).send({
        //     message: "Some Internal Server Error"
        // });
        console.log("landed");
    }
}

exports.models = updateAuthenticationToken;