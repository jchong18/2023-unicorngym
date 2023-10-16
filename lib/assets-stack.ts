import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

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

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    this.AssetsBucket.grantRead(originAccessIdentity);

    new Distribution(this, 'CloudFrontDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(this.AssetsBucket, { originAccessIdentity })
      }
    });
  }
}
