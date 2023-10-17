import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { AllowedMethods, CfnDistribution, CfnOriginAccessControl, Distribution, HttpVersion, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
export class AssetsStack extends Stack {
  AssetsBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.AssetsBucket = new Bucket(this, 'AssetsBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new BucketDeployment(this, 'AssetsBucketDeployment', {
      sources: [Source.asset('./assets')],
      destinationBucket: this.AssetsBucket,
    });
    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');

    // cdk CloudFrontToS3 for cloudfront to s3 web hosting example
    new CloudFrontToS3(this, 'test-cloudfront-s3', {
      existingBucketObj:this.AssetsBucket,
      cloudFrontDistributionProps: {
        defaultBehavior: {
          origin: new S3Origin(this.AssetsBucket, {originAccessIdentity}),
        }
      }
    })

    



   

    // const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    // this.AssetsBucket.grantRead(originAccessIdentity);
    
    // new Distribution(this, 'Distribution', {
    //   defaultRootObject: 'index.html',
    //   defaultBehavior: {
    //     origin: new S3Origin(this.AssetsBucket, {originAccessIdentity}),
    //   },
    // })


    // new BucketDeployment(this, 'ImagesBucketDeployment', {
    //   sources: [Source.asset('./images')],
    //   destinationBucket: this.AssetsBucket,
    //   destinationKeyPrefix: 'images',
    // });

  }
}
