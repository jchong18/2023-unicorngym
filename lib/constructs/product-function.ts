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
      entry: join(__dirname, '../../src/product_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const listProductLambda = new NodejsFunction(this, 'ListProductFunction', {
      entry: join(__dirname, '../../src/product_functions', 'list.ts'),
      ...nodeJsFunctionProps,
    });
    const editProductLambda = new NodejsFunction(this, 'EditProductFunction', {
      entry: join(__dirname, '../../src/product_functions', 'edit.ts'),
      ...nodeJsFunctionProps,
    });
    const getProductLambda = new NodejsFunction(this, 'GetProductFunction', {
      entry: join(__dirname, '../../src/product_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const initProductLambda = new NodejsFunction(this, 'InitProductFunction', {
      entry: join(__dirname, '../../src/product_functions', 'init.ts'),
      ...nodeJsFunctionProps,
    });

    productTable.grantReadWriteData(createProductLambda);
    productTable.grantReadWriteData(listProductLambda);
    productTable.grantReadWriteData(editProductLambda);
    productTable.grantReadWriteData(getProductLambda);
    productTable.grantFullAccess(initProductLambda);
    const createProductIntegration = new LambdaIntegration(createProductLambda);
    const listProductIntegration = new LambdaIntegration(listProductLambda);
    const editProductIntegration = new LambdaIntegration(editProductLambda);
    const getProductIntegration = new LambdaIntegration(getProductLambda);
    const initProductIntegration = new LambdaIntegration(initProductLambda);


    const productinit = restApi.root.addResource('productinit');
    productinit.addMethod('GET', initProductIntegration);


    const product = restApi.root.addResource('product');
    product.addMethod('GET', listProductIntegration);
    product.addMethod('POST', createProductIntegration);

    const productById = product.addResource('{productId}');
    productById.addMethod('GET', getProductIntegration, {
      requestParameters: {
        'method.request.path.productId': true,
      },
    });
    productById.addMethod('PUT', editProductIntegration, {
      requestParameters: {
        'method.request.path.productId': true,
      },
    });

    productinit.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
    product.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
    productById.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
