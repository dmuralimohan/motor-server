// mqttManager.ts
/**
 * Hanlding MQTT based clients
 */

const mqtt = require('mqtt');
import config from 'dotenv';

const clients = {};

/*function getOrConnectMotorClient(motorId) {
  return new Promise((resolve, reject) => {
    if(clients[motorId]) {
      return resolve(mqttClients[motorId]);
    }

    const client = mqtt.connect(MQTT_BROKER, {
      clientId: `motor-${motorId}`,
      clean: true,
    });

    client.on("connect", () => {
      console.log(`MQTT client connected for motor ${motorId}`);
      mqttClients[motorId] = client;
      resolve(client);
    });

    client.on("error", (err) => {
      console.error(`MQTT error for motor ${motorId}:`, err);
      reject(err);
    });
  });
}*/

export function getMqttClient(motorId) {
  if (!clients[motorId]) {
    const client = mqtt.connect(config.MQTT_URL, {
      clientId: `motor-${motorId}`,
      clean: true,
      username: 'emqx_online_test_c10017c7',
      password: '1234567890'
    });

    client.on("connect", () => {
      console.log(`MQTT client connected for motorId: ${motorId}`);
      client.subscribe("motors/+/status", (err) =>
      {
        if(err) console.error("Subscribe error:", err);
      });

        // const topic = '/nodejs/mqtt'
        // const qos = 0

        // client.subscribe(topic, { qos }, (error) => {
        // if (error) {
        //     console.log('subscribe error:', error)
        //     return
        // }
        // console.log(`Subscribe to topic '${topic}'`)
        // });
    });

    client.on("message", (topic, message) =>
    {
        const motorId = topic.split("/")[1];
        const data = JSON.parse(message.toString());
        console.log(`(Motor =====> Server) Received from motor ${motorId}:`, data);
        /**
         * need to handle format data based in future
        */
    });

    client.on("error", (err) => {
      console.error(`MQTT error for motorId ${motorId}:`, err);
    });

    clients[motorId] = client;
  }

  return clients[motorId];
}

export async function sendMessage(motorId, message)
{
    const client = await getMqttClient(motorId);
    if(client)
    {
        console.log(`(Server =====> Motor) Sending Message to Motor ${JSON.stringify(message)}`);
        return client.publish(`motors/${motorId}/control`, JSON.stringify({ message }));
    }
    throw new Error("MQTT client not found");
}