import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
interface RateLimitStore {
  [key: string]: {
    requests: number
    resetTime: number
  }
}
class ApiKeyRateLimiter {
  private stores: {
    minute: RateLimitStore
    hour: RateLimitStore
    day: RateLimitStore
  } = {
    minute: {},
    hour: {},
    day: {}
  }
  private getKey(req: Request, timeframe: string): string {
    const apiKeyId = req.apiKey?.id || req.ip
    return `${apiKeyId}_${timeframe}`
  }
  private cleanup() {
    const now = Date.now()
    Object.keys(this.stores.minute).forEach(key => {
      if (this.stores.minute[key].resetTime < now) {
        delete this.stores.minute[key]
      }
    })
    Object.keys(this.stores.hour).forEach(key => {
      if (this.stores.hour[key].resetTime < now) {
        delete this.stores.hour[key]
      }
    })
    Object.keys(this.stores.day).forEach(key => {
      if (this.stores.day[key].resetTime < now) {
        delete this.stores.day[key]
      }
    })
  }
  private checkLimit(
    req: Request,
    timeframe: 'minute' | 'hour' | 'day',
    limit: number,
    windowMs: number
  ): { allowed: boolean; resetTime: number; requests: number } {
    this.cleanup()
    const key = this.getKey(req, timeframe)
    const now = Date.now()
    const store = this.stores[timeframe]
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        requests: 1,
        resetTime: now + windowMs
      }
      return { allowed: true, resetTime: store[key].resetTime, requests: 1 }
    }
    store[key].requests++
    return {
      allowed: store[key].requests <= limit,
      resetTime: store[key].resetTime,
      requests: store[key].requests
    }
  }
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const rateLimits = req.apiKey?.rateLimit || {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000
      }
      const minuteCheck = this.checkLimit(req, 'minute', rateLimits.requestsPerMinute, 60 * 1000)
      if (!minuteCheck.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests per minute. Limit: ${rateLimits.requestsPerMinute}`,
          resetTime: new Date(minuteCheck.resetTime).toISOString(),
          requests: minuteCheck.requests,
          limit: rateLimits.requestsPerMinute
        })
      }
      const hourCheck = this.checkLimit(req, 'hour', rateLimits.requestsPerHour, 60 * 60 * 1000)
      if (!hourCheck.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests per hour. Limit: ${rateLimits.requestsPerHour}`,
          resetTime: new Date(hourCheck.resetTime).toISOString(),
          requests: hourCheck.requests,
          limit: rateLimits.requestsPerHour
        })
      }
      const dayCheck = this.checkLimit(req, 'day', rateLimits.requestsPerDay, 24 * 60 * 60 * 1000)
      if (!dayCheck.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests per day. Limit: ${rateLimits.requestsPerDay}`,
          resetTime: new Date(dayCheck.resetTime).toISOString(),
          requests: dayCheck.requests,
          limit: rateLimits.requestsPerDay
        })
      }
      res.set({
        'X-RateLimit-Limit-Minute': rateLimits.requestsPerMinute.toString(),
        'X-RateLimit-Limit-Hour': rateLimits.requestsPerHour.toString(),
        'X-RateLimit-Limit-Day': rateLimits.requestsPerDay.toString(),
        'X-RateLimit-Remaining-Minute': (rateLimits.requestsPerMinute - minuteCheck.requests).toString(),
        'X-RateLimit-Remaining-Hour': (rateLimits.requestsPerHour - hourCheck.requests).toString(),
        'X-RateLimit-Remaining-Day': (rateLimits.requestsPerDay - dayCheck.requests).toString(),
        'X-RateLimit-Reset-Minute': new Date(minuteCheck.resetTime).toISOString(),
        'X-RateLimit-Reset-Hour': new Date(hourCheck.resetTime).toISOString(),
        'X-RateLimit-Reset-Day': new Date(dayCheck.resetTime).toISOString()
      })
      next()
    }
  }
}
export const apiKeyRateLimit = new ApiKeyRateLimiter().middleware()
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later or use an API key for higher limits.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})