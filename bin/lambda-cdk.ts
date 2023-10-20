#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { LambdaCdkAppStack } from '../lib/lambda-cdk-app-stack';
import { AssetsStack } from '../lib/assets-stack';
import { PipelineCDKAppStack } from '../lib/pipeline-cdk-app-stack';
import { EventStack } from '../lib/event-stack';

const app = new cdk.App();


const EventBridgeStack = new EventStack(app, 'EventBridgeStack', {});
const ApiStack = new ApiGatewayStack(app, 'ApiGatewayStack', {});
const S3Stack = new AssetsStack(app, 'AssetsS3Stack', {});
const LambdaStack = new LambdaCdkAppStack(app, 'LambdaCdkStack', ApiStack.restApi, EventBridgeStack.eventbus, {
});