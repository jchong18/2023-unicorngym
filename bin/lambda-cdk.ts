#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaCdkPipelineStack } from '../lib/lambda-cdk-pipeline-stack';

const app = new cdk.App();

new LambdaCdkPipelineStack(app, 'LambdaCdkPipelineStack', {
  env: {
    account: '012605359120',
    region: 'us-west-2',
  }
});
