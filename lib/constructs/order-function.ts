import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { EventBus ,Rule, IRuleTarget } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export class OrderFunction extends Construct {
  restApi: RestApi;


  constructor(scope: Construct, id: string, restApi: RestApi, eventBus: EventBus) {
    super(scope, id);

    const orderTablePrimaryKey = 'OrderId';
    const OrderQueue = new sqs.Queue(this, 'OrderQueue');
    const rule = new Rule(this, 'rule', {
      eventPattern: {
        detail: {
          'status': ['warehouse_failed', 'payment_completed', 'payment_failed'],
        }
      },
      eventBus
    });
    rule.addTarget(new targets.SqsQueue(OrderQueue));
    
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
      entry: join(__dirname, '../../lambda/order_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const listOrderLambda = new NodejsFunction(this, 'ListOrderFunction', {
      entry: join(__dirname, '../../lambda/order_functions', 'list.ts'),
      ...nodeJsFunctionProps,
    });
    const processOrderLambda = new NodejsFunction(this, 'processOrderFunction', {
      entry: join(__dirname, '../../lambda/order_functions', 'list.ts'),
      ...nodeJsFunctionProps,
    });
    // const deleteOrderLambda = new NodejsFunction(this, 'DeleteOrderFunction', {
    //   entry: join(__dirname, '../order_functions', 'delete.ts'),
    //   ...nodeJsFunctionProps,
    // });
    processOrderLambda.addEventSource(new lambdaEventSources.SqsEventSource(OrderQueue));

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
