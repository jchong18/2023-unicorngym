import * as AWS from 'aws-sdk';

export const handler = async (event: any = {}): Promise<any> => {
  const randNum = Math.floor(Math.random() * 100);

  if (randNum >= 5) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE,PUT,GET"
      },
      body: 'Payment Success'
    };
  } else {
    return { statusCode: 500, body: 'Payment ERROR!' };
  }
};
