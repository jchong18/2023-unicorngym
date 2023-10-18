import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const ddb = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  const params = {
    RequestItems: {
      TABLE_NAME: [
         {
           PutRequest: {
             Item: {
               "ProductId": { "S": uuidv4() },
                 "Name": { "S": "Wide Sofa & Chaise" },
                 "ImageName": { "S": "sofa_1" },
                 "Price": { "N": "899.99" },
                 "ReviewCount": { "N": "237" },
                 "Rating": { "N": "4.3" },
             }
           }
         },
         {
          PutRequest: {
            Item: {
              "ProductId": { "S": uuidv4() },
                "Name": { "S": "Wide Reversible Sleeper Sofa" },
                "ImageName": { "S": "sofa_3" },
                "Price": { "N": "1399.99" },
                "ReviewCount": { "N": "807" },
                "Rating": { "N": "4.2" },
            }
          }
        }
      ]
    }
  };
 
  try {
    
    await ddb.batchWrite(params).promise();
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
