import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';


export class CartFunction extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, restApi: RestApi) {
    super(scope, id);

    const cartTablePrimaryKey = 'CartId';

    const cartTable = new Table(this, 'CartTable', {
      partitionKey: { name: cartTablePrimaryKey, type: AttributeType.STRING },
      tableName: 'CartTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRIMARY_KEY: cartTablePrimaryKey,
        TABLE_NAME: cartTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const createCartLambda = new NodejsFunction(this, 'CreateCartFunction', {
      entry: join(__dirname, '../../cart_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const getCartLambda = new NodejsFunction(this, 'GetCartFunction', {
      entry: join(__dirname, '../../cart_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const editCartLambda = new NodejsFunction(this, 'EditCartFunction', {
      entry: join(__dirname, '../../cart_functions', 'edit.ts'),
      ...nodeJsFunctionProps,
    });

    cartTable.grantReadWriteData(createCartLambda);
    cartTable.grantReadWriteData(getCartLambda);
    cartTable.grantReadWriteData(editCartLambda);

    const createCartIntegration = new LambdaIntegration(createCartLambda);
    const listCartIntegration = new LambdaIntegration(getCartLambda);
    const editCartIntegration = new LambdaIntegration(editCartLambda);

    const cart = restApi.root.addResource('cart');
    cart.addMethod('GET', listCartIntegration);
    cart.addMethod('POST', createCartIntegration);
    cart.addMethod('PUT', editCartIntegration);

    cart.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
