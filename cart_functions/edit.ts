import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const ddb = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  if (!event.body) {
    return { statusCode: 400, body: 'Invalid request, the parameter body is required' };
  }
  const cartId = event['pathParameters']['cartId'];
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
