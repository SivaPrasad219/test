const moment = require('moment');
const logger = require('../helper/logger');
const { PharmaConstant, ApiConstant } = require('../constant/constants');
const {
    getAllData,
    getAssetTypeObject,
    // getModelObject,
    getDefaultSite,
    createAudit,
    getSiteById
} = require('../service/pharma-api.service');
async function getAllClients(endPoint) {
    try {
        const data = await getAllData(endPoint, null);
        if (data && data[PharmaConstant.DATA] && data[PharmaConstant.DATA].length > 0) {
            return data[PharmaConstant.DATA];
        }
    } catch (error) {
        logger.error(`Error fetching getAllClients data: ${error}`);
    }
    return null;
}

async function getAllDevices(endPoint, clientName) {
    try {
        const data = await getAllData(endPoint, clientName);
        if (data && data[PharmaConstant.DATA] && data[PharmaConstant.DATA].length > 0) {
            return data[PharmaConstant.DATA];
        }
    } catch (error) {
        logger.error(`Error fetching getAllClients data: ${error}`);
    }
    return null;
}

async function getDataForEmRequest(endPoint, clientName) {
    try {
        const data = await getAllData(endPoint, clientName);
        if (data && data[PharmaConstant.DATA] && data[PharmaConstant.DATA].length > 0) {
            return data[PharmaConstant.DATA];
        }
    } catch (error) {
        logger.error(`Error fetching getAllClients data: ${error}`);
    }
    return null;
}

async function constructAssetObj(deviceHeartbeat, assetType, clientName) {
    logger.debug("constructAssetObj called", { deviceHeartbeat, assetType, clientName });
    
    // Input validation
    if (!deviceHeartbeat?.asset_id || !deviceHeartbeat?.info) {
        logger.error("Invalid deviceHeartbeat data provided");
        return null;
    }

    try {
        // Execute API calls in parallel for better performance
        const [assetTypeObjResult, sitesResult] = await Promise.allSettled([
            getAssetTypeObject(assetType, clientName),
            // getModelObject(deviceHeartbeat.info.model, clientName),
            getDefaultSite(clientName)
        ]);

        // Extract results with error handling
        const assetTypeObj = assetTypeObjResult.status === 'fulfilled' ? assetTypeObjResult.value : null;
        // const modelObj = modelObjResult.status === 'fulfilled' ? modelObjResult.value : null;
        const sites = sitesResult.status === 'fulfilled' ? sitesResult.value : [];

        // Log any API failures
        if (!assetTypeObj) logger.error("Failed to get device object", assetTypeObjResult.reason);
        // if (!modelObj) logger.error("Failed to get model object", modelObjResult.reason);
        if (!sites.length) logger.error("Failed to get sites", sitesResult.reason);

        // Validate required objects - || !modelObj  is removed to ignore model mapping
        if (!assetTypeObj ) {
            logger.error("Required objects (device or model) not found");
            return null;
        }

        // Determine default site
        const defaultSite = await determineDefaultSite(deviceHeartbeat, sites, clientName);

        // Get connection status
        const connectionStatus = getConnectionStatus(deviceHeartbeat.asset_id, clientName);

        // Build asset object
        const asset = {
            asset_id: deviceHeartbeat.asset_id,
            name: deviceHeartbeat.info.name || 'unknown',
            category: deviceHeartbeat.category,
            connection_status: connectionStatus,
            // asset_type_id: parseInt(assetTypeObj.id, 10),
            model_name: deviceHeartbeat?.info?.model,
            site_id: defaultSite?.id ? parseInt(defaultSite.id, 10) : null,
            status: PharmaConstant.ON_BOARDED,
            create_timestamp: new Date(),
            info: deviceHeartbeat.info
        };

        // Just return the asset object, do not create in DB here
        return asset;
    } catch (error) {
        logger.error("Error in constructAssetObj", error);
        return null;
    }
}

async function determineDefaultSite(deviceHeartbeat, sites, clientName) {
    if (!sites || !sites.length) {
        return null;
    }

    // First, check for default site
    let defaultSite = sites.find(site => site?.is_default === true);

    // Try to match by timezone if available from heartbeat
    const assetTimeObj = getAssetTimeObject(deviceHeartbeat, clientName);
    
    if (assetTimeObj?.timeZone) {
        const timezoneSite = sites.find(site => site.site_timezone === assetTimeObj.timeZone && site?.status?.toLowerCase() === 'active');
        if (timezoneSite) {
            logger.debug("Site matched by timezone", { 
                timezone: assetTimeObj.timeZone, 
                siteId: timezoneSite.id 
            });
            return timezoneSite;
        }
    }

    return defaultSite;
}

function getAssetTimeObject(deviceHeartbeat, clientName) {
    // Check if device already has time offset stored
    const devices = global.devicesByClient?.get(clientName);
    if (devices && Array.isArray(devices)) {
        const foundDevice = devices.find(d => d?.asset_id === deviceHeartbeat.asset_id);
        if (foundDevice?.assetTimeObj) {
            return foundDevice.assetTimeObj;
        }
    }

    // Otherwise, use time from heartbeat
    return deviceHeartbeat.asset_time || null;
}

function getConnectionStatus(assetId, clientName) {
    const devices = global.devicesByClient?.get(clientName);
    
    if (devices && Array.isArray(devices)) {
        const foundDevice = devices.find(d => d?.asset_id === assetId);
        if (foundDevice?.connection_status === PharmaConstant.DISCONNECTED) {
            return PharmaConstant.DISCONNECTED;
        }
    }
    
    // Default to CONNECTED for new devices
    return PharmaConstant.CONNECTED;
}



module.exports = {
    getAllClients,
    getDataForEmRequest,
    constructAssetObj,
    getAllDevices
};