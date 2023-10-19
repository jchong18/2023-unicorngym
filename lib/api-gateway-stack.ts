import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cors, MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import * as cdk from "aws-cdk-lib";
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ApiGatewayStack extends Stack {
  restApi: RestApi;
  apigatewayUrl: cdk.CfnOutput;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.restApi = new RestApi(this, 'Api', {
      restApiName: 'AnyHouse Service',
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
      // defaultCorsPreflightOptions: {
      //   allowOrigins: Cors.ALL_ORIGINS
      // }
    });

    this.apigatewayUrl = new cdk.CfnOutput(this, "API Gateway URI", {
      value: this.restApi.url,
      description: 'Rest API endpoint',
    });
  }
}
