import * as AWS from 'aws-sdk';
import { SQSEvent } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
const eventBridge = new AWS.EventBridge({});

export const handler = async (event: SQSEvent): Promise<any> => {
  console.log(event.Records);

  const cartId = JSON.parse(event.Records[0]).
  const eventBody = JSON.parse(event['body']);
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: cartId,
    },
    UpdateExpression: "set #MyVariable1 = :x, #MyVariable2 = :y",
    ExpressionAttributeNames: {
        '#MyVariable1': 'CartItems',
        '#MyVariable2': 'IsCheckedOut',
    },
    ExpressionAttributeValues: {
      ':x': eventBody.cartItems,
      ':y': eventBody.isCheckedOut,
    },
  };


  try {
    const result = eventBridge.putEvents({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: 'ProcessPaymentLambda',
          DetailType: 'test-type',
          Detail: JSON.stringify({
            status: 'warehouse_completed'
          }),
        }
      ],
    }).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE,PUT,GET"
      },
      body: result,
    };
    eventBridge.putEvents({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: 'ProcessPaymentLambda',
          DetailType: 'test-type',
          Detail: JSON.stringify({
            status: 'payment_failed'
          }),
        }
      ],
    }).promise();
    return { statusCode: 500, body: 'Payment ERROR!' };
  } catch (ebError) {
    return { statusCode: 500, body: JSON.stringify(ebError) };
  }
};
