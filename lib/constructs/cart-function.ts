import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { EventBus } from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';


export class CartFunction extends Construct {
  constructor(scope: Construct, id: string, restApi: RestApi, eventbus:EventBus) {
    super(scope, id);
    const cartTablePrimaryKey = 'CartId';
    const CartQueue = new sqs.Queue(this, 'OrderQueue');

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
      entry: join(__dirname, '../../lambda/cart_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const getCartLambda = new NodejsFunction(this, 'GetCartFunction', {
      entry: join(__dirname, '../../lambda/cart_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const editCartLambda = new NodejsFunction(this, 'EditCartFunction', {
      entry: join(__dirname, '../../lambda/cart_functions', 'edit.ts'),
      ...nodeJsFunctionProps,
    });

    cartTable.grantReadWriteData(createCartLambda);
    cartTable.grantReadWriteData(getCartLambda);
    cartTable.grantReadWriteData(editCartLambda);

    const createCartIntegration = new LambdaIntegration(createCartLambda);
    const getCartIntegration = new LambdaIntegration(getCartLambda);
    const editCartIntegration = new LambdaIntegration(editCartLambda);

    const cart = restApi.root.addResource('cart');
    cart.addMethod('POST', createCartIntegration);
    
    const cartById = cart.addResource('{cartId}');
    cartById.addMethod('GET', getCartIntegration, {
      requestParameters: {
        'method.request.path.cartId': true,
      },
    });
    cartById.addMethod('PUT', editCartIntegration, {
      requestParameters: {
        'method.request.path.cartId': true,
      },
    });

    cart.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
    cartById.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
