import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class ApiGatewayStack extends Stack {
  restApi: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.restApi = new RestApi(this, 'Api', {
      restApiName: 'AnyHouse Service',
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
      }
    })
  }
}
