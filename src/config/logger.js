'use strict';

const path = require('path');
const { env = 'development', name = 'asset-manager' } = require('.');

const directory = process.env.LOG_DIRECTORY || path.join(__dirname, '../../');
const filename = process.env.LOG_FILENAME || `${name}.${env}.json.log`;

const config = {
  name,
  streams: []
};

const map = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60
};

// Add streams as depending on the environment
if (env === 'production') {
  config.streams.push({
    type: 'rotating-file',
    path: path.join(directory, filename),
    period: '1d',
    count: 7,
    level: map[process.env.LOG_LEVEL] || 30
  });
  config.streams.push({
    type: 'stream',
    stream: process.stderr,
    level: 40
  });
} else if (env === 'development') {
  config.streams.push({
    type: 'stream',
    stream: process.stdout,
    level: map[process.env.LOG_LEVEL] || 30
  });
}
module.exports = config;
