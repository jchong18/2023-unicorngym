import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import {EventBus} from 'aws-cdk-lib/aws-events';

export class EventStack extends Stack {
  eventbus:EventBus;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.eventbus = new EventBus(this, 'bus', {
      eventBusName: 'AnyhouseEventBus'
    });
  }
}