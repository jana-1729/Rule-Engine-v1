import Redis from 'ioredis';

class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          console.error('Redis reconnect on error:', err.message);
          return true;
        }
      });

      this.client.on('connect', () => {
        console.log('✓ Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping cache get');
      return null;
    }
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }
    
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();

