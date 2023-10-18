#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { LambdaCdkAppStack } from '../lib/lambda-cdk-app-stack';
import { AssetsStack } from '../lib/assets-stack';
import { PipelineCDKAppStack } from '../lib/pipeline-cdk-app-stack';

const app = new cdk.App();

new PipelineCDKAppStack(app, 'PipelineCDKAppStack');