#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { LambdaCdkAppStack } from '../lib/lambda-cdk-app-stack';

const app = new cdk.App();

const ApiStack = new ApiGatewayStack(app, 'ApiGatewayStack', {});
const LambdaStack = new LambdaCdkAppStack(app, 'LambdaCdkStack', ApiStack.restApi, {
});