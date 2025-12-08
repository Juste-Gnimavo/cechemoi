import Redis from 'ioredis'

// Redis configuration from environment variables
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USER || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  keyPrefix: process.env.REDIS_PREFIX ? `${process.env.REDIS_PREFIX}:` : 'cechemoi:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
}

// Default TTL in seconds (1 hour)
const DEFAULT_TTL = parseInt(process.env.REDIS_TTL || '3600')

// Singleton Redis client
let redisClient: Redis | null = null
let isConnected = false
let connectionAttempted = false

// Get Redis client instance
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_HOST) {
    // Redis not configured, return null
    return null
  }

  if (!redisClient) {
    redisClient = new Redis(redisConfig)

    redisClient.on('connect', () => {
      isConnected = true
      console.log('Redis connected successfully')
    })

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message)
      isConnected = false
    })

    redisClient.on('close', () => {
      isConnected = false
    })
  }

  return redisClient
}

// Connect to Redis (lazy connection)
async function connectRedis(): Promise<boolean> {
  if (connectionAttempted && !isConnected) {
    return false
  }

  const client = getRedisClient()
  if (!client) return false

  if (isConnected) return true

  connectionAttempted = true

  try {
    await client.connect()
    return true
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    return false
  }
}

// Cache key generators
export const cacheKeys = {
  // Products cache keys
  products: (params: string) => `products:${params}`,
  product: (slug: string) => `product:${slug}`,
  productById: (id: string) => `product:id:${id}`,

  // Categories cache keys
  categories: () => 'categories:all',
  category: (slug: string) => `category:${slug}`,

  // Home page sections
  featuredProducts: (categorySlug: string) => `home:featured:${categorySlug}`,
  homeCategories: () => 'home:categories',

  // Blog cache keys
  blogPosts: (params: string) => `blog:posts:${params}`,
  blogPost: (slug: string) => `blog:post:${slug}`,
}

// Redis cache service
export const redis = {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const connected = await connectRedis()
      if (!connected || !redisClient) return null

      const data = await redisClient.get(key)
      if (!data) return null

      return JSON.parse(data) as T
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  /**
   * Set cached data with TTL
   */
  async set(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<boolean> {
    try {
      const connected = await connectRedis()
      if (!connected || !redisClient) return false

      const serialized = JSON.stringify(value)
      await redisClient.setex(key, ttl, serialized)
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string): Promise<boolean> {
    try {
      const connected = await connectRedis()
      if (!connected || !redisClient) return false

      await redisClient.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delByPattern(pattern: string): Promise<boolean> {
    try {
      const connected = await connectRedis()
      if (!connected || !redisClient) return false

      const prefix = redisConfig.keyPrefix || ''
      const fullPattern = `${prefix}${pattern}`

      const keys = await redisClient.keys(fullPattern)
      if (keys.length > 0) {
        // Remove prefix from keys before deleting (since keyPrefix is auto-added)
        const keysWithoutPrefix = keys.map(k => k.replace(prefix, ''))
        await redisClient.del(...keysWithoutPrefix)
      }
      return true
    } catch (error) {
      console.error('Redis DEL pattern error:', error)
      return false
    }
  },

  /**
   * Invalidate all product caches
   */
  async invalidateProducts(): Promise<void> {
    await this.delByPattern('products:*')
    await this.delByPattern('product:*')
    await this.delByPattern('home:featured:*')
  },

  /**
   * Invalidate all category caches
   */
  async invalidateCategories(): Promise<void> {
    await this.delByPattern('categories:*')
    await this.delByPattern('category:*')
    await this.delByPattern('home:categories')
  },

  /**
   * Invalidate all blog caches
   */
  async invalidateBlog(): Promise<void> {
    await this.delByPattern('blog:*')
  },

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return isConnected
  },

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetchFn()

    // Cache the result (non-blocking)
    this.set(key, data, ttl).catch(() => {})

    return data
  },
}

// Export cache TTL constants
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  DEFAULT: 3600, // 1 hour
  LONG: 86400, // 24 hours
  PRODUCTS: 1800, // 30 minutes for products
  CATEGORIES: 3600, // 1 hour for categories
  HOME_PAGE: 600, // 10 minutes for home page sections
}

export default redis
