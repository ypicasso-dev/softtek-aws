import { createClient } from 'redis';
import * as iam from 'aws-cdk-lib/aws-iam';

let redisClient;

const getRedisClient = async () => {
    if (!redisClient) {
        redisClient = createClient({
            url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
            //password: process.env.REDIS_PASSWORD,
            socket: {
                tls: true,
                // connectTimeout: 10000,        // timeout para conexión
                // timeout: undefined,           // opcional según versión
            },
            retry_strategy: retries => Math.min(retries * 50, 500), // backoff
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));

        await redisClient.connect();
    }

    return redisClient;
};

export const getFromCache = async (key) => {
    try {
        const client = await getRedisClient();

        return await client.get(key);
    } catch (error) {
        console.error('Error getting from Redis cache:', error);
        return null; // Si hay error con Redis, continuar sin caché
    }
};

export const setToCache = async (key, value, ttl) => {
    try {
        const client = await getRedisClient();

        await client.set(key, value, {
            EX: ttl // Expire after ttl seconds
        });
    } catch (error) {
        console.error('Error setting to Redis cache:', error);
    }
};