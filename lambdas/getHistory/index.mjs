import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
	try {
		const command = new ScanCommand({
			TableName: process.env.DYNAMO_TABLE_NAME,
		});

		const data = await ddbDocClient.send(command);

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: "Datos desde DynamoDB",
				size: data.Items.length,
				data: data.Items
			}),
		};
	} catch (err) {
		console.error("Error al leer los personajes:", err);

		return {
			statusCode: 500,
			body: {
				message: "Error al obtener personajes",
				exception: err.toString()
			},
		};
	}
};