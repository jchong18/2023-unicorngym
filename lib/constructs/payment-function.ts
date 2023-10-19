import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventBus ,Rule } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';


export class PaymentFunction extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, restApi: RestApi, eventBus: EventBus) {
    super(scope, id);

    const PaymentQueue = new sqs.Queue(this, 'PaymentQueue');
    const rule = new Rule(this, 'rule', {
      eventPattern: {
        detail: {
          'status': ['warehouse_completed'],
        }
      },
      eventBus
    });
    rule.addTarget(new targets.SqsQueue(PaymentQueue));

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const getPaymentLambda = new NodejsFunction(this, 'GetPaymentFunction', {
      entry: join(__dirname, '../../lambda/payment_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });

    const processPaymentLambda = new NodejsFunction(this, 'ProcessPaymentFunction', {
      entry: join(__dirname, '../../lambda/payment_functions', 'process.ts'),
      ...nodeJsFunctionProps,
    });

    processPaymentLambda.addEventSource(new lambdaEventSources.SqsEventSource(PaymentQueue));

    const getPaymentIntegration = new LambdaIntegration(getPaymentLambda);

    const payment = restApi.root.addResource('payment');
    payment.addMethod('GET', getPaymentIntegration);

    payment.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
