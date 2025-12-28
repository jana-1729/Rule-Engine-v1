/**
 * Error Recovery Service
 * 
 * Provides intelligent error recovery with automatic retries,
 * exponential backoff, and circuit breaker patterns
 */

export enum ErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_DEPRECATED = 'API_DEPRECATED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time to wait before attempting to close circuit (ms)
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 32000,
  backoffMultiplier: 2,
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
};

/**
 * Circuit Breaker State
 */
enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker for preventing cascading failures
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      
      // Success - reset circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Error Recovery Service
 */
export class ErrorRecoveryService {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Classify error type based on error details
   */
  classifyError(error: any): ErrorType {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    const statusCode = error?.response?.status || error?.statusCode;

    // Rate limiting
    if (statusCode === 429 || errorCode.includes('rate_limit') || errorMessage.includes('rate limit')) {
      return ErrorType.RATE_LIMIT;
    }

    // Authentication errors
    if (statusCode === 401 || statusCode === 403 || 
        errorCode.includes('auth') || errorMessage.includes('unauthorized') ||
        errorMessage.includes('token expired')) {
      return ErrorType.AUTH_EXPIRED;
    }

    // Network errors
    if (errorCode.includes('network') || errorCode.includes('econnrefused') ||
        errorCode.includes('etimedout') || errorMessage.includes('network')) {
      return ErrorType.NETWORK_ERROR;
    }

    // Validation errors
    if (statusCode === 400 || errorCode.includes('validation') || 
        errorMessage.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }

    // Timeout errors
    if (errorCode.includes('timeout') || errorMessage.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }

    // API deprecated
    if (statusCode === 410 || errorMessage.includes('deprecated')) {
      return ErrorType.API_DEPRECATED;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(errorType: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.RATE_LIMIT,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT,
      ErrorType.UNKNOWN,
    ];

    return retryableErrors.includes(errorType);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attemptNumber: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attemptNumber),
      config.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Execute function with automatic retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: {
      retryConfig?: Partial<RetryConfig>;
      onRetry?: (error: any, attempt: number) => void;
      serviceName?: string;
    } = {}
  ): Promise<T> {
    const config: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
    };

    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Use circuit breaker if service name provided
        if (options.serviceName) {
          const circuitBreaker = this.getCircuitBreaker(options.serviceName);
          return await circuitBreaker.execute(fn);
        }

        return await fn();
      } catch (error) {
        lastError = error;
        const errorType = this.classifyError(error);

        // Don't retry if error is not retryable
        if (!this.isRetryable(errorType)) {
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= config.maxRetries) {
          throw error;
        }

        // Calculate delay and wait
        const delay = this.getRetryDelay(attempt, config);
        
        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(error, attempt + 1);
        }

        console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`, {
          errorType,
          error: error instanceof Error ? error.message : String(error),
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Get or create circuit breaker for a service
   */
  private getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker());
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Get circuit breaker state for a service
   */
  getCircuitBreakerState(serviceName: string): CircuitState | null {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Suggest alternative actions when an action fails
   */
  async suggestAlternatives(
    failedAction: string,
    integration: string,
    error: any
  ): Promise<string[]> {
    // TODO: Implement AI-powered alternative suggestion
    // For now, return empty array
    console.log('Suggesting alternatives for failed action:', {
      action: failedAction,
      integration,
      error: error.message,
    });

    return [];
  }
}

// Singleton instance
export const errorRecovery = new ErrorRecoveryService();

