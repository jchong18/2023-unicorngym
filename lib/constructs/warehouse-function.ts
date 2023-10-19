import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';


export class WarehouseFunction extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, restApi: RestApi) {
    super(scope, id);

    const warehouseTablePrimaryKey = 'WarehouseId';

    const warehouseTable = new Table(this, 'WarehouseTable', {
      partitionKey: { name: warehouseTablePrimaryKey, type: AttributeType.STRING },
      tableName: 'WarehouseTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRIMARY_KEY: warehouseTablePrimaryKey,
        TABLE_NAME: warehouseTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const createWarehouseLambda = new NodejsFunction(this, 'CreateWarehouseFunction', {
      entry: join(__dirname, '../../lambda/warehouse_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const getWarehouseLambda = new NodejsFunction(this, 'GetWarehouseFunction', {
      entry: join(__dirname, '../../lambda/warehouse_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const editWarehouseLambda = new NodejsFunction(this, 'EditWarehouseFunction', {
      entry: join(__dirname, '../../lambda/warehouse_functions', 'edit.ts'),
      ...nodeJsFunctionProps,
    });

    warehouseTable.grantReadWriteData(createWarehouseLambda);
    warehouseTable.grantReadWriteData(getWarehouseLambda);
    warehouseTable.grantReadWriteData(editWarehouseLambda);

    const createWarehouseIntegration = new LambdaIntegration(createWarehouseLambda);
    const getWarehouseIntegration = new LambdaIntegration(getWarehouseLambda);
    const editWarehouseIntegration = new LambdaIntegration(editWarehouseLambda);

    const warehouse = restApi.root.addResource('warehouse');
    warehouse.addMethod('POST', createWarehouseIntegration);

    const warehouseById = warehouse.addResource('{productId}');
    warehouseById.addMethod('GET', getWarehouseIntegration, {
      requestParameters: {
        'method.request.path.productId': true,
      },
    });
    warehouseById.addMethod('PUT', editWarehouseIntegration, {
      requestParameters: {
        'method.request.path.productId': true,
      },
    });

    warehouse.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
    warehouseById.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
