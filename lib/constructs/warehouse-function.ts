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
      entry: join(__dirname, '../../warehouse_functions', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const getWarehouseLambda = new NodejsFunction(this, 'GetWarehouseFunction', {
      entry: join(__dirname, '../../warehouse_functions', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const editWarehouseLambda = new NodejsFunction(this, 'EditWarehouseFunction', {
      entry: join(__dirname, '../../warehouse_functions', 'edit.ts'),
      ...nodeJsFunctionProps,
    });

    warehouseTable.grantReadWriteData(createWarehouseLambda);
    warehouseTable.grantReadWriteData(getWarehouseLambda);
    warehouseTable.grantReadWriteData(editWarehouseLambda);

    const createWarehouseIntegration = new LambdaIntegration(createWarehouseLambda);
    const listWarehouseIntegration = new LambdaIntegration(getWarehouseLambda);
    const editWarehouseIntegration = new LambdaIntegration(editWarehouseLambda);

    const warehouse = restApi.root.addResource('warehouse');
    warehouse.addMethod('GET', listWarehouseIntegration);
    warehouse.addMethod('POST', createWarehouseIntegration);
    warehouse.addMethod('PUT', editWarehouseIntegration);

    warehouse.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
    });
  }
}
