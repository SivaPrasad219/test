// src/helper/device/deviceStateUtils.js

/**
 * Utility to set devices for a client in global.devicesByClient, filtering out invalid devices.
 * @param {string} clientName
 * @param {Array} devices
 */
function setGlobalDevicesByClient(clientName, devices) {
    if (!global.devicesByClient) {
        global.devicesByClient = new Map();
    }
    console.log(`[DEVICE-UTILS] setGlobalDevicesByClient called for client: ${clientName} - devices array length ${Array.isArray(devices) ? devices.length : 'not an array'}`);
    const validDevices = Array.isArray(devices)
        ? devices.filter(d => d && d.asset_id)
        : [];
    
    console.log(`[DEVICE-UTILS] Valid devices after filtering (with asset_id): ${validDevices.length}`);
    if (validDevices.length > 0) {
        console.log(`[DEVICE-UTILS] Valid device IDs: ${validDevices.map(d => d.asset_id).join(', ')}`);
    }
    
    global.devicesByClient.set(clientName, validDevices);
    console.log(`[DEVICE-UTILS] Updated global map for client ${clientName} with ${validDevices.length} devices`);
}

/**
 * Get devices array for a client by clientName.
 * @param {string} clientName
 * @returns {Array} devices or []
 */
function getDevicesByClientId(clientName) {
    if (!global.devicesByClient) return [];
    const devices = global.devicesByClient.get(clientName);
    return Array.isArray(devices) ? devices : [];
}

/**
 * Get a device for a specific client and asset_id.
 * @param {string} clientName
 * @param {string} assetId
 * @returns {object|null}
 */
function getDeviceForClientByAssetId(clientName, assetId) {
    if (!global.devicesByClient) return null;
    const devices = global.devicesByClient.get(clientName);
    if (Array.isArray(devices)) {
        return devices.find(d => d && d.asset_id === assetId) || null;
    }
    return null;
}

/**
 * Set (replace or add) a device for a given client and asset_id.
 * @param {string} clientName
 * @param {string} assetId
 * @param {object} deviceObj
 */
function setDeviceForClientAssetId(clientName, assetId, deviceObj) {
    if (!global.devicesByClient) {
        global.devicesByClient = new Map();
    }
    let devices = global.devicesByClient.get(clientName) || [];
    const idx = devices.findIndex(d => d && d.asset_id === assetId);
    if (idx !== -1) {
        devices[idx] = deviceObj;
    } else {
        devices.push(deviceObj);
    }
    setGlobalDevicesByClient(clientName, devices);
}

module.exports = {
    setGlobalDevicesByClient,
    getDevicesByClientId,
    getDeviceForClientByAssetId,
    setDeviceForClientAssetId
};
