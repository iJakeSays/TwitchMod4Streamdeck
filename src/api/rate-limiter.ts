/**
 * Rate limiter for Twitch API
 * Implements token bucket algorithm to respect Twitch's 800 points per minute limit
 */

import { logger } from '../utils/logger';

interface RateLimitConfig {
  maxPoints: number;
  refillRate: number; // points per second
  pointCost?: number; // default cost per request
}

export class RateLimiter {
  private availablePoints: number;
  private maxPoints: number;
  private refillRate: number;
  private lastRefill: number;
  private defaultCost: number;
  private queue: Array<{ cost: number; resolve: () => void }> = [];

  constructor(config: RateLimitConfig) {
    this.maxPoints = config.maxPoints;
    this.availablePoints = config.maxPoints;
    this.refillRate = config.refillRate;
    this.defaultCost = config.pointCost || 1;
    this.lastRefill = Date.now();
  }

  /**
   * Refill the token bucket based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // convert to seconds
    const pointsToAdd = Math.floor(elapsed * this.refillRate);

    if (pointsToAdd > 0) {
      this.availablePoints = Math.min(this.maxPoints, this.availablePoints + pointsToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Process the queue and grant tokens to waiting requests
   */
  private processQueue(): void {
    while (this.queue.length > 0) {
      const request = this.queue[0];
      if (this.availablePoints >= request.cost) {
        this.availablePoints -= request.cost;
        this.queue.shift();
        request.resolve();
      } else {
        break;
      }
    }
  }

  /**
   * Acquire permission to make a request
   * Returns a promise that resolves when the request can proceed
   */
  async acquire(cost?: number): Promise<void> {
    const requestCost = cost || this.defaultCost;

    this.refill();

    if (this.availablePoints >= requestCost) {
      this.availablePoints -= requestCost;
      return Promise.resolve();
    }

    // Not enough points, add to queue
    logger.debug(`Rate limit reached, queueing request (cost: ${requestCost})`);

    return new Promise<void>((resolve) => {
      this.queue.push({ cost: requestCost, resolve });

      // Set up a timer to periodically check if we can process the queue
      const checkInterval = setInterval(() => {
        this.refill();
        this.processQueue();

        // If this request has been processed, clear the interval
        if (!this.queue.find(r => r.resolve === resolve)) {
          clearInterval(checkInterval);
        }
      }, 100); // Check every 100ms
    });
  }

  /**
   * Get current available points
   */
  getAvailablePoints(): number {
    this.refill();
    return this.availablePoints;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.availablePoints = this.maxPoints;
    this.lastRefill = Date.now();
    this.queue = [];
  }
}

// Create a singleton rate limiter for Twitch API
// Twitch allows 800 points per minute, which is ~13.33 points per second
export const twitchRateLimiter = new RateLimiter({
  maxPoints: 800,
  refillRate: 800 / 60, // 13.33 points per second
  pointCost: 1
});
