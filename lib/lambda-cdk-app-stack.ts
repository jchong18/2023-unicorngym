import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { OrderFunction } from './constructs/order-function';
import { CartFunction } from './constructs/cart-function';
import { ProductFunction } from './constructs/product-function';
import { WarehouseFunction } from './constructs/warehouse-function';

export class LambdaCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, restApi: RestApi, props?: StackProps) {
    super(scope, id, props);

    const Order = new OrderFunction(this, 'OrderFunction', restApi);
    const Cart = new CartFunction(this, 'CartFunction', restApi);
    const Product = new ProductFunction(this, 'ProdutFunction', restApi);
    const Warehouse = new WarehouseFunction(this, 'WarehouseFunction', restApi);
  }
}
