/** Minimum combined relevance score (0-1 range) for a result to count as "relevant". */
export const SEARCH_RELEVANCE_THRESHOLD = 0.15;

/** Weight given to full-text rank vs. trigram similarity in the combined score. */
export const SEARCH_FTS_WEIGHT = 0.7;
export const SEARCH_TRIGRAM_WEIGHT = 0.3;

/** Minimum trigram similarity for a row to be considered a fuzzy match at all. */
export const SEARCH_TRIGRAM_MIN_SIMILARITY = 0.2;

export const SEARCH_RESULT_LIMIT = 20;
