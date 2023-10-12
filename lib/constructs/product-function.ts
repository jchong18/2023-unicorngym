import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';


export class ProductFunction extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, restApi: RestApi) {
    super(scope, id);

    const productTablePrimaryKey = 'ProductId';

    const productTable = new Table(this, 'ProductTable', {
      partitionKey: { name: productTablePrimaryKey, type: AttributeType.STRING },
      tableName: 'ProductTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRIMARY_KEY: productTablePrimaryKey,
        TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const createProductLambda = new NodejsFunction(this, 'CreateProductFunction', {
      entry: join(__dirname, '../../product_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const getProductLambda = new NodejsFunction(this, 'GetProductFunction', {
      entry: join(__dirname, '../../product_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const editProductLambda = new NodejsFunction(this, 'EditProductFunction', {
      entry: join(__dirname, '../../product_functions', 'edit.ts'),
      ...nodeJsFunctionProps,
    });

    productTable.grantReadWriteData(createProductLambda);
    productTable.grantReadWriteData(getProductLambda);
    productTable.grantReadWriteData(editProductLambda);

    const createProductIntegration = new LambdaIntegration(createProductLambda);
    const listProductIntegration = new LambdaIntegration(getProductLambda);
    const editProductIntegration = new LambdaIntegration(editProductLambda);

    const product = restApi.root.addResource('product');
    product.addMethod('GET', listProductIntegration);
    product.addMethod('POST', createProductIntegration);
    product.addMethod('PUT', editProductIntegration);

    product.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
