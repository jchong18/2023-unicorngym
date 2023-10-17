import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { AllowedMethods, CfnDistribution, CfnOriginAccessControl, Distribution, HttpVersion, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class AssetsStack extends Stack {
  AssetsBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.AssetsBucket = new Bucket(this, 'AssetsBucket', {
      bucketName: 'assets-bucket-unicorngym-2023',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new BucketDeployment(this, 'AssetsBucketDeployment', {
      sources: [Source.asset('./assets')],
      destinationBucket: this.AssetsBucket,
    });

    // new BucketDeployment(this, 'ImagesBucketDeployment', {
    //   sources: [Source.asset('./images')],
    //   destinationBucket: this.AssetsBucket,
    //   destinationKeyPrefix: 'images',
    // });

    const cfnOriginAccessControl = new CfnOriginAccessControl(this, 'CloudFrontOAC', {
      originAccessControlConfig: {
        name: 'unicorn-gym-cloudfront-oai',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'OAI for unicorn-gym',
      }
    });

    const cfnDistribution = new Distribution(this, 'CloudFrontDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(this.AssetsBucket),
        allowedMethods: AllowedMethods.ALLOW_ALL,
      },
      httpVersion: HttpVersion.HTTP2_AND_3,
      });


    const distribution = cfnDistribution.node.defaultChild as CfnDistribution;
    distribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');
    distribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', cfnOriginAccessControl.attrId);

    // S3 - BucketPolicy
    const contentsBucketPolicyStatement = new PolicyStatement({
      actions: ['s3:GetObject'],
      effect: Effect.ALLOW,
      principals: [
        new ServicePrincipal('cloudfront.amazonaws.com'),
      ],
      resources: [`${this.AssetsBucket.bucketArn}/*`],
    });
    contentsBucketPolicyStatement.addCondition('StringEquals', {
      'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${cfnDistribution.distributionId}`
    })
    this.AssetsBucket.addToResourcePolicy(contentsBucketPolicyStatement);

  }
}
