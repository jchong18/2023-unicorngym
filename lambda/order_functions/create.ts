import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';

const ddb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge({});

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  if (!event.body) {
    return { statusCode: 400, body: 'Invalid request, the parameter body is required' };
  }
  const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

  item[PRIMARY_KEY] = uuidv4();
  item['status'] = 'OrderStarted';
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };

  try {
    await ddb.put(params).promise();
    const result = eventBridge.putEvents({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: 'CreateOrderLambda',
          DetailType: 'test-type',
          Detail: JSON.stringify({
            status: 'order_started',
            items: item.items,
          }),
        }
      ],
    }).promise();
    // console.log('Error happened here!');
    // console.log('Debug this, and clear these logs!');
    return {
      statusCode: 201,
      // statusCode: 500,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE,PUT,GET"
      },
      body: 'success'
    };
  } catch (dbError) {
    const errorResponse = (dbError as AWS.AWSError)?.code === 'ValidationException' && (dbError as AWS.AWSError)?.message.includes('reserved keyword') ?
      DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: errorResponse };
  }
};
