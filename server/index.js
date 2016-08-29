'use strict';

const fs = require('fs');
const babelRc = JSON.parse(fs.readFileSync('./.babelrc').toString());

require('babel-register')(babelRc);

global.Promise = require('bluebird');

require('./app.js');
