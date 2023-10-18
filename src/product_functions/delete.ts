import * as AWS from 'aws-sdk';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const ddb = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  const orderId = event['pathParameters']['orderId'];
  console.log(event.pathParameters);
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: orderId,
    },
  };

  try {
    await ddb.delete(params).promise();
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE,PUT,GET"
      },
      body: 'success'
    };
  } catch (dbError) {
    console.log(dbError);
    const errorResponse = (dbError as AWS.AWSError)?.code === 'ValidationException' && (dbError as AWS.AWSError)?.message.includes('reserved keyword') ?
      DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: errorResponse };
  }
};
