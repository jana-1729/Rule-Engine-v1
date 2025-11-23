import { Integration, IntegrationMetadata, AuthConfig, AuthType } from './types';

/**
 * Base class for creating integrations
 * Provides common functionality and structure
 */
export abstract class BaseIntegration implements Partial<Integration> {
  abstract metadata: IntegrationMetadata;
  
  protected constructor() {}

  /**
   * Create a standard integration metadata object
   */
  protected static createMetadata(config: {
    slug: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    version?: string;
    authType: AuthType;
    website?: string;
    documentation?: string;
  }): IntegrationMetadata {
    return {
      id: config.slug,
      slug: config.slug,
      name: config.name,
      description: config.description,
      version: config.version || '1.0.0',
      category: config.category as any,
      icon: config.icon,
      authType: config.authType,
      website: config.website,
      documentation: config.documentation,
    };
  }

  /**
   * Validates credentials by making a simple API call
   */
  protected async validateCredentials(
    testEndpoint: string,
    headers: Record<string, string>
  ): Promise<boolean> {
    try {
      const response = await fetch(testEndpoint, { headers });
      return response.ok;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  /**
   * Standard error handler for API calls
   */
  protected handleApiError(error: any) {
    if (error.response) {
      // API responded with error
      return {
        success: false as const,
        error: {
          code: `HTTP_${error.response.status}`,
          message: error.response.data?.message || error.message,
          details: error.response.data,
        },
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false as const,
        error: {
          code: 'NETWORK_ERROR',
          message: 'No response from server',
          details: error.message,
        },
      };
    } else {
      // Other errors
      return {
        success: false as const,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }

  /**
   * Rate limit handler with exponential backoff
   */
  protected async handleRateLimit(
    fn: () => Promise<any>,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : Math.pow(2, i) * 1000;
          
          console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }
}

