const moment = require('moment-timezone');
const config = require('../config');
const logger = require('../helper/logger');
const { PharmaConstant } = require('../constant/constants');
const { constructAssetObj,
    getDataForEmRequest } = require('../controller/asset-manager.controller');
const { updateAsset, updateBatteryInfo, getAsset, createAsset, createAssetModel, getAssetTypeObject, getAssetByName, createAudit, getDefaultSite, createAssetTypeMapping } = require('../service/pharma-api.service');
const { setGlobalDevicesByClient, getDevicesByClientId, getDeviceForClientByAssetId, setDeviceForClientAssetId } = require('../helper/device/deviceStateUtils');
const HeartbeatQueueManager = require('../helper/heartbeatQueue');

const heartbeatInterval = (Number(config.DEVICE.DISCONNECT_STATUS_UPDATE_PERIOD_SECONDS) || 10) * 1000; // milliseconds
let checkHeartbeatsInterval;
const calibrationNotifierMap = new Map();

// Initialize heartbeat queue manager
const heartbeatQueue = new HeartbeatQueueManager();

// Log queue stats periodically for monitoring
// setInterval(() => {
//     const stats = heartbeatQueue.getQueueStats();
//     if (stats.totalQueues > 0) {
//         logger.info('Heartbeat queue stats:', JSON.stringify(stats));
//     }
// }, 30000); // Every 30 seconds
const listenToValidateInstrumentTopic = (mqttClient) => {
    if (!mqttClient) {
        logger.warn(":::Client not connected. So subscription failed.");
        return;
    }
    
    mqttClient.subscribe('+/instrument/edgeman/validateinstrumentrequest', (err) => {
        if (err) {
            logger.error('Error while subscribing to validateinstrumentrequest topic:', err);
        } else {
            logger.debug('Subscribed to validateinstrumentrequest topic.');
        }
    });

    mqttClient.on('message', async (topic, message) => {
        try {
            const topicHierarchy = getTopicHierarchy(topic);
            const lastSegment = topicHierarchy[topicHierarchy.length - 1];
            
            if (lastSegment === 'validateinstrumentrequest') {
                logger.debug("VALIDATE_INSTRUMENT_REQUEST received::::::", topic, message.toString());
                
                const requestData = JSON.parse(message.toString());
                const clientName = topicHierarchy[0];
                
                // Expected message format: { deviceNames: ["device1", "device2", ...], assetType: "particlecounter" }
                const { deviceNames, assetType } = requestData;
                
                if (!deviceNames || !Array.isArray(deviceNames)) {
                    logger.warn('Invalid validateinstrumentrequest message format - deviceNames array required');
                    return;
                }
                
                if (!assetType) {
                    logger.warn('Invalid validateinstrumentrequest message format - assetType required');
                    return;
                }
                
                logger.info(`Processing validate instrument request for ${deviceNames.length} devices with asset type ${assetType}`);
                
                try {
                    // Optimized: Single database call to get all assets for the client and asset type
                    const existingAssets = await getAsset(clientName, assetType);
                    const existingDeviceNames = new Set();
                    
                    if (existingAssets && Array.isArray(existingAssets)) {
                        existingAssets.forEach(asset => {
                            if (asset.name) {
                                existingDeviceNames.add(asset.name);
                            }
                        });
                    }
                    
                    // Validate device names against the existing names set
                    const validationResults = deviceNames.map(deviceName => {
                        const isNameExists = existingDeviceNames.has(deviceName);
                        logger.debug(`Device validation: ${deviceName} - exists: ${isNameExists}`);
                        
                        return {
                            name: deviceName,
                            isNameExists: isNameExists
                        };
                    });
                    
                    // Prepare response
                    const response = {
                        validatedDevices: validationResults,
                        totalRequested: deviceNames.length,
                        totalFound: validationResults.filter(result => result.isNameExists).length,
                        assetType: assetType
                    };
                    
                    // Publish response to validateinstrumentresponse topic
                    const responseTopic = topic.replace('validateinstrumentrequest', 'validateinstrumentresponse');
                    mqttClient.publish(responseTopic, JSON.stringify(response), { qos: 1 }, (err) => {
                        if (err) {
                            logger.error(`Failed to publish validation response to topic ${responseTopic}:`, err);
                        } else {
                            logger.info(`Published validation response to ${responseTopic}: ${response.totalFound}/${response.totalRequested} devices found for asset type ${assetType}`);
                        }
                    });
                    
                } catch (error) {
                    logger.error(`Error during batch validation for asset type ${assetType}:`, error);
                    
                    // Send error response
                    const errorResponse = {
                        validatedDevices: deviceNames.map(name => ({
                            name: name,
                            isNameExists: false,
                            error: 'Validation failed'
                        })),
                        totalRequested: deviceNames.length,
                        totalFound: 0,
                        assetType: assetType,
                        error: 'Database validation failed'
                    };
                    
                    const responseTopic = topic.replace('validateinstrumentrequest', 'validateinstrumentresponse');
                    mqttClient.publish(responseTopic, JSON.stringify(errorResponse), { qos: 1 });
                }
            }
        } catch (err) {
            logger.error('Error processing validateinstrumentrequest message:', err);
        }
    });
};

const listenToEdgemanTopic = (mqttEMClient) => {
    if (!mqttEMClient) {
        logger.warn(":::Client not connected. So subscription failed.");
        return;
    }
    mqttEMClient.subscribe(config.TOPIC.EM_REQUEST_TOPIC, (err) => {
        if (err) {
            logger.error('Error while subscribing to edgeman Instrument name validation topic:', err);
        } else {
            logger.debug(`Subscribed to ${config.TOPIC.EM_REQUEST_TOPIC} topic.`);
        }
    });

    mqttEMClient.on('message', async (topic, message) => {
        logger.debug("EM_REQUEST_TOPIC recevied::::::", config.TOPIC.EM_REQUEST_TOPIC, topic, message.toString())
        const receivedEmMessage = JSON.parse(message.toString());
        const topicHierarchy = getTopicHierarchy(topic);
        const clientName = topicHierarchy[0];
        if (receivedEmMessage.type) {
            try {
                let endpoint = `${config.API_ROOT}${receivedEmMessage.type}`;
                if (receivedEmMessage.type === 'site') endpoint = `${endpoint}?status=ACTIVE`
                const emReponseData = await getDataForEmRequest(endpoint, clientName);
                if (!emReponseData) {
                    logger.error('Error: Unable to fetch data from the database for em request');
                    return emReponseData
                }
                mqttEMClient.publish(config.TOPIC.EM_RESPONSE_TOPIC, JSON.stringify(emReponseData));
                logger.debug('Published validated em list');
            } catch (err) {
                logger.error('Error processing em list:', err);
            }
        }
    });
};
const initializeHeartbeatListener = (mqttClient) => {
    if (!mqttClient) {
        logger.warn(":::Client not connected. So subscription failed.");
        return;
    }
    if (checkHeartbeatsInterval) {
        clearInterval(checkHeartbeatsInterval);
    }

    mqttClient.subscribe(config.TOPIC.BASIC_TOPIC, (err) => {
        if (err) {
            logger.error('Error while subscribing to basic topic:', err);
        } else {
            logger.debug(`Subscribed to ${config.TOPIC.BASIC_TOPIC} topic.`);
        }
    });
    mqttClient.subscribe(config.TOPIC.META_TOPIC, (err) => {
        if (err) {
            logger.error('Error while subscribing to meta topic:', err);
        } else {
            logger.debug(`Subscribed to ${config.TOPIC.META_TOPIC} topic.`);
        }
    });
    mqttClient.subscribe(config.TOPIC.INSTRUMENT_UPDATE_TOPIC, (err) => {
        if (err) {
            logger.error('Error while subscribing to instrument update topic:', err);
        } else {
            logger.debug(`Subscribed to ${config.TOPIC.INSTRUMENT_UPDATE_TOPIC} topic.`);
        }
    });


    mqttClient.on('message', async (topic, message) => {
        try {
            const normalizedTopic = topic.split('/').map(part => part.trim()).join('/');
            const topicParts = normalizedTopic.split('/');
            const lastSegment = topicParts[topicParts.length - 1];
            const topicHierarchy = getTopicHierarchy(topic);
            const count = topicHierarchy.length;
            const clientName = topicHierarchy[0];

            // Different parsing for update topics vs heartbeat topics
            let assetType, asset_id;
            if (lastSegment === 'update') {
                // Update topic format: clientName/instrument/assetType/assetId/update (5 parts)
                assetType = topicHierarchy[2];  // Third element (index 2)
                asset_id = topicHierarchy[3];   // Fourth element (index 3)
            } else {
                // Heartbeat topic format: clientName/instrument/assetType/assetId/heartbeats/type (6 parts)
                assetType = topicHierarchy[count - 4];
                asset_id = topicHierarchy[count - 3];
            }

            const rawMessage = message.toString();
            if (!rawMessage) {
                logger.warn('Empty message received on topic:', topic);
                return;
            }

            let deviceHeartbeat;
            try {
                deviceHeartbeat = JSON.parse(rawMessage);
            } catch (parseError) {
                logger.error('Failed to parse message as JSON:', rawMessage, parseError);
                return;
            }



            // Ensure it's a plain object
            if (typeof deviceHeartbeat !== 'object' || deviceHeartbeat === null || Array.isArray(deviceHeartbeat)) {
                logger.warn('Invalid deviceHeartbeat format:', deviceHeartbeat);
                return;
            }


            // if (asset_id !== 'test-15') {
            //     return
            // }

            // Queue basic heartbeats to prevent race conditions
            if (lastSegment === 'basic') {
                
                heartbeatQueue.enqueue(
                    clientName, 
                    asset_id,
                    { deviceHeartbeat, assetType, asset_id, clientName, heartbeatType: 'basic' },
                    async (msg) => {
                        await handleBasicHeartbeat(msg.clientName, msg.deviceHeartbeat, 
                                                  msg.assetType, msg.asset_id);
                    }
                );
            } else if (lastSegment === 'meta') {
                // Queue meta heartbeats to prevent duplicate onboarding
                heartbeatQueue.enqueue(
                    clientName,
                    asset_id,
                    { deviceHeartbeat, assetType, asset_id, clientName, heartbeatType: 'meta' },
                    async (msg) => {
                        await handleMetaHeartbeat(msg.clientName, msg.deviceHeartbeat, 
                                                msg.assetType, msg.asset_id);
                    }
                );
            } else if (lastSegment === 'update') {
                // Site updates can be processed immediately (no audit events)
                await handleSiteUpdate(clientName, deviceHeartbeat, assetType, asset_id);
            }
        } catch (err) {
            logger.error('Error handling MQTT message:', err);
        }
    });



    const handleBasicHeartbeat = async (clientName, deviceHeartbeat, assetType, asset_id) => {
        console.log("handleBasicHeartbeat called for asset_id:", asset_id);
        // Validate required keys
        if (!deviceHeartbeat || typeof deviceHeartbeat !== 'object' ||
            !('status' in deviceHeartbeat) ||
            !('asset_time' in deviceHeartbeat) ||
            !('asset_id' in deviceHeartbeat) ||
            !assetType) {
            logger.warn('Invalid basic heartbeat:', deviceHeartbeat);

            // Publish notification about missing keys
            let missingKeys = [
            !('status' in deviceHeartbeat) ? 'status' : null,
            !('asset_time' in deviceHeartbeat) ? 'asset_time' : null,
            !('asset_id' in deviceHeartbeat) ? 'asset_id' : null,
            !assetType ? 'assetType' : null
            ].filter(Boolean).join(', ');

            let message = {
            type: 'ALERT',
            category: 'INFO',
            title: `Required keys are missing in the basic heartbeat.`,
            message: `Required keys are missing in the basic heartbeat. Here are the details: ${missingKeys}.`
            };
            publishDeviceStateMessage(
            JSON.stringify(message),
            clientName,
            asset_id,
            assetType
            );
            return;
        }
        const connectionStatus = deviceHeartbeat.status;
        const assetTime = deviceHeartbeat.asset_time;
        try {
            let device = null;
            // Use getDeviceForClientByAssetId directly instead of getting all devices
            device = getDeviceForClientByAssetId(clientName, asset_id);
            if (device) {
                // Store previous status for audit comparison
                const previousDeviceStatus = device.last_device_status;
                const currentDeviceStatus = deviceHeartbeat.status;
                
                // Check if heartbeat is resuming after being disconnected due to no heartbeat
                if (device.isDisconnectedDueToNoHeartbeat === true) {
                    // Create audit event for heartbeat reconnection
                    const auditObj = {
                        asset_id: device.id,
                        event_type: "Heartbeat Connected",
                        comments: `Asset ${asset_id} heartbeat resumed`,
                        asset_name: device.name,
                        asset_type_id: parseInt(device.asset_type_id, 10) || device.asset_type_id,
                        meta: {
                            "site_info": {
                                        "id": parseInt(device.site_id, 10) || device.site_id,
                                        "name": device.asset__site___name,
                                        "status": "ACTIVE",
                                        "site_timezone": device.asset__site___site_timezone || device.asset__site___timezone
                                        }
                                    }

                    };
                    await createAudit(auditObj, clientName);
                    
                    // Reset the flag
                    device.isDisconnectedDueToNoHeartbeat = false;
                    
                    // Mark that we tracked the status when heartbeat was lost for later logic
                    device.justReconnectedFromHeartbeat = true;
                }
                
                // Store heartbeat timestamp on device
                device.heartbeatTimestamp = Date.now();
                
                // Store asset time offset on device and detect timezone changes
                if (device.assetTimeObj === undefined) {
                    // First time storing asset time
                    device.assetTimeObj = {
                        time: assetTime?.time || null,
                        offset: assetTime?.offset || null,
                        timeZone: assetTime?.timeZone || null
                    };
                    // Update device in global map
                    setDeviceForClientAssetId(clientName, asset_id, device);
                    await updateTimeSync(assetTime, asset_id, clientName);
                    logger.debug(`Stored initial time and offset for asset ${asset_id}:`, assetTime);
                } else if (assetTime && (
                    (assetTime.timeZone && device.assetTimeObj.timeZone !== assetTime.timeZone) ||
                    (assetTime.offset && device.assetTimeObj.offset !== assetTime.offset)
                )) {
                    // Timezone or offset has changed - log and build notification details
                    let changeDetails = [];
                    if (device.assetTimeObj.timeZone !== assetTime.timeZone) {
                        const oldTz = device.assetTimeObj.timeZone || 'null';
                        const newTz = assetTime.timeZone;
                        logger.debug(`Timezone change detected for asset ${asset_id}: ${oldTz} -> ${newTz}`);
                        changeDetails.push(`Timezone: ${oldTz} -> ${newTz}`);
                    }
                    if (device.assetTimeObj.offset !== assetTime.offset) {
                        const oldOffset = device.assetTimeObj.offset || 'null';
                        const newOffset = assetTime.offset;
                        logger.debug(`Offset change detected for asset ${asset_id}: ${oldOffset} -> ${newOffset}`);
                        changeDetails.push(`Offset: ${oldOffset} -> ${newOffset}`);
                    }
                    
                    const message = {
                        type: 'INFO',
                        category: 'INFO',
                        title: `Timezone or offset has been updated for instrument ${asset_id}.`,
                        message: `Timezone or offset has been updated for instrument ${asset_id}. Here are the updates: ${changeDetails.join(', ')}.`
                    };
                    
                    publishDeviceStateMessage(
                        JSON.stringify(message),
                        clientName,
                        asset_id,
                        assetType
                    );
                    
                    // Update the stored assetTimeObj with new timezone/offset information
                    device.assetTimeObj = {
                        time: assetTime?.time || null,
                        offset: assetTime?.offset || null,
                        timeZone: assetTime?.timeZone || null
                    };``
                    logger.debug("assetTimeObj updated:", device.assetTimeObj);
                    
                    // Update device in global map
                    setDeviceForClientAssetId(clientName, asset_id, device);
                    
                    // Update time sync status with new timezone/offset
                    await updateTimeSync(assetTime, asset_id, clientName);
                    logger.debug(`Updated time sync for asset ${asset_id} after timezone/offset change`);
                }
                
                // Track disconnect count on device
                if (typeof device.disconnectCount !== 'number') device.disconnectCount = 0;
                if (
                    connectionStatus === PharmaConstant.DISCONNECTED &&
                    device.connection_status !== PharmaConstant.DISCONNECTED
                ) {
                    device.disconnectCount++;
                    if (device.disconnectCount >= config.DEVICE.DISCONNECT_STATUS_UPDATE_PERIOD) {
                        // Update connection status on the device
                        device.connection_status = PharmaConstant.DISCONNECTED;
                        
                        const updatedAsset = await updateAsset(
                            device.id,
                            { connection_status: PharmaConstant.DISCONNECTED },
                            clientName
                        );
                        if (updatedAsset) {
                            logger.info(`Database updated with connection status: ${PharmaConstant.DISCONNECTED} for device ${device.id}`);
                            
                            // Note: Instrument status audit events are handled after heartbeat reconnection
                            // to ensure proper sequencing and avoid duplicates
                            
                            // Update the specific device in the global map
                            setDeviceForClientAssetId(clientName, asset_id, device);
                            
                            let message = {
                                type: 'INFO',
                                category: 'STATUS',
                                title: `The Instrument ${asset_id} is ${PharmaConstant.DISCONNECTED}.`,
                                message: `The Instrument ${asset_id} is ${PharmaConstant.DISCONNECTED}.`
                            };
                            publishDeviceStateMessage(
                                JSON.stringify(message),
                                clientName,
                                asset_id,
                                assetType
                            );
                        }
                        logger.info(`Updated connection status for asset ${asset_id} to ${connectionStatus}.`);
                        device.disconnectCount = 0;
                    } else {
                        logger.debug(`Asset ${asset_id} has been disconnected ${device.disconnectCount} times consecutively.`);
                    }
                } else {
                    device.disconnectCount = 0;
                    if (
                        device.connection_status === PharmaConstant.DISCONNECTED &&
                        connectionStatus !== PharmaConstant.DISCONNECTED
                    ) {
                        // Update connection status on the device
                        device.connection_status = PharmaConstant.CONNECTED;
                        
                        const updatedAsset = await updateAsset(
                            device.id,
                            { connection_status: PharmaConstant.CONNECTED },
                            clientName
                        );
                        if (updatedAsset) {
                            logger.info(`Database updated with connection status: ${PharmaConstant.CONNECTED} for device ${device.id}`);
                            
                            // Note: Instrument status audit events are handled after heartbeat reconnection
                            // to ensure proper sequencing and avoid duplicates
                            
                            // Update the specific device in the global map
                            setDeviceForClientAssetId(clientName, asset_id, device);
                            let message = {
                                type: 'INFO',
                                category: 'STATUS',
                                title: `The Instrument ${asset_id} is ${PharmaConstant.CONNECTED}.`,
                                message: `The Instrument ${asset_id} is ${PharmaConstant.CONNECTED}.`
                            };
                            publishDeviceStateMessage(
                                JSON.stringify(message),
                                clientName,
                                asset_id,
                                assetType
                            );
                        }
                        await updateTimeSync(assetTime, asset_id, clientName);
                        logger.info(`Updated connection status for asset ${asset_id} to ${PharmaConstant.CONNECTED}.`);
                    }
                }
                
                // Check for instrument status change for ALL heartbeat messages (not just reconnection)
                const shouldAuditDisconnection = (previousDeviceStatus !== PharmaConstant.DISCONNECTED && 
                                                currentDeviceStatus === PharmaConstant.DISCONNECTED);

                // Check if we just reconnected from heartbeat-only disconnection
                const wasOnlyHeartbeatDisconnected = device.justReconnectedFromHeartbeat && 
                                                   device.statusWhenHeartbeatLost !== PharmaConstant.DISCONNECTED;
                
                const shouldAuditConnection = (previousDeviceStatus === PharmaConstant.DISCONNECTED && 
                                             currentDeviceStatus !== PharmaConstant.DISCONNECTED) &&
                                             !wasOnlyHeartbeatDisconnected;
                
                if (shouldAuditDisconnection) {
                    // Create Instrument Disconnected audit based on heartbeat message status change
                    const instrumentAuditObj = {
                        asset_id: device.id,
                        event_type: "Instrument Disconnected",
                        source: PharmaConstant.EXTERNAL,
                        comments: `Asset ${asset_id} disconnected due to status change`,
                        asset_name: device.name,
                        asset_type_id: parseInt(device.asset_type_id, 10) || device.asset_type_id,
                        meta: {
                            "site_info": {
                                "id": parseInt(device.site_id, 10) || device.site_id,
                                "name": device.asset__site___name,
                                "status": "ACTIVE",
                                "site_timezone": device.asset__site___site_timezone || device.asset__site___timezone
                            }
                        }
                    };
                    await createAudit(instrumentAuditObj, clientName);
                    
                } else if (shouldAuditConnection ) {
                    // Create Instrument Connected audit based on heartbeat message status change
                    const instrumentAuditObj = {
                        asset_id: device.id,
                        event_type: "Instrument Connected",
                        source: PharmaConstant.EXTERNAL,
                        comments: `Asset ${asset_id} connected due to status change`,
                        asset_name: device.name,
                        asset_type_id: parseInt(device.asset_type_id, 10) || device.asset_type_id,
                        meta: {
                            "site_info": {
                                "id": parseInt(device.site_id, 10) || device.site_id,
                                "name": device.asset__site___name,
                                "status": "ACTIVE",
                                "site_timezone": device.asset__site___site_timezone || device.asset__site___timezone
                            }
                        }
                    };
                    await createAudit(instrumentAuditObj, clientName);
                }
                
                // Update last device status for next comparison
                device.last_device_status = currentDeviceStatus;
                
                // Clear tracking flags after processing
                if (device.justReconnectedFromHeartbeat) {
                    device.justReconnectedFromHeartbeat = false;
                    device.statusWhenHeartbeatLost = undefined;
                }
                
                setDeviceForClientAssetId(clientName, asset_id, device);
            }
        } catch (error) {
            logger.error('Error processing BASIC_TOPIC message:', error);
        }
    }


    const handleMetaHeartbeat = async (clientName, deviceHeartbeat, assetType, asset_id) => {
        console.log("handleMetaHeartbeat called for asset_id:", asset_id);
        // if (deviceHeartbeat.asset_id == 'C3100-02:49:10:12:41:c5') {
        //     console.log("deviceHeartbeat", deviceHeartbeat);

        // }
        // Validate required keys
        if (!deviceHeartbeat || typeof deviceHeartbeat !== 'object' ||
            !('asset_id' in deviceHeartbeat) ||
            !('info' in deviceHeartbeat) ||
            !('asset_time' in deviceHeartbeat) ||
            deviceHeartbeat?.info?.model === undefined ||
            !deviceHeartbeat?.info?.name || deviceHeartbeat.info.name.trim() === '' ||
            !assetType
        ) 
        {
            logger.warn('Invalid meta heartbeat:', deviceHeartbeat);

            // Identify missing keys
            let missingKeys = [
                !('asset_id' in deviceHeartbeat) ? 'asset_id' : null,
                !('info' in deviceHeartbeat) ? 'info' : null,
                !('asset_time' in deviceHeartbeat) ? 'asset_time' : null,
                (deviceHeartbeat?.info?.model === undefined) ? 'info.model' : null,
                (!deviceHeartbeat?.info?.name || deviceHeartbeat.info.name.trim() === '') ? 'info.name' : null,
                !assetType ? 'assetType' : null
            ].filter(Boolean).join(', ');

            let message = {
                type: 'ALERT',
                category: 'INFO',
                title: `Required keys are missing in the meta heartbeat.`,
                message: `Required keys are missing in the meta heartbeat. Here are the details: ${missingKeys}.`
            };
            publishDeviceStateMessage(
                JSON.stringify(message),
                clientName,
                deviceHeartbeat?.asset_id || 'unknown',
                assetType
            );
            return;
        }

        logger.debug('Received message on META_TOPIC:');
        try {

            // Get devices for the client from the map
            logger.info(`[META-HB] Getting devices for client: ${clientName}, asset_id: ${asset_id}`);
            let devices = getDevicesByClientId(clientName);
            logger.info(`[META-HB] Retrieved devices from global map: ${devices ? devices.length : 'null'}`);
            
            if (!devices) {
                devices = [];
                setGlobalDevicesByClient(clientName, devices);
                logger.info(`[META-HB] Initialized empty devices array for client: ${clientName}`);
            }
            devices = devices.filter(device => device !== undefined);
            logger.info(`[META-HB] After filtering undefined devices: ${devices.length} devices`);
         
            // Log device IDs for debugging
            if (devices.length > 0) {
                const deviceIds = devices.map(d => d?.asset_id).filter(Boolean);
                logger.info(`[META-HB] Device IDs in memory: ${deviceIds.join(', ')}`);
            }
            const now = Date.now();
            if (devices.length === 0) {
                logger.debug(`Onboarding the device.`);
                const isOnBoarded = await onboardNewDevice(deviceHeartbeat, assetType, clientName, now);
                if (isOnBoarded) {
                    const testMessage = JSON.stringify({ asset_id: deviceHeartbeat?.asset_id, asset_name: deviceHeartbeat?.info?.name });
                    publishMessage(testMessage, clientName, assetType);
                    // check if assetTime is present and valid and update isDeviceSync flag in the db 
                    if (deviceHeartbeat?.asset_time && deviceHeartbeat?.asset_id) {
                        await updateTimeSync(deviceHeartbeat.asset_time, deviceHeartbeat.asset_id, clientName);
                    } else {
                        logger.warn("assetTime or asset_id is missing");
                    }                
                    }
            } else {
                // Check if the deviceHeartbeat.info.name is already assigned to another device (except for the device with matching asset_id)
                const duplicateNameDevice = devices.find(
                    d => d && d.asset_id !== deviceHeartbeat.asset_id && d.name && d.name === deviceHeartbeat.info.name
                );
                if (duplicateNameDevice) {
                    logger.warn(`Device name '${deviceHeartbeat.info.name}' is already assigned to another device (asset_id: ${duplicateNameDevice.asset_id}). Requesting update.`);

                    // Create audit event for onboarding failure due to duplicate name
                    try {
                        // Get asset type for the new device
                        const assetTypeObj = await getAssetTypeObject(assetType, clientName);
                        const assetTypeId = assetTypeObj?.id || null;

                        // Get default site for the client (based on deviceHeartbeat)
                        const sites = await getDefaultSite(clientName);
                        let defaultSite = null;

                        if (sites && sites.length > 0) {
                            // Try to match by timezone if available from heartbeat
                            if (deviceHeartbeat?.asset_time?.timeZone) {
                                const timezoneSite = sites.find(site => site.site_timezone === deviceHeartbeat.asset_time.timeZone);
                                if (timezoneSite) {
                                    defaultSite = timezoneSite;
                                }
                            }

                            // If no timezone match, use the default site
                            if (!defaultSite) {
                                defaultSite = sites.find(site => site.is_default === true) || sites[0];
                            }
                        }

                        const auditObj = {
                            // Don't send asset_id for onboarding failures - device not in DB yet
                            event_type: PharmaConstant.INSTRUMENT_ONBOARDING_FAILED,
                            comments: `Onboarding failed - instrument name '${deviceHeartbeat.info.name}' is already assigned to device ${duplicateNameDevice.asset_id}`,
                            asset_type_id: assetTypeId ? parseInt(assetTypeId, 10) : null,
                            meta: {
                                "asset_id": deviceHeartbeat.asset_id,  // Store device identifier in meta instead
                                "site_info": {
                                    "id": defaultSite ? (parseInt(defaultSite.id, 10) || defaultSite.id) : null,
                                    "name": defaultSite?.name || null,
                                    "status": defaultSite?.status || "ACTIVE",
                                    "site_timezone": defaultSite?.site_timezone || null
                                }
                            }
                        };
                        await createAudit(auditObj, clientName);
                        logger.info(`Audit event created for onboarding failure - duplicate name: ${deviceHeartbeat.info.name}`);
                    } catch (auditError) {
                        logger.error('Failed to create audit event for duplicate name onboarding failure:', auditError);
                    }

                    const message = {
                        type: 'ALERT',
                        category: 'INFO',
                        title: `Onboarding failed for ${deviceHeartbeat.info.name} because the instrument name is already in use.`,
                        message: `The instrument with the name  ${deviceHeartbeat.info.name} has already been onboarded. Please use a different name.`
                    };
                    publishDeviceStateMessage(
                        JSON.stringify(message),
                        clientName,
                        deviceHeartbeat.asset_id,
                        assetType
                    );
                    return;
                }
                logger.info(`[META-HB] Searching for device with asset_id: ${asset_id} among ${devices.length} devices`);
                const device = devices.find(device => device && device.asset_id === asset_id);
                if (device) {
                    logger.info(`[META-HB] Device ${asset_id} found in memory - already onboarded`);
                    // Notifications for next calibration date
                    calibrationNotifier(clientName, deviceHeartbeat, assetType, asset_id, publishDeviceStateMessage);
                    const getChangedKeys = handleDeviceUpdate(device, deviceHeartbeat);
                    let payload = { info: deviceHeartbeat.info };
                    const deviceNameChange = getChangedKeys.find(each => each.key === "name");
                    if (deviceNameChange) {
                        payload.name = deviceNameChange.updatedValue;
                    }
                    logger.debug("getChangedKeys::", getChangedKeys)
                    if (getChangedKeys.length || device.info === null) {
                        const updateResult = await updateAsset(device.id, payload, clientName);
                        
                        // Send notification if name was changed and update was successful
                        if (deviceNameChange && updateResult) {
                            const oldName = deviceNameChange.originalValue || 'unknown';
                            const newName = deviceNameChange.updatedValue;
                            device.name = deviceNameChange.updatedValue;
                            const message = {
                                type: 'INFO',
                                category: 'INFO',
                                title: `Instrument name updated for ${asset_id}.`,
                                message: `Instrument name for asset ${asset_id}  has been changed from '${oldName}' to '${newName}'.`
                            };
                            
                            publishDeviceStateMessage(
                                JSON.stringify(message),
                                clientName,
                                asset_id,
                                assetType
                            );
                            
                            logger.info(`Device name changed for ${asset_id}: ${oldName} -> ${newName}`);
                        }
                        device.info = deviceHeartbeat.info;
                        // Update the specific device in the global map
                        setDeviceForClientAssetId(clientName, asset_id, device);
                    }
                } else {
                    logger.info(`[META-HB] Device ${asset_id} NOT found in memory - will attempt onboarding`);
                    const isOnBoarded = await onboardNewDevice(deviceHeartbeat, assetType, clientName, now);
                    if (isOnBoarded) {
                        const testMessage = JSON.stringify({ asset_id: deviceHeartbeat?.asset_id, asset_name: deviceHeartbeat?.info?.name });
                        publishMessage(testMessage, clientName, assetType);
                        // check if assetTime is present and valid and update isDeviceSync flag in the db 
                        if (deviceHeartbeat?.asset_time && deviceHeartbeat?.asset_id) {
                            await updateTimeSync(deviceHeartbeat.asset_time, deviceHeartbeat.asset_id, clientName);
                        } else {
                            logger.warn("assetTime or asset_id is missing");
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Error processing MQTT message:', error);
        }
    }

    const handleSiteUpdate = async (clientName, messageData, assetType, asset_id) => {
        try {
            logger.info(`[SITE-UPDATE] Received site update for asset  ${assetType}/${asset_id} from client ${clientName}`);

            // Validate the message structure
            if (!messageData || typeof messageData !== 'object' || !messageData.meta) {
                logger.warn(`[SITE-UPDATE] Invalid site update message structure for asset ${asset_id}`);
                return;
            }

            const siteInfo = messageData.meta;

            // Validate required site fields
            if (!siteInfo.id || !siteInfo.name) {
                logger.warn(`[SITE-UPDATE] Missing required site fields (id or name) for asset ${asset_id}`);
                return;
            }

            // Get the device from global map
            const device = getDeviceForClientByAssetId(clientName, asset_id);

            if (!device) {
                logger.warn(`[SITE-UPDATE] Device ${asset_id} not found in global map for client ${clientName}`);
                return;
            }

            logger.info(`[SITE-UPDATE] Updating site information for asset ${asset_id}`);
            logger.debug(`[SITE-UPDATE] New site data:`, siteInfo);

            // Update site-related fields in the device object
            const oldSiteId = device.site_id;
            const oldSiteName = device.asset__site___name;

            // Update site fields
            device.site_id = parseInt(siteInfo.id, 10) || siteInfo.id;
            device.asset__site___name = siteInfo.name;
            device.asset__site___timezone = siteInfo.site_timezone || null;
            device.asset__site___status = siteInfo.status || 'ACTIVE';
            device.asset__site___alias = siteInfo.alias || null;
            device.asset__site___description = siteInfo.description || null;
            device.asset__site___is_current = siteInfo.is_current || false;
            device.asset__site___is_default = siteInfo.is_default || false;

            // Update the device in global map
            setDeviceForClientAssetId(clientName, asset_id, device);

            logger.info(`[SITE-UPDATE] Successfully updated site information for asset ${asset_id}`);
            logger.info(`[SITE-UPDATE] Site changed from ${oldSiteName} (ID: ${oldSiteId}) to ${siteInfo.name} (ID: ${siteInfo.id})`);



        } catch (error) {
            logger.error(`[SITE-UPDATE] Error handling site update for asset ${asset_id}:`, error);
        }
    }
    const publishMessage = (message, clientName, assetType) => {
        logger.debug("published message", message)
        const topic = `${clientName}/instrument/${assetType}/new-device-onboarded`;
        mqttClient.publish(topic, message, { qos: 1 }, (err) => {
            if (err) {
                logger.error(`Failed to publish message to topic ${topic}:`, err);
            } else {
                logger.debug(`Message published to ${topic}:`, message);
            }
        });
    };
    const publishDeviceStateMessage = (message, clientName, assetId, assetType) => {
        logger.debug("Before publishDeviceStateMessage", "message:", message, "clientName:", clientName, "assetId:", assetId, "assetType:", assetType)
        const topic = `${clientName}/instrument/${assetType}/${assetId}/notification`;
        mqttClient.publish(topic, message, { qos: 1 }, (err) => {
            if (err) {
                logger.error(`Failed to publish message to topic ${topic}:`, err);
            } else {
                logger.debug(`Message published to ${topic}:`, message);
            }
        });
    };
    
    /**
     * Ensure asset model exists, create if necessary
     * @param {string} modelName - Model name from device heartbeat
     * @param {string} assetType - Asset type name
     * @param {string} clientName - Client name
     * @returns {Object|null} Model object or null on failure
     */
    // const ensureAssetModelExists = async (modelName, assetType, clientName) => {
    //     try {
    //         logger.info(`[MODEL-CHECK] Checking if asset model '${modelName}' exists for client: ${clientName}`);
            
    //         // Check if model exists
    //         const existingModel = await getModelObject(modelName, clientName);
    //         if (existingModel) {
    //             logger.info(`[MODEL-CHECK] Asset model '${modelName}' already exists`);
    //             return existingModel;
    //         }
            
    //         logger.info(`[MODEL-CREATE] Model '${modelName}' not found, attempting to create it`);
            
    //         // Get asset type ID from the asset type
    //         const assetTypeObj = await getAssetTypeObject(assetType, clientName);
    //         if (!assetTypeObj || !assetTypeObj.id) {
    //             logger.error(`[MODEL-CREATE] Failed: Asset type '${assetType}' not found for client: ${clientName}`);
    //             return null;
    //         }
            
    //         logger.info(`[MODEL-CREATE] Found asset type '${assetType}' with ID: ${assetTypeObj.id}`);
            
    //         // Create new model if it doesn't exist
    //         const modelData = {
    //             name: modelName,
    //             asset_type_id: parseInt(assetTypeObj.id, 10),
    //             description: modelName
    //         };
            
    //         const newModel = await createAssetModel(modelData, clientName);
    //         if (newModel) {
    //             logger.info(`[MODEL-CREATE] Successfully created new asset model '${modelName}' for asset type '${assetType}'`);
    //         } else {
    //             logger.error(`[MODEL-CREATE] Failed to create asset model '${modelName}'`);
    //         }
    //         return newModel;
    //     } catch (error) {
    //         logger.error(`[MODEL-ERROR] Unexpected error in ensureAssetModelExists for model '${modelName}':`, error);
    //         return null;
    //     }
    // };
    
    const onboardNewDevice = async (deviceHeartbeat, assetType, clientName, now) => {
        try {
            // Ensure asset model exists first
            const modelName = deviceHeartbeat?.info?.model;
            if (!modelName) {
                logger.error('No model name provided in device heartbeat');
                return false;
            }
            
            // const modelObj = await ensureAssetModelExists(modelName, assetType, clientName);
            // if (!modelObj) {
            //     logger.error('Failed to get or create asset model');

            //     // Create audit event for onboarding failure due to model error
            //     try {
            //         // Get asset type for the new device
            //         const assetTypeObj = await getAssetTypeObject(assetType, clientName);
            //         const assetTypeId = assetTypeObj?.id || null;

            //         // Get default site for the client (based on deviceHeartbeat)
            //         const sites = await getDefaultSite(clientName);
            //         let defaultSite = null;

            //         if (sites && sites.length > 0) {
            //             // Try to match by timezone if available from heartbeat
            //             if (deviceHeartbeat?.asset_time?.timeZone) {
            //                 const timezoneSite = sites.find(site => site.site_timezone === deviceHeartbeat.asset_time.timeZone);
            //                 if (timezoneSite) {
            //                     defaultSite = timezoneSite;
            //                 }
            //             }

            //             // If no timezone match, use the default site
            //             if (!defaultSite) {
            //                 defaultSite = sites.find(site => site.is_default === true) || sites[0];
            //             }
            //         }

            //         const auditObj = {
            //             // Don't send asset_id for onboarding failures - device not in DB yet
            //             event_type: PharmaConstant.INSTRUMENT_ONBOARDING_FAILED,
            //             comments: `Onboarding failed - unable to create or find model '${modelName}' for asset type '${assetType}'`,
            //             asset_name: deviceHeartbeat?.info?.name || 'Unknown',
            //             asset_type_id: assetTypeId ? parseInt(assetTypeId, 10) : null,
            //             meta: {
            //                 "asset_id": deviceHeartbeat.asset_id,  // Store device identifier in meta instead
            //                 "site_info": {
            //                     "id": defaultSite ? (parseInt(defaultSite.id, 10) || defaultSite.id) : null,
            //                     "name": defaultSite?.name || null,
            //                     "status": defaultSite?.status || "ACTIVE",
            //                     "site_timezone": defaultSite?.site_timezone || null
            //                 }
            //             }
            //         };
            //         await createAudit(auditObj, clientName);
            //         logger.info(`Audit event created for onboarding failure - model error: ${modelName}`);
            //     } catch (auditError) {
            //         logger.error('Failed to create audit event for model onboarding failure:', auditError);
            //     }

            //     let message = {
            //         type: 'INFO',
            //         category: 'INFO',
            //         title: `Onboarding ${deviceHeartbeat.asset_id} failed due to an internal server error.`,
            //         message: `No model found for device ${deviceHeartbeat.asset_id}. Onboarding failed due to an internal server error.`
            //     };
            //     publishDeviceStateMessage(JSON.stringify(message), clientName, deviceHeartbeat.asset_id, assetType);
            //     return false;
            // }
            
            // Continue with asset creation, passing the validated model
            const asset = await constructAssetObj(deviceHeartbeat, assetType, clientName);
            if (asset) {
                // Create asset in database here
                logger.info(`[ONBOARD] Creating asset in DB for asset_id: ${deviceHeartbeat.asset_id}, name: ${asset.name}`);
                console.log("::: asset :::", asset)
                const newDevice = await createAsset(asset, clientName);
                logger.info(`[ONBOARD] createAsset API response for ${deviceHeartbeat.asset_id}:`, JSON.stringify(newDevice));
                
                if (newDevice && newDevice.status === 'fail' && newDevice.message && newDevice.message.includes(PharmaConstant.ERROR_ASSET_NAME_DUPLICATE)) {
                    logger.error(`Device with name ${asset.name} already exists. Checking global map and database.`);

                    // Check if device with this name exists in global map
                    const devices = getDevicesByClientId(clientName);
                    const existingDeviceInMemory = devices?.find(d => d && d.name === asset.name);

                    if (!existingDeviceInMemory) {
                        // Not in memory, fetch from database
                        logger.info(`Device with name ${asset.name} not in global map, fetching from database`);
                        const assetsFromDb = await getAssetByName(asset.name, clientName);

                        if (assetsFromDb && assetsFromDb.length > 0) {
                            // Add all devices with this name to global map
                            for (const dbDevice of assetsFromDb) {
                                logger.info(`Adding device ${dbDevice.asset_id} with name ${asset.name} to global map`);
                                // Set heartbeatTimestamp for the device from DB
                                dbDevice.heartbeatTimestamp = Date.now();
                                setDeviceForClientAssetId(clientName, dbDevice.asset_id, dbDevice);
                            }
                        }
                    }

                    // Send notification
                    // let message = {
                    //     type: 'INFO',
                    //     category: 'INFO',
                    //     title: `Instrument ${asset.name} already onboarded, use different instrument name.`,
                    //     message: `Instrument already onboarded with instrument name: ${asset.name}, use different instrument name..`
                    // };
                    // publishDeviceStateMessage(JSON.stringify(message), clientName, deviceHeartbeat.asset_id, assetType);
                    return false;
                }
                
                if (newDevice && newDevice.status === 'fail' && newDevice.message && newDevice.message.includes(PharmaConstant.ERROR_ASSET_ID_DUPLICATE)) {
                    logger.error(`Device with asset_id ${deviceHeartbeat.asset_id} already exists. Checking global map and database.`);

                    // Check if device with this asset_id exists in global map
                    const existingDeviceInMemory = getDeviceForClientByAssetId(clientName, deviceHeartbeat.asset_id);

                    if (!existingDeviceInMemory) {
                        // Not in memory, fetch from database
                        logger.info(`Device with asset_id ${deviceHeartbeat.asset_id} not in global map, fetching from database`);
                        const assetFromDb = await getAsset(deviceHeartbeat.asset_id, clientName);

                        if (assetFromDb) {
                            logger.info(`Adding device ${assetFromDb.asset_id} to global map`);
                            // Set heartbeatTimestamp for the device from DB
                            assetFromDb.heartbeatTimestamp = Date.now();
                            setDeviceForClientAssetId(clientName, assetFromDb.asset_id, assetFromDb);
                        }
                    }

                    return false;
                }
                // Check if it's a successful response (either has status='success' or doesn't have status field at all)
                logger.info(`[ONBOARD] Checking success status for ${deviceHeartbeat.asset_id}: status=${newDevice?.status}, has data property=${!!newDevice?.data}`);
                if (newDevice && (!newDevice.status || newDevice.status === 'Onboarded')) {
                    const deviceData = newDevice.data || newDevice; // Handle both old and new response format
                    logger.info(`[ONBOARD] Device data extracted for ${deviceHeartbeat.asset_id}:`, JSON.stringify(deviceData));

                    // Create asset-type mapping BEFORE adding to memory
                    let assetTypeObj = null;
                    try {
                        assetTypeObj = await getAssetTypeObject(assetType, clientName);
                        if (!assetTypeObj || !assetTypeObj.id) {
                            throw new Error(`Asset type '${assetType}' not found`);
                        }

                        const mappingPayload = {
                            asset_id: deviceData.id,  // DB ID from created asset
                            asset_type_id: parseInt(assetTypeObj.id, 10),
                            state: "Connected",
                            created_date: new Date().toISOString(),
                            last_updated_date: new Date().toISOString()
                        };

                        logger.info(`[MAPPING] Creating asset-type mapping for asset ID: ${deviceData.id}`);
                        await createAssetTypeMapping(mappingPayload, clientName);
                        logger.info(`[MAPPING] Successfully created mapping for asset ID: ${deviceData.id}`);

                    } catch (mappingError) {
                        logger.error(`[MAPPING] Failed to create asset-type mapping for ${deviceHeartbeat.asset_id}:`, mappingError);

                        // Create audit event for mapping failure
                        try {
                            const sites = await getDefaultSite(clientName);
                            let defaultSite = sites?.find(site => site.is_default === true) || sites?.[0];

                            const auditObj = {
                                event_type: PharmaConstant.INSTRUMENT_ONBOARDING_FAILED,
                                comments: `Onboarding failed - unable to create asset-type mapping: ${mappingError.message}`,
                                asset_type_id: assetTypeObj?.id ? parseInt(assetTypeObj.id, 10) : null,
                                meta: {
                                    "asset_id": deviceHeartbeat.asset_id,
                                    "site_info": {
                                        "id": defaultSite ? (parseInt(defaultSite.id, 10) || defaultSite.id) : null,
                                        "name": defaultSite?.name || null,
                                        "status": defaultSite?.status || "ACTIVE",
                                        "site_timezone": defaultSite?.site_timezone || null
                                    }
                                }
                            };
                            await createAudit(auditObj, clientName);
                        } catch (auditError) {
                            logger.error('Failed to create audit event for mapping failure:', auditError);
                        }

                        // Send failure notification
                        let message = {
                            type: 'INFO',
                            category: 'INFO',
                            title: `Onboarding ${deviceHeartbeat.asset_id} failed due to asset-type mapping error.`,
                            message: `Failed to create asset-type mapping for ${deviceHeartbeat.asset_id}. Please contact support.`
                        };
                        publishDeviceStateMessage(JSON.stringify(message), clientName, deviceHeartbeat.asset_id, assetType);

                        // FAIL ONBOARDING - don't add to memory, return false
                        return false;
                    }

                    // Only proceed if mapping succeeded
                    deviceData.connection_status = 'Connected';
                    deviceData.heartbeatTimestamp = now;

                    // Use setDeviceForClientAssetId to add the device atomically
                    logger.info(`[ONBOARD] Adding device ${deviceHeartbeat.asset_id} to global map`);
                    setDeviceForClientAssetId(clientName, deviceHeartbeat.asset_id, deviceData);

                    // Verify the device was added to global map
                    const verifyDevice = getDeviceForClientByAssetId(clientName, deviceHeartbeat.asset_id);
                    logger.info(`[ONBOARD] Verification - Device ${deviceHeartbeat.asset_id} found in global map: ${!!verifyDevice}`);

                    logger.info(`[ONBOARD] Device ${deviceHeartbeat.asset_id} onboarded successfully.`);
                     let message = {
                        type: 'INFO',
                        category: 'INFO',
                        title: `Instrument  ${deviceHeartbeat.asset_id} onboarded sucessfully.`,
                        message: `Instrument  ${deviceHeartbeat.asset_id} has been successfully onboarded with the name: ${asset.name}.`
                    };

                    publishDeviceStateMessage(JSON.stringify(message), clientName, deviceHeartbeat.asset_id, assetType);
                    return true;
                } else {
                    logger.error('Failed to create asset in database.');

                    // Create audit event for onboarding failure due to general creation error
                    try {
                        // Get asset type for the new device
                        const assetTypeObj = await getAssetTypeObject(assetType, clientName);
                        const assetTypeId = assetTypeObj?.id || null;

                        // Get default site for the client (based on deviceHeartbeat)
                        const sites = await getDefaultSite(clientName);
                        let defaultSite = null;

                        if (sites && sites.length > 0) {
                            // Try to match by timezone if available from heartbeat
                            if (deviceHeartbeat?.asset_time?.timeZone) {
                                const timezoneSite = sites.find(site => site.site_timezone === deviceHeartbeat.asset_time.timeZone);
                                if (timezoneSite) {
                                    defaultSite = timezoneSite;
                                }
                            }

                            // If no timezone match, use the default site
                            if (!defaultSite) {
                                defaultSite = sites.find(site => site.is_default === true) || sites[0];
                            }
                        }

                        const auditObj = {
                            // Don't send asset_id for onboarding failures - device not in DB yet
                            event_type: PharmaConstant.INSTRUMENT_ONBOARDING_FAILED,
                            comments: `Onboarding failed - unable to create asset in database`,
                            asset_type_id: assetTypeId ? parseInt(assetTypeId, 10) : null,
                            meta: {
                                "asset_id": deviceHeartbeat.asset_id,  // Store device identifier in meta instead
                                "site_info": {
                                    "id": defaultSite ? (parseInt(defaultSite.id, 10) || defaultSite.id) : null,
                                    "name": defaultSite?.name || null,
                                    "status": defaultSite?.status || "ACTIVE",
                                    "site_timezone": defaultSite?.site_timezone || null
                                }
                            }
                        };
                        await createAudit(auditObj, clientName);
                        logger.info(`Audit event created for onboarding failure - general creation error`);
                    } catch (auditError) {
                        logger.error('Failed to create audit event for general creation failure:', auditError);
                    }

                    let message = {
                        type: 'INFO',
                        category: 'INFO',
                        title: `Onboarding ${deviceHeartbeat.asset_id} failed due to an internal server error.`,
                        message: `Onboarding ${deviceHeartbeat.asset_id} failed due to an internal server error.`
                    };
                    publishDeviceStateMessage(JSON.stringify(message), clientName, deviceHeartbeat.asset_id, assetType);
                    return false;
                }
            } else {
                // Create audit event for onboarding failure due to asset construction error
                try {
                    // Get asset type for the new device
                    const assetTypeObj = await getAssetTypeObject(assetType, clientName);
                    const assetTypeId = assetTypeObj?.id || null;

                    // Get default site for the client (based on deviceHeartbeat)
                    const sites = await getDefaultSite(clientName);
                    let defaultSite = null;

                    if (sites && sites.length > 0) {
                        // Try to match by timezone if available from heartbeat
                        if (deviceHeartbeat?.asset_time?.timeZone) {
                            const timezoneSite = sites.find(site => site.site_timezone === deviceHeartbeat.asset_time.timeZone);
                            if (timezoneSite) {
                                defaultSite = timezoneSite;
                            }
                        }

                        // If no timezone match, use the default site
                        if (!defaultSite) {
                            defaultSite = sites.find(site => site.is_default === true) || sites[0];
                        }
                    }

                    const auditObj = {
                        // Don't send asset_id for onboarding failures - device not in DB yet
                        event_type: PharmaConstant.INSTRUMENT_ONBOARDING_FAILED,
                        comments: `Onboarding failed - unable to construct asset object`,
                        asset_type_id: assetTypeId ? parseInt(assetTypeId, 10) : null,
                        meta: {
                            "asset_id": deviceHeartbeat.asset_id,  // Store device identifier in meta instead
                            "site_info": {
                                "id": defaultSite ? (parseInt(defaultSite.id, 10) || defaultSite.id) : null,
                                "name": defaultSite?.name || null,
                                "status": defaultSite?.status || "ACTIVE",
                                "site_timezone": defaultSite?.site_timezone || null
                            }
                        }
                    };
                    await createAudit(auditObj, clientName);
                    logger.info(`Audit event created for onboarding failure - asset construction error`);
                } catch (auditError) {
                    logger.error('Failed to create audit event for asset construction failure:', auditError);
                }

                let message = {
                    type: 'INFO',
                    category: 'INFO',
                    title: `Onboarding ${deviceHeartbeat.asset_id} failed due to an internal server error.`,
                    message: `Onboarding ${deviceHeartbeat.asset_id} failed due to an internal server error.`
                };
                publishDeviceStateMessage(JSON.stringify(message), clientName, deviceHeartbeat.asset_id, assetType);
                logger.error('Failed to build asset object. The device was not added to the database.');
                return false;
            }
        } catch (error) {
            logger.error('Error onboarding new device:', error);
            return false;
        }
    };

    const handleDeviceUpdate = (device, deviceHeartbeat) => {
        let original = device.info; // Assuming device.info is already a parsed object
        let updated = deviceHeartbeat.info; // Assuming deviceHeartbeat.info is already a parsed object
        let changedDetails = [];
        const getChangedKeysWithValues = (original, updated, parentKey = '') => {
            let changes = [];
            // Helper function to deeply compare two objects or arrays
            const deepEqual = (obj1, obj2) => {
                if (Array.isArray(obj1) && Array.isArray(obj2)) {
                    if (obj1.length !== obj2.length) return false;
                    return obj1.every((item, index) => deepEqual(item, obj2[index]));
                } else if (typeof obj1 === 'object' && typeof obj2 === 'object' && obj1 !== null && obj2 !== null) {
                    const keys1 = Object.keys(obj1);
                    const keys2 = Object.keys(obj2);
                    if (keys1.length !== keys2.length) return false;
                    return keys1.every(key => deepEqual(obj1[key], obj2[key]));
                } else {
                    return obj1 === obj2;
                }
            };

            for (let key in original) {
                if (original.hasOwnProperty(key)) {
                    const fullKey = parentKey ? `${parentKey}.${key}` : key;

                    // Check if the key exists in the updated object
                    if (!updated.hasOwnProperty(key)) {
                        changes.push({
                            key: fullKey,
                            originalValue: original[key],
                            updatedValue: undefined
                        });
                        continue;
                    }

                    // Deep comparison for objects and arrays
                    if (typeof original[key] === 'object' && original[key] !== null) {
                        if (!deepEqual(original[key], updated[key])) {
                            changes.push({
                                key: fullKey,
                                originalValue: original[key],
                                updatedValue: updated[key]
                            });
                            original[key] = updated[key]; // Update the value in the original device info
                        }
                    } else if (original[key] !== updated[key]) {
                        // Primitive values comparison
                        changes.push({
                            key: fullKey,
                            originalValue: original[key],
                            updatedValue: updated[key]
                        });
                        original[key] = updated[key]; // Update the value in the original device info
                    }
                }
            }

            return changes;
        };

        // Get changed details
        changedDetails = getChangedKeysWithValues(original, updated);

        return changedDetails;
    };


    const checkHeartbeats = async () => {

        logger.trace('Checking heartbeat for devices every minute');
        const now = Date.now();
        for (const [clientName, devices] of global.devicesByClient.entries()) {
            if (devices) {
                for (const device of devices) {
                        if (device === undefined || device === null) {
                        continue
                    }
                    if (!device.heartbeatTimestamp) {
                        logger.trace(`Device ${device.asset_id} for Client ${clientName}  does not have a heartbeat timestamp.`);
                        continue;
                    }
                    if ((now - device.heartbeatTimestamp) > heartbeatInterval) {

                        // Find the client and device to update
                        try {

                            if (device.connection_status !== PharmaConstant.DISCONNECTED) {
                                // Update database first to ensure consistency
                                const updatedAsset = await updateAsset(device.id, { connection_status: PharmaConstant.DISCONNECTED }, clientName);
                                if (updatedAsset) {
                                    logger.info(`Database updated with connection status: ${PharmaConstant.DISCONNECTED} for device ${device.id}`);
                                    
                                    // Create audit event for heartbeat disconnection
                                    const auditObj = {
                                        asset_id: device.id,
                                        event_type: "Heartbeat Disconnected",
                                        comments: `Asset ${device.asset_id} disconnected due to no heartbeat`,
                                        asset_name: device.name,
                                        asset_type_id: parseInt(device.asset_type_id, 10) || device.asset_type_id,
                                        meta: {
                                            "site_info": {
                                                "id": parseInt(device.site_id, 10) || device.site_id,
                                                "name": device.asset__site___name,
                                                "status": "ACTIVE",
                                                "site_timezone": device.asset__site___site_timezone || device.asset__site___timezone
                                            }
                                        }
                                    };
                                    await createAudit(auditObj, clientName);
                                    
                                    // Mark that this device was disconnected due to no heartbeat
                                    device.isDisconnectedDueToNoHeartbeat = true;
                                    // Track what the status was when heartbeat was lost
                                    device.statusWhenHeartbeatLost = device.last_device_status || PharmaConstant.CONNECTED;
                                    
                                    // Only update in-memory state if DB update succeeded
                                    device.connection_status = PharmaConstant.DISCONNECTED;
                                    // Update the specific device in the global map
                                    setDeviceForClientAssetId(clientName, device.asset_id, device);

                                    try {
                                        let message = {}
                                        message.type = 'INFO'
                                        message.category = 'STATUS'
                                        message.title = `The Instrument ${device.asset_id} is ${PharmaConstant.DISCONNECTED}.`
                                        message.message = `The Instrument ${device.asset_id} is ${PharmaConstant.DISCONNECTED}.`

                                        publishDeviceStateMessage(JSON.stringify(message), clientName, device.asset_id, device?.asset__asset_type___name);
                                    } catch (error) {
                                        logger.error("Failed to send notification", error);
                                    }
                                } else {
                                    logger.error(`Failed to update database connection status for device ${device.id}. In-memory state not changed.`);
                                }
                                
                                logger.info(`Device ${device.asset_id} marked as disconnected due to missed heartbeat.`);
                            } else {
                                // Device is already disconnected, but we should still track heartbeat loss
                                if (!device.isDisconnectedDueToNoHeartbeat) {
                                    logger.info(`Device ${device.asset_id} is already disconnected, now heartbeat also stopped.`);
                                    
                                    // Create audit event for heartbeat disconnection even though already disconnected
                                    const auditObj = {
                                        asset_id: device.id,
                                        event_type: "Heartbeat Disconnected",
                                        comments: `Asset ${device.asset_id} heartbeat stopped (already disconnected)`,
                                        asset_name: device.name,
                                        asset_type_id: parseInt(device.asset_type_id, 10) || device.asset_type_id,
                                        meta: {
                                            "site_info": {
                                                "id": parseInt(device.site_id, 10) || device.site_id,
                                                "name": device.asset__site___name,
                                                "status": "ACTIVE",
                                                "site_timezone": device.asset__site___site_timezone || device.asset__site___timezone
                                            }
                                        }
                                    };
                                    await createAudit(auditObj, clientName);
                                    
                                    // Mark that heartbeat has stopped
                                    device.isDisconnectedDueToNoHeartbeat = true;
                                    // Track that the device was already disconnected when heartbeat stopped
                                    device.statusWhenHeartbeatLost = PharmaConstant.DISCONNECTED;
                                    setDeviceForClientAssetId(clientName, device.asset_id, device);
                                } else {
                                    logger.debug(`Device ${device.asset_id} is already disconnected due to no heartbeat.`);
                                }
                            }

                        } catch (error) {
                            logger.error(`Error updating device ${device.asset_id} for client ${clientName}:`, error);
                        }
                    } else {
                        logger.trace(`Device ${device.asset_id} has sent a heartbeat recently.`);
                    }
                }
            }
        }



    }

    checkHeartbeatsInterval = setInterval(() => {
        checkHeartbeats().catch(error => {
            logger.error('Error in checkHeartbeats:', error);
        });
    }, 1000);
}

function getTopicHierarchy(topic) {
    return topic.split(config.TOPIC.SEPERATOR);
}
function compareAssetTime(assetTimeObj, siteZone) {
    if (siteZone === null) {
        return false;
    }
    const assetTime = assetTimeObj?.time;
    const assetOffset = assetTimeObj?.offset;
    const assetTimeZone = assetTimeObj?.timeZone;
    const currentTimeSiteZone = moment.tz(siteZone);
    
    logger.debug("compareAssetTime - Asset time:", assetTime, "Asset timezone:", assetTimeZone, "Asset offset:", assetOffset);
    logger.debug("compareAssetTime - Site timezone:", siteZone, "Current time in site zone:", currentTimeSiteZone.format());
    
    // Check timezone match if assetTimeZone is provided
    if (assetTimeZone && assetTimeZone !== siteZone) {
        logger.debug("compareAssetTime - Timezone mismatch:", assetTimeZone, "!==", siteZone);
        return false;
    }
    
    
    // Compare time difference (assume assetTime is in siteZone if no timezone provided)
    const assetMoment = moment.tz(assetTime, siteZone);
    const diffInMinutes = Math.abs(
        currentTimeSiteZone.diff(assetMoment, "minutes")
    );
    logger.debug("compareAssetTime - Time difference in minutes:", diffInMinutes);
    return diffInMinutes <= config.DEVICE.ASSET_TIME_SYNC_CONFIGURABLE;
}
const updateTimeSync = async (assetTime, asset_id, clientName) => {
    // 1. Get in-memory device object
    const deviceObj = getDeviceForClientByAssetId(clientName, asset_id);
    if (!deviceObj) {
        logger.warn(`updateTimeSync: No in-memory device found for client ${clientName}, asset_id ${asset_id}`);
        return;
    }

    // 2. Calculate time validity
    let heartbeatTime = {
        time: assetTime.time,
        offset: assetTime.offset ? assetTime.offset : "",
        timeZone: assetTime.timeZone ? assetTime.timeZone : null

    };

    // 3. Fetch latest asset details from DB
    let assetDetails = await getAsset(asset_id, clientName);
    let siteTimezone =  assetDetails?.asset__site___timezone;
    let isTimeValid = compareAssetTime(heartbeatTime, siteTimezone);
    logger.debug("isTimeValid::::::", isTimeValid);

    // 4. Update in-memory meta if needed
    if (!deviceObj.meta) deviceObj.meta = {};
    if (deviceObj.meta.isDeviceSync !== isTimeValid) {
        deviceObj.meta.isDeviceSync = isTimeValid;
        setDeviceForClientAssetId(clientName, asset_id, deviceObj);
    }

    // 5. Prepare and check DB meta
    let dbMeta = {};
    if (assetDetails?.meta) {
        dbMeta = typeof assetDetails.meta === 'string' ? JSON.parse(assetDetails.meta) : assetDetails.meta;
    }
    if (dbMeta.isDeviceSync !== isTimeValid) {
        dbMeta.isDeviceSync = isTimeValid;
        let updateAssetMeta = await updateAsset(assetDetails?.id, { meta: dbMeta }, clientName);
        logger.info(`Device sync status updated for asset ${asset_id}: ${isTimeValid ? 'synced' : 'not synced'}`);
        logger.debug("updateAssetMeta details:", updateAssetMeta);
    }
}

function calibrationNotifier(clientName, deviceHeartbeat, assetType, assetId, publishDeviceStateMessage) {
    if (!publishDeviceStateMessage || typeof publishDeviceStateMessage !== 'function') {
        logger.error('publishDeviceStateMessage function not provided to calibrationNotifier');
        return;
    }
    
    if (deviceHeartbeat.info.calibration && deviceHeartbeat.info.calibration.next && deviceHeartbeat.info.calibration.next.date) {
        try {
            const calibrationTimeZone = deviceHeartbeat.info.calibration.next.timeZone || 'UTC';
            
            const calibrationDateStr = deviceHeartbeat.info.calibration.next.date;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(calibrationDateStr)) {
                console.log(`Invalid calibration date format for ${assetId}: ${calibrationDateStr}`);
                return;
            }
            
            const nextCalibrationDate = moment.tz(calibrationDateStr, calibrationTimeZone).startOf('day');
            const today = moment.tz(calibrationTimeZone).startOf('day');
            
            if (!nextCalibrationDate.isValid()) {
                console.log(`Invalid calibration date for ${assetId}: ${calibrationDateStr}`);
                return;
            }
            
            const daysRemaining = nextCalibrationDate.diff(today, 'days');
            
            console.log(`Calibration check for ${assetId}: next date ${calibrationDateStr} (${calibrationTimeZone}), days remaining: ${daysRemaining}`);
            
            if (daysRemaining < 0) {
                const overdueBy = Math.abs(daysRemaining);
                const todayDate = getTodayDate();
                const notificationKey = `${assetId}_overdue_${overdueBy}`;
                
                if (calibrationNotifierMap.get(notificationKey) !== todayDate) {
                    const message = {
                        type: 'ALERT',
                        category: 'INFO', 
                        title: `Calibration overdue for instrument ${assetId}.`,
                        message: `Calibration for instrument ${assetId} is overdue by ${overdueBy} day(s). Last due date was ${calibrationDateStr}.`
                    };
                    
                    publishDeviceStateMessage(
                        JSON.stringify(message), 
                        clientName, 
                        assetId, 
                        assetType
                    );
                    
                    calibrationNotifierMap.set(notificationKey, todayDate);
                    logger.info(`Overdue calibration notification sent for ${assetId}: ${overdueBy} days overdue`);
                }
                return;
            }
            
            if (daysRemaining >= 0 && daysRemaining <= 7) {
                const todayDate = getTodayDate();
                const notificationKey = `${assetId}_${daysRemaining}`;
                
                if (calibrationNotifierMap.get(notificationKey) !== todayDate) {
                    let notificationType = 'INFO';
                    let messageText = '';
                    
                    if (daysRemaining === 0) {
                        notificationType = 'ALERT';
                        messageText = `Calibration is due TODAY for instrument ${assetId}.`;
                    } else if (daysRemaining === 1) {
                        notificationType = 'ALERT';
                        messageText = `Calibration is due TOMORROW for instrument ${assetId}.`;
                    } else if (daysRemaining <= 2) {
                        notificationType = 'ALERT';
                        messageText = `Calibration for instrument ${assetId} is due in ${daysRemaining} days.`;
                    } else {
                        notificationType = 'INFO';
                        messageText = `Calibration for instrument ${assetId} is due in ${daysRemaining} days.`;
                    }
                    
                    const message = {
                        type: notificationType,
                        category: 'INFO', 
                        title: `Calibration reminder for instrument ${assetId}.`,
                        message: messageText
                    };
                    
                    publishDeviceStateMessage(
                        JSON.stringify(message), 
                        clientName, 
                        assetId, 
                        assetType
                    );
                    
                    calibrationNotifierMap.set(notificationKey, todayDate);
                    console.log(`Calibration notification sent for ${assetId}: ${daysRemaining} days remaining`);
                } else {
                    console.log(`Calibration notification already sent today for ${assetId}, ${daysRemaining} days remaining`);
                }
            } else if (daysRemaining > 7) {
                console.log(`Calibration for ${assetId} not within notification window: ${daysRemaining} days remaining`);
            }
            
        } catch (error) {
            console.log(`Error processing calibration notification for ${assetId}:`, error);
        }
    } else {
        console.log(`No calibration data found for ${assetId}`);
    }
}

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

module.exports = {
    initializeHeartbeatListener,
    listenToEdgemanTopic,
    listenToValidateInstrumentTopic,
    calibrationNotifier
};
