import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, HttpIntegration, LambdaIntegration, MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export class LambdaCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const orderTablePrimaryKey = 'OrderId';

    const orderTable = new Table(this, 'OrderTable', {
      partitionKey: { name: orderTablePrimaryKey, type: AttributeType.STRING },
      tableName: 'OrderTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRIMARY_KEY: orderTablePrimaryKey,
        TABLE_NAME: orderTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const createOrderLambda = new NodejsFunction(this, 'CreateOrderFunction', {
      entry: join(__dirname, '../order_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const listOrderLambda = new NodejsFunction(this, 'ListOrderFunction', {
      entry: join(__dirname, '../order_functions', 'list.ts'),
      ...nodeJsFunctionProps,
    });
    // const deleteOrderLambda = new NodejsFunction(this, 'DeleteOrderFunction', {
    //   entry: join(__dirname, '../order_functions', 'delete.ts'),
    //   ...nodeJsFunctionProps,
    // });

    orderTable.grantReadWriteData(createOrderLambda);
    orderTable.grantReadWriteData(listOrderLambda);
    // orderTable.grantReadWriteData(deleteOrderLambda);

    const createOrderIntegration = new LambdaIntegration(createOrderLambda);
    const listOrderIntegration = new LambdaIntegration(listOrderLambda);
    // const deleteOrderIntegration = new LambdaIntegration(deleteOrderLambda);

    const api = new RestApi(this, 'OrderApi', {
      restApiName: 'AnyHouse Service',
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
      }
    })

    const order = api.root.addResource('order');
    order.addMethod('GET', listOrderIntegration);
    order.addMethod('POST', createOrderIntegration);

    // const orderById = order.addResource('{orderId}');
    // orderById.addMethod('DELETE', deleteOrderIntegration, {
    //   requestParameters: {
    //     'method.request.path.orderId': true,
    //   },
    // });

    order.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });

    // orderById.addCorsPreflight({
    //   allowOrigins: Cors.ALL_ORIGINS,
    //   allowHeaders: Cors.DEFAULT_HEADERS,
    //   allowMethods: Cors.ALL_METHODS,
    // });

    const createCartIntegration = new HttpIntegration(
      'http://cart-alb-2114109994.us-west-2.elb.amazonaws.com/api/cart',
      {
        httpMethod: 'POST',
      }
    );
    const getCartIntegration = new HttpIntegration(
      'http://cart-alb-2114109994.us-west-2.elb.amazonaws.com/api/cart/{cartId}',
      {
        httpMethod: 'GET',
        options: {
          requestParameters: {
            'integration.request.path.cartId': 'method.request.path.cartId',
          }
        }
      }
    );
    const editCartIntegration = new HttpIntegration(
      'http://cart-alb-2114109994.us-west-2.elb.amazonaws.com/api/cart/{cartId}',
      {
        httpMethod: 'POST',
        options: {
          requestParameters: {
            'integration.request.path.cartId': 'method.request.path.cartId',
          }
        }
      }
    );

    const deleteCartIntegration = new HttpIntegration(
      'http://cart-alb-2114109994.us-west-2.elb.amazonaws.com/api/cart/{cartId}',
      {
        httpMethod: 'DELETE',
        options: {
          requestParameters: {
            'integration.request.path.cartId': 'method.request.path.cartId',
          }
        }
      }
    );

    const cart = api.root.addResource('cart');
    cart.addMethod('POST', createCartIntegration);
    cart.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
    const cartWithCartId = cart.addResource('{cartId}');
    cartWithCartId.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
    cartWithCartId.addMethod('GET', getCartIntegration, { requestParameters: { 'method.request.path.cartId': true } });
    cartWithCartId.addMethod('POST', editCartIntegration, { requestParameters: { 'method.request.path.cartId': true } });
    cartWithCartId.addMethod('DELETE', deleteCartIntegration, { requestParameters: { 'method.request.path.cartId': true } });
  }
}
