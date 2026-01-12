const Koa = require("koa");
const app = new Koa();
const logger = require("./helper/logger");
const config = require("./config/index");
const { ApiConstant } = require("./constant/constants");
const {
  getAllClients,
  getAllDevices,
} = require("./controller/asset-manager.controller");
const MqttHandler = require("./helper/mqtt");
const {
  initializeHeartbeatListener,
  listenToEdgemanTopic,
  listenToValidateInstrumentTopic,
} = require("./controller/mqtt.controller");
const { setGlobalDevicesByClient } = require('./helper/device/deviceStateUtils');

const healthCheck = require("../healthCheck"); // Updated path to point to correct file

global.devicesByClient = new Map();

// Mount health check routes
app.use(healthCheck.routes());
app.use(healthCheck.allowedMethods());

async function main() {
  try {
    const clientsEndpoint = `${config.API_ROOT}${ApiConstant.CLIENTS}`;
    logger.debug(`Fetching all clients from endpoint: ${clientsEndpoint}`);

    const clients = await getAllClients(clientsEndpoint);

    if (clients && clients.length > 0) {
      logger.debug(`clients:`, clients);

      await getAllDevicesForAllClients(clients);

            const mqttClient = new MqttHandler().mqttClient;
            initializeHeartbeatListener(mqttClient);
            listenToValidateInstrumentTopic(mqttClient);
            //const mqttEMClient = new MqttHandler().mqttClient;
            //  listenToEdgemanTopic(mqttClient)
        } else {
            logger.warn("No clients found");
        }
    } catch (error) {
        logger.error('Error fetching clients data: ', error);
    }
}

async function getAllDevicesForAllClients(clients) {
    for (const client of clients) {
        const clientName = client.name;
        const devicesEndpoint = `${config.API_ROOT}${ApiConstant.ASSET}`;
        try {
            const devices = await getAllDevices(devicesEndpoint, clientName);
            // Set heartbeatTimestamp for each device based on connection status
            const now = Date.now();
            if (Array.isArray(devices)) {
                devices.forEach(device => {
                    // Only set heartbeatTimestamp for connected devices
                    if (device.connection_status !== 'Disconnected') {
                        device.heartbeatTimestamp = now;
                    }
                });
            }
            logger.debug(`All devices for ${clientName}:`,devices)
            setGlobalDevicesByClient(clientName, devices);
        } catch (error) {
            logger.error(`Error fetching devices for client ${clientName}:`, error);
        }
    }
    return global.devicesByClient;
}

async function startServer() {
  await main();
  app.listen(4200, () => {
    logger.info("Server running on http://localhost:4200");
  });
}

startServer();
