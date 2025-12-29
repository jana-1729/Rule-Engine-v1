import { prisma } from '@/lib/prisma';

/**
 * Schema Cache Service
 * Simple caching system for integration schemas and mapping patterns
 * 
 * Features:
 * - In-memory cache for fast access
 * - Database persistence
 * - Keyword-based similarity search
 * - Can be upgraded to vector DB in Phase 3 if needed
 */
class SchemaCacheService {
  private cache: Map<string, any> = new Map();
  private initialized = false;

  /**
   * Index a schema or mapping pattern
   */
  async indexSchema(
    integration: string,
    action: string,
    schema: any,
    metadata: any
  ): Promise<void> {
    const key = `${integration}-${action}`;
    
    try {
      // Store in memory for fast access
      this.cache.set(key, { schema, metadata });
      
      // Also store in database for persistence
      await prisma.schemaCache.upsert({
        where: { key },
        create: {
          key,
          integration,
          action,
          schema: JSON.stringify(schema),
          metadata: JSON.stringify(metadata),
        },
        update: {
          schema: JSON.stringify(schema),
          metadata: JSON.stringify(metadata),
          updatedAt: new Date(),
        },
      });

      console.log(`✓ Indexed schema: ${key}`);
    } catch (error) {
      console.error(`Failed to index schema ${key}:`, error);
      throw error;
    }
  }

  /**
   * Find similar schemas using keyword matching
   * Can be upgraded to vector search in Phase 3
   */
  async findSimilarSchemas(
    query: string,
    topK: number = 5
  ): Promise<Array<{ id: string; schema: any; metadata: any; score: number }>> {
    await this.ensureInitialized();

    const results: Array<{ id: string; schema: any; metadata: any; score: number }> = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    // Search through cache
    for (const [key, value] of this.cache.entries()) {
      const schemaText = JSON.stringify(value.schema).toLowerCase();
      const metadataText = JSON.stringify(value.metadata).toLowerCase();
      const combinedText = `${schemaText} ${metadataText}`;
      
      // Calculate simple relevance score
      let score = 0;
      for (const word of queryWords) {
        if (combinedText.includes(word)) {
          score += 1;
        }
      }
      
      // Bonus for exact key match
      if (key.toLowerCase().includes(queryLower)) {
        score += 5;
      }
      
      if (score > 0) {
        results.push({
          id: key,
          schema: value.schema,
          metadata: value.metadata,
          score,
        });
      }
    }

    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get a specific schema by key
   */
  async getSchema(integration: string, action: string): Promise<any | null> {
    await this.ensureInitialized();
    
    const key = `${integration}-${action}`;
    return this.cache.get(key) || null;
  }

  /**
   * Load all schemas from database into memory
   */
  async loadFromDatabase(): Promise<void> {
    try {
      const schemas = await prisma.schemaCache.findMany();
      
      for (const schema of schemas) {
        this.cache.set(schema.key, {
          schema: JSON.parse(schema.schema),
          metadata: JSON.parse(schema.metadata),
        });
      }

      this.initialized = true;
      console.log(`✓ Loaded ${schemas.length} schemas from database`);
    } catch (error) {
      console.error('Failed to load schemas from database:', error);
      // Continue with empty cache if database fails
      this.initialized = true;
    }
  }

  /**
   * Clear all cached schemas
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    console.log('✓ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalSchemas: number;
    initialized: boolean;
  } {
    return {
      totalSchemas: this.cache.size,
      initialized: this.initialized,
    };
  }

  /**
   * Ensure cache is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadFromDatabase();
    }
  }
}

// Export singleton instance
export const schemaCacheService = new SchemaCacheService();

// Export class for testing
export { SchemaCacheService };

