import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';


export class OrderFunction extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, restApi: RestApi) {
    super(scope, id);

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
      entry: join(__dirname, '../../order_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const listOrderLambda = new NodejsFunction(this, 'ListOrderFunction', {
      entry: join(__dirname, '../../order_functions', 'list.ts'),
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

    const order = restApi.root.addResource('order');
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
  }
}
