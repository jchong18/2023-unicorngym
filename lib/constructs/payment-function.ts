import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';


export class Payment extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, restApi: RestApi) {
    super(scope, id);

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        EVENT_BUS_NAME: 'bus'
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const getPaymentLambda = new NodejsFunction(this, 'ProcessPaymentFunction', {
      entry: join(__dirname, '../../lambda/payment_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });

    const processPaymentLambda = new NodejsFunction(this, 'ProcessPaymentFunction', {
      entry: join(__dirname, '../../lambda/payment_functions', 'process.ts'),
      ...nodeJsFunctionProps,
    });

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
