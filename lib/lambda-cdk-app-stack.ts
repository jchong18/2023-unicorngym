import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { OrderFunction } from './constructs/order-function';

export class LambdaCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, restApi: RestApi, props?: StackProps) {
    super(scope, id, props);

    const Order = new OrderFunction(this, 'OrderFunction', restApi);
  }
}
