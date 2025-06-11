import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);
const CACHE_TABLE = process.env.CACHE_TABLE;

export const getFromCache = async (key) => {
	const getCmd = new GetCommand({ TableName: CACHE_TABLE, Key: { CacheKey: key } });
	const cacheResp = await ddbDoc.send(getCmd);

	if (cacheResp.Item) {
		return JSON.parse(cacheResp.Item.Data);
	}

	return null;
}

export const setToCache = async (key, value, seconds) => {
	// Guardar en cache con TTL
	const ttl = Math.floor(Date.now() / 1000) + seconds;
	const putCmd = new PutCommand({
		TableName: CACHE_TABLE,
		Item: { CacheKey: key, Data: value, ttl }
	});

	await ddbDoc.send(putCmd);
}