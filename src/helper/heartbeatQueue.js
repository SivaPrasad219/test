const logger = require('./logger');

class HeartbeatQueueManager {
    constructor() {
        // Map of deviceKey -> { queue: [], processing: boolean }
        this.deviceQueues = new Map();
    }
    
    // Generate unique key for device using double underscore
    getDeviceKey(clientName, assetId) {
        return `${clientName}__${assetId}`;
    }
    
    // Add message to device-specific queue
    enqueue(clientName, assetId, message, handler) {
        const deviceKey = this.getDeviceKey(clientName, assetId);
        
        if (!this.deviceQueues.has(deviceKey)) {
            this.deviceQueues.set(deviceKey, {
                queue: [],
                processing: false,
                clientName,  // Store for logging
                assetId,     // Store for logging
                lastBasicStatus: undefined  // Track last status for basic heartbeats only
            });
        }
        
        const deviceQueue = this.deviceQueues.get(deviceKey);
        
        // Check if this is a basic heartbeat and if status has changed
        if (message.heartbeatType === 'basic') {
            const currentStatus = message.deviceHeartbeat?.status;
            
            // Skip if status hasn't changed (but allow first message through)
            if (deviceQueue.lastBasicStatus !== undefined && 
                deviceQueue.lastBasicStatus === currentStatus) {
                logger.trace(`Skipping unchanged basic heartbeat for ${clientName}/${assetId}: ${currentStatus}`);
                return; // Don't queue this message
            }
            
            // Update last known status for basic heartbeats
            deviceQueue.lastBasicStatus = currentStatus;
            logger.debug(`Basic heartbeat status change for ${clientName}/${assetId}: ${deviceQueue.lastBasicStatus || 'INITIAL'} → ${currentStatus}`);
        }
        
        // Queue the message (meta always queued, basic only if status changed)
        deviceQueue.queue.push({ message, handler, timestamp: Date.now() });
        
        logger.debug(`Enqueued ${message.heartbeatType || 'unknown'} heartbeat for ${clientName}/${assetId}, queue size: ${deviceQueue.queue.length}`);
        
        // Start processing if not already running
        if (!deviceQueue.processing) {
            this.processQueue(deviceKey);
        }
    }
    
    // Process messages sequentially for a device
    async processQueue(deviceKey) {
        const deviceQueue = this.deviceQueues.get(deviceKey);
        if (!deviceQueue || deviceQueue.processing) return;
        
        deviceQueue.processing = true;
        const { clientName, assetId } = deviceQueue;
        
        while (deviceQueue.queue.length > 0) {
            const { message, handler, timestamp } = deviceQueue.queue.shift();
            const waitTime = Date.now() - timestamp;
            
            logger.debug(`Processing queued message for ${clientName}/${assetId}, waited ${waitTime}ms, remaining: ${deviceQueue.queue.length}`);
            
            try {
                await handler(message);
            } catch (error) {
                logger.error(`Error processing queued message for ${clientName}/${assetId}:`, error);
            }
        }
        
        deviceQueue.processing = false;
        
        // Clean up empty queues to prevent memory leak
        if (deviceQueue.queue.length === 0) {
            this.deviceQueues.delete(deviceKey);
            logger.debug(`Cleaned up empty queue for ${clientName}/${assetId}`);
        }
    }
    
    // Get queue stats for monitoring
    // getQueueStats() {
    //     const stats = {
    //         totalQueues: this.deviceQueues.size,
    //         queues: []
    //     };
        
    //     for (const [key, queue] of this.deviceQueues.entries()) {
    //         stats.queues.push({
    //             clientName: queue.clientName,
    //             assetId: queue.assetId,
    //             queueLength: queue.queue.length,
    //             processing: queue.processing
    //         });
    //     }
        
    //     return stats;
    // }
    
    // Clear queue for specific device (useful for cleanup)
    // clearDeviceQueue(clientName, assetId) {
    //     const deviceKey = this.getDeviceKey(clientName, assetId);
    //     if (this.deviceQueues.has(deviceKey)) {
    //         this.deviceQueues.delete(deviceKey);
    //         logger.info(`Cleared queue for ${clientName}/${assetId}`);
    //     }
    // }
}

module.exports = HeartbeatQueueManager;