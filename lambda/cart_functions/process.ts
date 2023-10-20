import * as AWS from 'aws-sdk';
import { SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent): Promise<any> => {
  console.log(event.Records);

  try {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE,PUT,GET"
      },
      body: 'success',
    };
  } catch (ebError) {
    return { statusCode: 500, body: JSON.stringify(ebError) };
  }
};