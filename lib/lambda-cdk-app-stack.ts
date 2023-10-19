import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { OrderFunction } from './constructs/order-function';
import { CartFunction } from './constructs/cart-function';
import { ProductFunction } from './constructs/product-function';
import { WarehouseFunction } from './constructs/warehouse-function';
import { EventBus } from 'aws-cdk-lib/aws-events';

export class LambdaCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, restApi: RestApi, eventbus:EventBus ,props?: StackProps) {
    super(scope, id, props);

    const Order = new OrderFunction(this, 'OrderFunction', restApi,eventbus);
    const Cart = new CartFunction(this, 'CartFunction', restApi,eventbus);
    const Product = new ProductFunction(this, 'ProdutFunction', restApi,eventbus);
    const Warehouse = new WarehouseFunction(this, 'WarehouseFunction', restApi,eventbus);
  }
}
