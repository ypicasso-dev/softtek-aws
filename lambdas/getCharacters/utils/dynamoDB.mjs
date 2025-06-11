import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const saveToDynamoDB = async (data) => {
    try {
        const tableName = process.env.DYNAMO_TABLE_NAME;

        // 1. Preparar los items en formato DynamoDB
        const putRequests = data.map(item => ({
            PutRequest: {
                Item: marshall(item) // Convierte a formato DynamoDB
            }
        }));

        // 2. Dividir en lotes de 25 items (límite de DynamoDB)
        const batchSize = 25;
        const batches = [];
        
        for (let i = 0; i < putRequests.length; i += batchSize) {
            batches.push(putRequests.slice(i, i + batchSize));
        }

        // 3. Procesar cada lote
        const results = await Promise.all(
            batches.map(async batch => {
                const params = {
                    RequestItems: {
                        [tableName]: batch
                    }
                };
                
                return await docClient.send(new BatchWriteItemCommand(params));
            })
        );

        console.log(`Successfully saved ${data.length} items to DynamoDB`);
    } catch (error) {
        console.error('Error saving to DynamoDB:', error);
        throw error;
    }
};