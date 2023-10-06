import { CfnOutput, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { LambdaCdkAppStack } from './lambda-cdk-app-stack';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ApiGatewayStack } from './api-gateway-stack';

export class LambdaCdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const repository = new Repository(this, 'LambdaCdkRepository', {
      repositoryName: 'LambdaCdkRepository',
      description: 'Code Repository for LambdaCdk',
    });

    const appStage = new LambdaCdkAppStage(this, 'LambdaAppStage');

    const pipeline = new CodePipeline(this, 'OrderServicePipeline', {
      pipelineName: 'OrderServicePipeline',
      selfMutation: false,
      publishAssetsInParallel: false,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.codeCommit(repository, 'main'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      }),
      codeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:*'],
            resources: ['*'],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['cloudfront:*'],
            resources: ['*'],
          }),
        ],
      },
    });

    pipeline.addStage(appStage);

    new CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
      description: "Code Repository Clone Url Http",
    });
  }
}

class LambdaCdkAppStage extends Stage {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const ApiStack = new ApiGatewayStack(this, 'ApiGatewayStack', {});
    const LambdaStack = new LambdaCdkAppStack(this, 'LambdaCdkStack', ApiStack.restApi, {
    });
  }
}