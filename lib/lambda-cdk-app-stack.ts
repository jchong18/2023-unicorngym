import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cors, HttpIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { OrderFunction } from './constructs/order-function';

export class LambdaCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, restApi: RestApi, props?: StackProps) {
    super(scope, id, props);

    const Order = new OrderFunction(this, 'OrderFunction', restApi);

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

    const cart = restApi.root.addResource('cart');
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
