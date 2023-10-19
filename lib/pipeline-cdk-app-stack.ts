import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { LambdaCdkAppStack } from '../lib/lambda-cdk-app-stack';
import { AssetsStack } from '../lib/assets-stack';
import { EventStack } from './event-stack';

import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as iam from "aws-cdk-lib/aws-iam";


export class PipelineCDKAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    let repository = new codecommit.Repository(this, "Repository", {
      repositoryName: `Repository-${this.stackName}`,
      description: "Code Repository for Anyhouse",
    });

    let appStage = new AppStage(this, "AppStage", { stackName: this.stackName });

    let pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: `Pipeline-${this.stackName}`,
      publishAssetsInParallel: false,
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.codeCommit(repository, "main"),
        commands: [
            "npm install", 
            "npm run build", 
            "npx cdk synth"
          ],
        
      }),
      // Turn this on because the pipeline uses Docker image assets
      dockerEnabledForSelfMutation: true,
      codeBuildDefaults: {
        buildEnvironment:{
          privileged:true
        },
        rolePolicy: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:*"],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["cloudfront:*"],
            resources: ["*"],
          }),
        ],
      },
    });

    pipeline.addStage(appStage 
      // {
      // post: [
      //   new pipelines.ShellStep("DeployFrontEnd", {
      //     envFromCfnOutputs: {
      //       SNOWPACK_PUBLIC_CLOUDFRONT_URL: appStage.cfnOutCloudFrontUrl,
      //       SNOWPACK_PUBLIC_API_IMAGES_URL: appStage.cfnOutCloudFrontUrl
      //     }
      //     ,
      //     commands: [
      //       "cd frontend",
      //       "npm ci",
      //       "npm run build",
      //       "aws s3 cp ./src/build s3://$BUCKET_NAME/frontend --recursive",
      //       `aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"`,
      //     ],
      //   }),
      // ],
      //}
    );

    new cdk.CfnOutput(this, "RepositoryCloneUrlHttp", {
      value: repository.repositoryCloneUrlHttp,
      description: "Code Repository Clone Url Http",
    });
  }
}

interface AppStageProps extends cdk.StageProps {
  stackName: string;
}
class AppStage extends cdk.Stage {
  public readonly cfnOutApiUrl: cdk.CfnOutput;
  public readonly cfnOutCloudFrontUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props);
    
    const ApiStack = new ApiGatewayStack(this, 'ApiGatewayStack', {});
    const S3Stack = new AssetsStack(this, 'AssetsS3Stack', {});
    const EventBridgeStack = new EventStack(this, 'AssetsS3Stack', {});
    const LambdaStack = new LambdaCdkAppStack(this, 'LambdaCdkStack', ApiStack.restApi, EventBridgeStack.eventbus, {
    });

    this.cfnOutApiUrl = ApiStack.apigatewayUrl;
    this.cfnOutCloudFrontUrl = S3Stack.frontendUri;

  }
}
