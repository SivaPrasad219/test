const axios = require('axios');
const logger = require('../helper/logger');
const config = require('../config');
const { PharmaConstant, ApiConstant } = require('../constant/constants');
let updateAssetCounter = 0; 
/**
 * Wrapper function to log API calls consistently
 * @param {string} method - HTTP method (GET, POST, PATCH, etc.)
 * @param {string} url - The full URL being called
 * @param {Object} options - Axios options (headers, data, etc.)
 * @returns {Promise} - Axios response promise
 */
async function logApiCall(method, url, options = {}) {
    const startTime = Date.now();
    const logPrefix = `API_CALL`;
    
    // Log API call start
    logger.debug(`${logPrefix}_START: [${method.toUpperCase()}] ${url} | headers: ${JSON.stringify(options.headers || {})}`);
    
    try {
        let response;
        switch (method.toLowerCase()) {
            case 'get':
                response = await axios.get(url, options);
                break;
            case 'post':
                response = await axios.post(url, options.data, { headers: options.headers });
                break;
            case 'patch':
                response = await axios.patch(url, options.data, { headers: options.headers });
                break;
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
        
        const duration = Date.now() - startTime;
        logger.debug(`${logPrefix}_SUCCESS: [${method.toUpperCase()}] ${url} | status: ${response.status} | duration: ${duration}ms`);
        
        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorDetails = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        };
        
        logger.debug(`${logPrefix}_ERROR: [${method.toUpperCase()}] ${url} | error: ${JSON.stringify(errorDetails)} | duration: ${duration}ms`);
        throw error;
    }
}

async function getAllData(endPoint, clientName) {
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        logger.error('Error fetching getAllData data:', error);
    }
}

async function getAssetTypeObject(deviceType, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET_TYPE}?name=${deviceType}`;
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data.data[0];
        }
    } catch (error) {
        // 404 is expected when asset type doesn't exist
        if (error.response && error.response.status === 404) {
            logger.debug(`Asset type '${deviceType}' not found (404)`);
            return null;
        }
        // Log other errors as actual errors
        logger.error('Error fetching getDeviceObj data:', error);
        return null;
    }
}

async function getModelObject(model, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET_MODEL}?name=${model}`;
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data.data[0];
        }
    } catch (error) {
        // 404 is expected when model doesn't exist - this is not an error
        if (error.response && error.response.status === 404) {
            logger.debug(`Asset model '${model}' not found (404) - will be created if needed`);
            return null;
        }
        // Log other errors as actual errors
        logger.error('Error fetching getModelObj data:', error);
        return null;
    }
}
async function createAssetModel(model, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET_MODEL}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('POST', endPoint, { headers, data: model });
        if ((response.status === 201 || response.status === 200) && response.data.status === 'success') {
            return response.data.data;
        } else {
            logger.error('createAssetModel request failed');
            return response.data;
        }
    } catch (error) {
        logger.error('Error creating asset data:', error);
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { status: 'fail', code: 500, data: null, message: error.message };
    }
}

async function getDefaultSite(clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.SITE}`;
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data.data;
        }
    } catch (error) {
        // 404 might occur if no sites are configured
        if (error.response && error.response.status === 404) {
            logger.debug(`No sites found for client '${clientName}' (404)`);
            return null;
        }
        // Log other errors as actual errors
        logger.error('Error fetching getDefaultSite data:', error);
        return null;
    }
}

async function createAsset(deviceObj, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('POST', endPoint, { headers, data: deviceObj });
        if ((response.status === 201 || response.status === 200) && response.data.status === 'success') {
            return response.data.data;
        } else {
            logger.error('CreateAsset request failed');
            return response.data;
        }
    } catch (error) {
        logger.error('Error creating asset data:', error);
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { status: 'fail', code: 500, data: null, message: error.message };
    }
}

async function getAsset(asset_id, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET}?asset_id=${encodeURIComponent(asset_id)}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200 && response.data.status === 'success') {
            return response.data.data[0];
        }
    } catch (error) {
        // 404 is expected when asset doesn't exist
        if (error.response && error.response.status === 404) {
            logger.debug(`Asset with ID '${asset_id}' not found (404)`);
            return null;
        }
        // Log other errors as actual errors
        logger.error('Error get asset:', error);
        return null;
    }
}

async function createAudit(auditObj, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.AUDIT_EVENT}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('POST', endPoint, { headers, data: auditObj });
        if (response.status === 200 && response.data.status === 'success') {
            logger.debug('CreateAudit request sent successfully.');
        } else {
            logger.error('CreateAudit request failed');
        }
    } catch (error) {
        logger.error('Error creating audit:', error);
    }
}

async function updateAsset(id, updatedDevice, clientName) {
    console.log("updateAssetCounter:", ++updateAssetCounter);
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET}/${id}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('PATCH', endPoint, { headers, data: updatedDevice });
        if (response.status === 200 && response.data.status === 'success') {
            return response.data.data[0];
        }
    } catch (error) {
        logger.error('Error updating asset:', error);
    }
}
async function getAllSites(clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.SITE}`;
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data.data;
        }
    } catch (error) {
        logger.error('Error fetching getAllSites data:', error);
    }
}

async function getAllAvailableSites(clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.SITE}?status=ACTIVE`;
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data.data;
        }
    } catch (error) {
        logger.error('Error fetching getAllAvailableSites data:', error);
    }
}

async function getSiteById(clientName, id) {
    const endPoint = `${config.API_ROOT}${ApiConstant.SITE}/${id}`;
    const headers = {
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200) {
            return response.data.data;
        }
    } catch (error) {
        logger.error('Error fetching getSiteById data:', error);
    }
}

async function getAssetByName(name, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.ASSET}?name=${encodeURIComponent(name)}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('GET', endPoint, { headers });
        if (response.status === 200 && response.data.status === 'success') {
            return response.data.data; // Returns array of assets with matching name
        }
        return [];
    } catch (error) {
        logger.error('Error getting asset by name:', error);
        return [];
    }
}

async function createAssetTypeMapping(mappingData, clientName) {
    const endPoint = `${config.API_ROOT}${ApiConstant.PM_ASSET_MAPPING}`;
    const headers = {
        'Content-Type': 'application/json',
        [PharmaConstant.X_CLIENT_ID]: clientName,
        [PharmaConstant.X_REQUESTED_BY]: PharmaConstant.DISCOVERY
    };
    try {
        const response = await logApiCall('POST', endPoint, { headers, data: mappingData });
        if (response.status === 200 || response.status === 201) {
            logger.debug('createAssetTypeMapping request sent successfully.');
            return response.data;
        } else {
            logger.error('createAssetTypeMapping request failed');
            throw new Error(`Failed to create asset-type mapping: ${response.status}`);
        }
    } catch (error) {
        logger.error('Error creating asset-type mapping:', error);
        throw error; // Re-throw to fail onboarding
    }
}

module.exports = {
    getAllData,
    getAssetTypeObject,
    getModelObject,
    getDefaultSite,
    createAsset,
    createAudit,
    updateAsset,
    getAllSites,
    getAllAvailableSites,
    getSiteById,
    getAsset,
    createAssetModel,
    getAssetByName,
    createAssetTypeMapping
    // updateBatteryInfo
};

