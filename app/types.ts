export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

export interface SearchResult {
  id: string;
  url: string;
  title: string;
  snippet: string;
  text?: string;
  score: number;
}
