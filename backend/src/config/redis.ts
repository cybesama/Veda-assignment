import Redis from 'ioredis';

let redis: Redis;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const isTLS = url.startsWith('rediss://');
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      tls: isTLS ? {} : undefined,
    });
    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (err) => console.error('Redis error:', err));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  getRedis();
}
