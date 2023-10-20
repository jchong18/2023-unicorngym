import * as AWS from 'aws-sdk';
import { SQSEvent } from 'aws-lambda';

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
const eventBridge = new AWS.EventBridge({});

enum OrderStatus {
  Order_started,
  Order_succeed,
  Order_failed
}

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const ddb = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;


export const handler = async (event: SQSEvent): Promise<any> => {
  console.log(JSON.parse(event.Records[0].body).detail.status);
  const status = JSON.parse(event.Records[0].body).detail.status;
  const orderId = JSON.parse(event.Records[0].body).detail.orderId;
  const eventBody = JSON.parse(event.Records[0].body);

  var order_Status:OrderStatus = OrderStatus.Order_started;
  if (status !== 'payment_completed') 
    order_Status =  OrderStatus.Order_succeed;
  else if (status !== 'payment_failed')
    order_Status =  OrderStatus.Order_failed;
  else if (status !== 'warehouse_fail')
    order_Status =  OrderStatus.Order_failed;
    
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: orderId,
    },
    UpdateExpression: "set #MyVariable1 = :x",
    ExpressionAttributeNames: {
        '#MyVariable1': 'orderStatus'
    },
    ExpressionAttributeValues: {
      ':x': order_Status
    },
  };
  
  try {
    
    await ddb.update(params).promise();
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
      body: 'success',
    };
  } catch (dbError) {
    const errorResponse = (dbError as AWS.AWSError)?.code === 'ValidationException' && (dbError as AWS.AWSError)?.message.includes('reserved keyword') ?
      DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: `${eventBody}----------------------${errorResponse}`};
  }
};