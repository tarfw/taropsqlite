import { useState, useCallback, useEffect } from 'react';
import { semanticSearch } from '@/services/vectorStores/semanticSearchVectorStore';

export interface SemanticSearchResult {
  entityId: string;
  entityType: string;
  similarity: number;
}

export function useSemanticSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (
    query: string,
    entityType?: string,
    limit?: number
  ) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const results = await semanticSearch(query, entityType, limit);
      setSearchResults(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Semantic search failed';
      setError(errorMessage);
      console.error('[useSemanticSearch] Error:', errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    performSearch,
    searchResults,
    isSearching,
    error,
  };
}
