# Qdrant Vector Store Rules

## Usage Boundaries

### MUST Use Qdrant ONLY For
- **Semantic resource retrieval**: Finding relevant documentation, tutorials, examples
- **Content similarity matching**: Matching learning resources to user queries
- **Knowledge base search**: Searching curated educational content
- **Resource recommendation**: Suggesting related materials based on embeddings

### NEVER Use Qdrant For
- **Transactional data**: User profiles, progress, submissions, evaluations
- **Session state**: Current learning context, conversation history
- **Real-time updates**: Frequently changing data that needs ACID properties
- **Primary data storage**: Always use Postgres as system of record

## Collection Design

### Learning Resources Collection
```typescript
interface LearningResourceVector {
  id: string; // UUID matching Postgres resource record
  vector: number[]; // Embedding from content + metadata
  payload: {
    title: string;
    description: string;
    content_type: 'documentation' | 'tutorial' | 'example' | 'reference';
    difficulty_level: number; // 1-10
    topics: string[]; // Programming topics/technologies
    language: string; // Programming language
    source_url: string;
    last_verified: string; // ISO timestamp
    quality_score: number; // 0.0-1.0
  };
}
```

### Search Queries Collection
```typescript
interface QueryVector {
  id: string;
  vector: number[]; // Embedding from user query
  payload: {
    original_query: string;
    user_context: {
      skill_level: string;
      current_topic: string;
      learning_goals: string[];
    };
    timestamp: string;
  };
}
```

## Embedding Strategy

### MUST Use Consistent Embedding Model
```typescript
interface EmbeddingConfig {
  model: 'text-embedding-ada-002' | 'sentence-transformers/all-MiniLM-L6-v2';
  dimensions: number;
  max_tokens: number;
}

const EMBEDDING_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-ada-002',
  dimensions: 1536,
  max_tokens: 8191
};
```

### Content Preprocessing for Embeddings
```typescript
function prepareContentForEmbedding(resource: LearningResource): string {
  // Combine title, description, and key content
  const content = [
    `Title: ${resource.title}`,
    `Description: ${resource.description}`,
    `Topics: ${resource.topics.join(', ')}`,
    `Language: ${resource.language}`,
    `Level: ${resource.difficulty_level}/10`,
    resource.content.substring(0, 6000) // Truncate to fit token limit
  ].join('\n\n');
  
  return content;
}
```

## Search Patterns

### Semantic Resource Discovery
```typescript
async function findRelevantResources(
  query: string,
  userContext: LearningContext,
  limit: number = 5
): Promise<LearningResource[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(
    `${query} ${userContext.currentTopic} level:${userContext.skillLevel}`
  );
  
  // Search with filters
  const searchResult = await qdrantClient.search('learning_resources', {
    vector: queryEmbedding,
    limit,
    filter: {
      must: [
        {
          key: 'difficulty_level',
          range: {
            gte: Math.max(1, userContext.skillLevel - 1),
            lte: Math.min(10, userContext.skillLevel + 2)
          }
        },
        {
          key: 'quality_score',
          range: { gte: 0.7 }
        }
      ],
      should: [
        {
          key: 'topics',
          match: { any: userContext.learningGoals }
        }
      ]
    }
  });
  
  return searchResult.points.map(point => ({
    id: point.id,
    score: point.score,
    ...point.payload
  }));
}
```

### Contextual Resource Filtering
```typescript
async function filterResourcesByContext(
  resources: QdrantSearchResult[],
  context: LearningContext
): Promise<LearningResource[]> {
  return resources
    .filter(resource => {
      // Filter by difficulty appropriateness
      const difficultyMatch = Math.abs(
        resource.payload.difficulty_level - context.skillLevel
      ) <= 2;
      
      // Filter by topic relevance
      const topicMatch = resource.payload.topics.some(topic =>
        context.learningGoals.includes(topic)
      );
      
      // Filter by recency (prefer recently verified content)
      const lastVerified = new Date(resource.payload.last_verified);
      const daysSinceVerified = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
      const recentEnough = daysSinceVerified <= 90; // 3 months
      
      return difficultyMatch && (topicMatch || resource.score > 0.85) && recentEnough;
    })
    .sort((a, b) => b.score - a.score);
}
```

## Data Synchronization

### MUST Keep Qdrant in Sync with Postgres
```typescript
// When adding new learning resource to Postgres
async function addLearningResource(resource: LearningResource): Promise<void> {
  // 1. Save to Postgres (source of truth)
  const savedResource = await resourceRepository.save(resource);
  
  // 2. Generate embedding and add to Qdrant
  try {
    const embedding = await generateEmbedding(
      prepareContentForEmbedding(savedResource)
    );
    
    await qdrantClient.upsert('learning_resources', {
      points: [{
        id: savedResource.id,
        vector: embedding,
        payload: {
          title: savedResource.title,
          description: savedResource.description,
          content_type: savedResource.contentType,
          difficulty_level: savedResource.difficultyLevel,
          topics: savedResource.topics,
          language: savedResource.language,
          source_url: savedResource.sourceUrl,
          last_verified: savedResource.lastVerified.toISOString(),
          quality_score: savedResource.qualityScore
        }
      }]
    });
  } catch (error) {
    logger.error('Failed to sync resource to Qdrant', { 
      resourceId: savedResource.id, 
      error 
    });
    // Don't fail the operation - Postgres is source of truth
  }
}
```

### Batch Synchronization
```typescript
async function syncResourcesFromPostgres(): Promise<void> {
  const resources = await resourceRepository.findAll();
  const batchSize = 100;
  
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    
    const points = await Promise.all(
      batch.map(async (resource) => ({
        id: resource.id,
        vector: await generateEmbedding(prepareContentForEmbedding(resource)),
        payload: extractPayload(resource)
      }))
    );
    
    await qdrantClient.upsert('learning_resources', { points });
    logger.info(`Synced batch ${Math.floor(i / batchSize) + 1}`, { 
      count: points.length 
    });
  }
}
```

## Performance Optimization

### MUST Use Appropriate Search Parameters
```typescript
const SEARCH_CONFIG = {
  // Use HNSW for fast approximate search
  hnsw_config: {
    m: 16,
    ef_construct: 200,
    full_scan_threshold: 10000
  },
  
  // Optimize for search performance
  search_params: {
    hnsw_ef: 128, // Higher = more accurate but slower
    exact: false  // Use approximate search for speed
  }
};
```

### Caching Strategy
```typescript
class QdrantSearchCache {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  async search(query: string, context: LearningContext): Promise<LearningResource[]> {
    const cacheKey = this.generateCacheKey(query, context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.result;
    }
    
    const result = await this.performSearch(query, context);
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }
  
  private generateCacheKey(query: string, context: LearningContext): string {
    return `${query}:${context.skillLevel}:${context.currentTopic}`;
  }
}
```