import { callApisAndMerge } from './utils/apiClient.mjs';
import { saveToDynamoDB } from './utils/dynamoDB.mjs';
//import { getFromCache, setToCache } from './utils/redisClient.mjs';
import { getFromCache, setToCache } from './utils/dynamoCache.mjs';

const TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS) || 60;

export const handler = async (event) => {
    try {
        const cacheKey = 'swapi_combined_api_data';
        const cachedData = await getFromCache(cacheKey);

        if (cachedData && cachedData.length > 0) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Datos recibidos desde cache',
                    size: cachedData.length,
                    data: cachedData,
                })
            };
        }

        const mergedData = await callApisAndMerge();

        await saveToDynamoDB(mergedData); // guardar en DynamoDB
        await setToCache(cacheKey, JSON.stringify(mergedData), TTL_SECONDS); // 60 segundos x 30 minutos (1,800 segundos)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Datos fusionados y almacenados',
                size: mergedData.length,
                data: mergedData
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'ISE: Internal Server Error',
                //error: `${error}`,
                //error2: error.message,
                exception: error.toString()
            })
        };
    }
};