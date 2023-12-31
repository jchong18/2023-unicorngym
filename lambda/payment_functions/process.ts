import * as AWS from 'aws-sdk';
import { SQSEvent } from 'aws-lambda';

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
const eventBridge = new AWS.EventBridge({});

export const handler = async (event: SQSEvent): Promise<any> => {
  console.log(event.Records);

  const randNum = Math.floor(Math.random() * 100);

  try {
    if (randNum >= 5) {
      const result = eventBridge.putEvents({
        Entries: [
          {
            EventBusName: EVENT_BUS_NAME,
            Source: 'ProcessPaymentLambda',
            DetailType: 'test-type',
            Detail: JSON.stringify({
              status: 'payment_completed'
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
    } else {
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
    }
  } catch (ebError) {
    return { statusCode: 500, body: JSON.stringify(ebError) };
  }
};