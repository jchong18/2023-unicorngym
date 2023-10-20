import * as AWS from 'aws-sdk';
import { SQSEvent } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
const ddb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge({});

export const handler = async (event: SQSEvent): Promise<any> => {
  console.log(event.Records);
  console.log(JSON.parse(event.Records[0].body).detail);
  const { status, items } = JSON.parse(event.Records[0].body).detail;
  console.log(status);
  console.log(items);
  try {
    if (status === 'order_started') {
      const result = await processWarehouse(items);
      return result;
    } else if (status === 'payment_failed') {
      const result = await compensateWarehouse(items);
      return result;
    }
  } catch (ebError) {
    return { statusCode: 500, body: JSON.stringify(ebError) };
  }
};

const processWarehouse = async (items: any) => {
  try {
    for (const item of items) {
      console.log(item);
      const getParams = {
        TableName: TABLE_NAME,
        Key: {
          [PRIMARY_KEY]: item.productId,
        },
      };
      const response = await ddb.get(getParams).promise();
      console.log(response);
      if (response?.Item?.Quantity > 0) {
        const updateParams = {
          TableName: TABLE_NAME,
          Key: {
            [PRIMARY_KEY]: item.productId,
          },
          UpdateExpression: "set #MyVariable1 = :x",
          ExpressionAttributeNames: {
              '#MyVariable1': 'Quantity',
          },
          ExpressionAttributeValues: {
            ':x': response?.Item?.Quantity - 1,
          },
        };
        console.log(response.Item);
        await ddb.update(updateParams).promise();
      } else {
        const result = eventBridge.putEvents({
          Entries: [
            {
              EventBusName: EVENT_BUS_NAME,
              Source: 'ProcessWarehouseLambda',
              DetailType: 'test-type',
              Detail: JSON.stringify({
                status: 'warehouse_failed',
                items
              }),
            }
          ],
        }).promise();
        console.log(`Item '${response?.Item?.Name}' Out of stock!`);
        return { statusCode: 500, body: `Item '${response?.Item?.Name}' Out of stock!`};
      }
    }

    const result = eventBridge.putEvents({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: 'ProcessWarehouseLambda',
          DetailType: 'test-type',
          Detail: JSON.stringify({
            status: 'warehouse_completed',
            items,
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
      body: 'success',
    };
  } catch (ebError) {
    console.log(`ERROROROR`);
    return { statusCode: 500, body: JSON.stringify(ebError) };
  }
};

const compensateWarehouse = async (items: any) => {
  try {
    for (const item of items) {
      const getParams = {
        TableName: TABLE_NAME,
        Key: {
          [PRIMARY_KEY]: item.productId,
        },
      };
      const response = await ddb.get(getParams).promise();
      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          [PRIMARY_KEY]: item.productId,
        },
        UpdateExpression: "set #MyVariable1 = :x",
        ExpressionAttributeNames: {
            '#MyVariable1': 'Quantity',
        },
        ExpressionAttributeValues: {
          ':x': response?.Item?.Quantity + 1,
        },
      };
      await ddb.update(updateParams).promise();
    }

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
