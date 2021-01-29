#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const { ServerlessDemoStack } = require('./stack');

const app = new cdk.App();
new ServerlessDemoStack(app, 'ServerlessDemoStack');
