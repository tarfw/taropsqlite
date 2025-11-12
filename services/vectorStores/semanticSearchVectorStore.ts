import { RecursiveCharacterTextSplitter } from 'react-native-rag';
import { OPSQLiteVectorStore } from '@react-native-rag/op-sqlite';
import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { ALL_MINILM_L6_V2 } from "react-native-executorch";

/**
 * Initialize the semantic vector store for entity data search
 */
export const semanticVectorStore = new OPSQLiteVectorStore({
    name: "entities_semantic_search",
    embeddings: new ExecuTorchEmbeddings({
        ...ALL_MINILM_L6_V2, 
        onDownloadProgress: (progress) => {
            console.log("[VectorStore] All-MiniLM-L6-v2 model loading progress:", progress);
        }
    }),
});

/**
 * Convert entity data to string for embedding
 */
export const entityToString = (entity: Record<string, any>): string => {
    return Object.entries(entity)
        .map(([key, value]) => {
            if (value === null || value === undefined) return '';
            return `${key}: ${String(value)}`;
        })
        .filter(line => line.length > 0)
        .join('\n');
}

/**
 * Text splitter for breaking down entity data into chunks
 */
export const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
});

/**
 * Add entity data to the semantic vector store
 */
export async function addEntityToSemanticStore(
    entityType: string,
    entityId: string,
    entityData: Record<string, any>
): Promise<void> {
    try {
        const text = entityToString(entityData);
        const chunks = await textSplitter.splitText(text);
        
        for (const chunk of chunks) {
            await semanticVectorStore.add({
                document: chunk,
                metadata: {
                    entityType,
                    entityId,
                    timestamp: Date.now(),
                }
            });
        }
        
        console.log(`[VectorStore] Added entity ${entityType}:${entityId} to semantic search`);
    } catch (error) {
        console.error(`[VectorStore] Error adding entity to semantic store:`, error);
        throw error;
    }
}

/**
 * Delete entity data from the semantic vector store
 */
export async function deleteEntityFromSemanticStore(
    entityType: string,
    entityId: string
): Promise<void> {
    try {
        await semanticVectorStore.delete({
            predicate: (record: any) => 
                record.metadata?.entityType === entityType && 
                record.metadata?.entityId === entityId
        });
        
        console.log(`[VectorStore] Deleted entity ${entityType}:${entityId} from semantic search`);
    } catch (error) {
        console.error(`[VectorStore] Error deleting entity from semantic store:`, error);
        throw error;
    }
}

/**
 * Search for entities by semantic similarity
 */
export async function semanticSearch(
    query: string,
    entityType?: string,
    limit: number = 5
): Promise<Array<{ entityId: string; entityType: string; similarity: number }>> {
    try {
        const results = await semanticVectorStore.query({ queryText: query.trim() });
        
        // Group by entity ID and get max similarity
        const groupedResults = new Map<string, { 
            entityId: string; 
            entityType: string; 
            similarity: number 
        }>();
        
        for (const result of results) {
            const entityId = result.metadata?.entityId;
            const resultEntityType = result.metadata?.entityType;
            
            if (!entityId) continue;
            
            // Filter by entity type if specified
            if (entityType && resultEntityType !== entityType) continue;
            
            const key = `${resultEntityType}:${entityId}`;
            const existing = groupedResults.get(key);
            
            // Keep the highest similarity score for each entity
            if (!existing || result.similarity > existing.similarity) {
                groupedResults.set(key, {
                    entityId,
                    entityType: resultEntityType,
                    similarity: result.similarity,
                });
            }
        }
        
        // Sort by similarity and limit results
        const sorted = Array.from(groupedResults.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
        
        console.log(`[VectorStore] Semantic search for "${query}" returned ${sorted.length} results`);
        return sorted;
    } catch (error) {
        console.error(`[VectorStore] Error during semantic search:`, error);
        throw error;
    }
}
