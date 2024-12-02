'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      // popup: PATHS.src + '/popup/popup.js',
      contentScript: PATHS.src + '/inject/content-script.js',
      background: PATHS.src + '/bg/background.js',
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
  });

module.exports = config;
