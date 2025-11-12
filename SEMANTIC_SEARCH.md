# Semantic Search & Embedding RAG Implementation

This document describes the semantic search and embedding RAG system integrated into the taropsqlite data viewer.

## Architecture Overview

The semantic search system follows the approach from [Software Mansion's AI Note-Taking App](https://github.com/software-mansion-labs/ai-note-taking-app) and implements on-device embeddings using:

- **Embedding Model**: All-MiniLM-L6-v2 (384-dimensional vectors)
- **Inference Engine**: React Native ExecuTorch
- **Vector Database**: OP-SQLite with vector extensions
- **Text Processing**: Recursive character text splitting with overlap

## Components

### 1. Vector Store Service (`services/vectorStores/semanticSearchVectorStore.ts`)

Provides the core semantic search functionality:

```typescript
// Initialize vector store
export const semanticVectorStore = new OPSQLiteVectorStore({...})

// Add entity to store
await addEntityToSemanticStore(entityType, entityId, entityData)

// Delete entity from store
await deleteEntityFromSemanticStore(entityType, entityId)

// Perform semantic search
const results = await semanticSearch(query, entityType?, limit?)
```

**Features:**
- Converts entity objects to text strings
- Splits text into overlapping chunks (500 chars, 100 overlap)
- Generates embeddings using All-MiniLM-L6-v2
- Aggregates results by entity ID (keeps highest similarity)
- Filters by entity type (optional)

### 2. Semantic Search Hook (`hooks/useSemanticSearch.ts`)

React hook for managing semantic search state:

```typescript
const { performSearch, searchResults, isSearching, error } = useSemanticSearch()

// Perform search
await performSearch(query, entityType?, limit?)
```

**Returns:**
- `searchResults`: Array of `{entityId, entityType, similarity}`
- `isSearching`: Loading state
- `error`: Error message if search fails

### 3. Data Viewer Integration (`app/index.tsx`)

Added semantic search UI with two search modes:

#### Keyword Search (Original)
- Full-text search across all fields
- Real-time filtering
- Fast for exact matches

#### Semantic Search (New)
- Meaning-based search using embeddings
- Better for intent-based queries
- Slower but more intelligent

**UI Components:**
- Search mode tabs (Keyword | Semantic)
- Dynamic placeholder text
- Loading indicator during semantic search
- Results sorted by similarity score

### 4. App Initialization (`app/_layout.tsx`)

Loading screen that ensures vector store is ready:

```typescript
useEffect(() => {
  await semanticVectorStore.load()
  // Downloads All-MiniLM-L6-v2 model on first run
  // Then loads offline on subsequent runs
}, [])
```

## Usage

### Basic Semantic Search

```typescript
import { useSemanticSearch } from '@/hooks/useSemanticSearch'

function MyComponent() {
  const { performSearch, searchResults } = useSemanticSearch()
  
  const handleSearch = async (query) => {
    await performSearch(query, 'products', 5)
    // Use searchResults
  }
}
```

### Adding Entities to Search Index

Currently entities are only indexed when using the semantic search. To enable automatic indexing on data mutations:

```typescript
import { addEntityToSemanticStore } from '@/services/vectorStores/semanticSearchVectorStore'

// When creating entity
const newEntity = await createEntity(data)
await addEntityToSemanticStore('products', newEntity.id, newEntity)

// When updating entity  
await updateEntity(id, data)
await deleteEntityFromSemanticStore('products', id)
await addEntityToSemanticStore('products', id, data)
```

## Configuration

### Enable SQLite Vector Extensions

In `package.json`:
```json
{
  "op-sqlite": {
    "fts5": true,
    "sqliteVec": true
  }
}
```

### Customize Embedding Model

In `semanticSearchVectorStore.ts`:
```typescript
export const semanticVectorStore = new OPSQLiteVectorStore({
    name: "entities_semantic_search",
    embeddings: new ExecuTorchEmbeddings({
        ...ALL_MINILM_L6_V2,  // Change to different model
        onDownloadProgress: (progress) => {...}
    }),
});
```

### Adjust Text Splitting

In `semanticSearchVectorStore.ts`:
```typescript
export const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,    // Characters per chunk
    chunkOverlap: 100, // Overlap between chunks
});
```

## Performance Notes

- **First Run**: Model download takes time (20-50MB depending on network)
- **Subsequent Runs**: Model loads from cache offline
- **Search Latency**: 100-500ms depending on device and query complexity
- **Vector Store Size**: Grows with number of indexed entities
- **Memory**: Embeddings model uses ~100-200MB in memory

## Limitations

- All processing happens on-device (privacy ✓, but slower than cloud)
- Vector similarity depends on embedding model quality
- Works best for semantic queries, not exact searches
- Requires sufficient device storage for model

## Next Steps (Part 2 - Images)

The implementation is ready to extend with image search:

```typescript
// Planned in future implementation
await semanticSearch(imageUri)  // Image-to-text search
await searchImagesByText(query) // Text-to-image search
```

## Debugging

Enable detailed logging:

```typescript
// In semanticSearchVectorStore.ts
console.log("[VectorStore] Added entity...")
console.log("[VectorStore] Semantic search returned...")

// In app/_layout.tsx
console.log("[RootLayout] Loading semantic vector store...")
```

Watch console logs prefixed with `[VectorStore]` and `[RootLayout]` for diagnostics.

## References

- [Software Mansion Blog: AI Note-Taking App Part 1](https://blog.swmansion.com/building-an-ai-powered-note-taking-app-in-react-native-part-1-text-semantic-search-3f3c94a2f92b)
- [AI Note-Taking App Repository](https://github.com/software-mansion-labs/ai-note-taking-app)
- [React Native RAG Documentation](https://github.com/react-native-rag/react-native-rag)
- [OP-SQLite Documentation](https://op-engineering.github.io/op-sqlite/)
