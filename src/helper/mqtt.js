const mqtt = require('mqtt');
const config = require('../config');
const logger = require('./logger');
const { initializeHeartbeatListener } = require('../controller/mqtt.controller');

class MqttHandler {
  constructor() {
    this.status = null;
    this.mqttClient = null;
    this.host = config.MQTT.URL;
    this.username = config.MQTT.USERNAME;
    this.password = config.MQTT.PASSWORD;
    this.clientId = config.MQTT.CLIENT_ID;
    this.clean = config.MQTT.CLEAN;
    this.maxInflight = 1000;
    this.max_inflight = 1000;

    this.properties = {
      maximumPacketSize: 100000,
      max_inflight: 1000,
      maxInflight: 1000
    };

    this.tls_enable = config.MQTT.TLS.enable;
    this.tls_key = config.MQTT.TLS.key;
    this.tls_cert = config.MQTT.TLS.cert;
    this.tls_ca = config.MQTT.TLS.ca;
    this.tls_host = config.MQTT.TLS.host;
    this.tls_port = config.MQTT.TLS.port;

    this.reconnectInterval = 60000; // 1 minute
    this.heartbeatTimeout = 60000; // No message in 1 minute triggers reconnection
    this.lastMessageTimestamp = null;

    this.connect();
    this.startReconnectionCheck();
  }

  connect() {
    // Connect to MQTT broker with or without TLS
    if (this.tls_enable === true) {
      this.mqttClient = mqtt.connect(this.tls_host, {
        username: this.username,
        password: this.password,
        port: this.tls_port,
        clientId: this.clientId,
        clean: this.clean,
        rejectUnauthorized: true,
        protocol: 'mqtts'
      });
    } else {
      this.mqttClient = mqtt.connect(this.host, {
        username: this.username,
        password: this.password,
        clientId: this.clientId,
        clean: this.clean
      });
    }

    // MQTT event listeners
    this.mqttClient.on('error', err => {
      logger.error(err);
      this.mqttClient.end();
    });

    this.mqttClient.on('connect', data => {
      this.status = 'connected';
      this.lastMessageTimestamp = Date.now(); // Reset message timer
      logger.info('mqtt client connected');
    });

    this.mqttClient.on('message', (topic, message) => {
      this.lastMessageTimestamp = Date.now(); // Update when a message is received
      // logger.info(`Received message on topic ${topic}`);
    });

    this.mqttClient.on('close', () => {
      this.status = 'closed';
      logger.info('mqtt client closed');
    });

    this.mqttClient.on('disconnect', () => {
      this.status = 'disconnected';
      logger.info('mqtt client disconnected');
    });

    this.mqttClient.on('offline', () => {
      this.status = 'offline';
      logger.info('mqtt client offline');
    });

    this.mqttClient.on('end', () => {
      this.status = 'end';
      logger.info('mqtt client end');
    });
  }

  // Reconnection logic
  startReconnectionCheck() {
    setInterval(() => {
      const now = Date.now();
      if (this.status !== 'connected' || (this.lastMessageTimestamp && now - this.lastMessageTimestamp > this.heartbeatTimeout)) {
        logger.info('No messages received for a while. Attempting to reconnect...');
        this.reconnect();
      }
    }, this.reconnectInterval);
  }

 async reconnect() {
    if (this.mqttClient) {
      this.mqttClient.end(); // Ensure previous connection is closed before reconnecting
    }
    await this.connect(); // Reconnect to the broker
    initializeHeartbeatListener(this.mqttClient);
  }

  sendMessage(topic, message) {
    logger.debug(`topic - ${topic}\n`);
    logger.debug(`message - ${message}\n`);
    logger.debug('mqtt-connection-status :: ', this.status);
    if (this.status === 'connected') {
      this.mqttClient.publish(topic, message, { qos: 1 });
      logger.debug('message published...');
      return 'success';
    } else {
      logger.debug('unable to publish message...');
      return 'error';
    }
  }

  mqttHealthCheck() {
    let status = {};
    status.mqttStatus = this.status;
    return status;
  }
}

module.exports = MqttHandler;
