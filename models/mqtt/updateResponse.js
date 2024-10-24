/*
    updating response to firebase realtime it will update all the users
*/

const UserModel = require('../models/user');

function handlingClientMessage(clientId, message){
    const user = UserModel.getUserByClientId(clientId);
    if(user)
    {
        UserModel.updateResponse(clientId, message);
    }
}
module.exports = { handlingClientMessage };