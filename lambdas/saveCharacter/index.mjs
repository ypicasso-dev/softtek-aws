import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
	let mBody = null;

	try {
		mBody = JSON.parse(event.body);

		if (mBody == null) {
			mBody = event;
		}

		var {
			id,
			name,
			gender,
			skinColor,
			eyeColor,
			hairColor,
			pokemonId,
			pokemonName,
			pokemonImage,
		} = mBody;

		id = `${id}`;
		pokemonId = id;

		if (!id || !name) {
			return {
				statusCode: 400,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: "Faltan datos obligatorios: id ó name.",
				}),
			};
		}

		const params = new PutCommand({
			TableName: "personajes",
			Item: {
				id,//: getId(m.url),
				name,//: m.name,
				gender,//: m.gender,
				skinColor,//: m.skin_color,
				eyeColor,//: m.eye_color,
				hairColor,//: m.hair_color,
				pokemonId,//: id,
				pokemonName,//: m.name,
				pokemonImage,//: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`
			},
		});

		await ddb.send(params);

		return {
			statusCode: 201,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: "Personaje registrado correctamente.",
			}),
		};
	} catch (err) {
		console.error("Error al guardar:", err);

		return {
			statusCode: 500,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: err.toString(),
			}),
		};
	}
};