// Advanced search utilities with fuzzy matching and phonetic search
export class FuzzySearch {
  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity ratio between two strings (0-1)
   */
  static similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Normalize string for better matching
   */
  static normalize(str: string): string {
    const lower = str.toLowerCase();
    // Normalize to NFC to keep composed characters consistent across inputs
    const normalized = (lower as any).normalize ? lower.normalize('NFC') : lower;
    // Prefer Unicode-aware stripping: keep all letters/numbers in any language plus spaces
    try {
      return normalized
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    } catch {
      // Fallback for environments without Unicode property escapes: remove common ASCII punctuation only
      return normalized
        .replace(/[!-/:-@[-`{-~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  /**
   * Check if query matches text with fuzzy tolerance
   */
  static fuzzyMatch(query: string, text: string, threshold = 0.6): boolean {
    const normalizedQuery = this.normalize(query);
    const normalizedText = this.normalize(text);

    // Exact match
    if (normalizedText.includes(normalizedQuery)) return true;

    // Word-wise fuzzy matching
    const queryWords = normalizedQuery.split(' ');
    const textWords = normalizedText.split(' ');

    return queryWords.every(queryWord =>
      textWords.some(textWord =>
        this.similarity(queryWord, textWord) >= threshold
      )
    );
  }

  /**
   * Get fuzzy match score for ranking
   */
  static getMatchScore(query: string, text: string): number {
    const normalizedQuery = this.normalize(query);
    const normalizedText = this.normalize(text);

    // Exact match gets highest score
    if (normalizedText.includes(normalizedQuery)) return 1.0;

    // Calculate average similarity across words
    const queryWords = normalizedQuery.split(' ');
    const textWords = normalizedText.split(' ');

    let totalScore = 0;
    let matchCount = 0;

    queryWords.forEach(queryWord => {
      const bestMatch = Math.max(...textWords.map(textWord =>
        this.similarity(queryWord, textWord)
      ));
      if (bestMatch > 0.6) {
        totalScore += bestMatch;
        matchCount++;
      }
    });

    return matchCount > 0 ? totalScore / queryWords.length : 0;
  }
}

/**
 * Bangla phonetic matching utilities
 */
export class BanglaPhonetics {
  // Common Bangla character mappings for phonetic matching
  private static readonly phoneticMap: Record<string, string[]> = {
    'ক': ['k', 'c'],
    'খ': ['kh'],
    'গ': ['g'],
    'ঘ': ['gh'],
    'চ': ['ch', 'c'],
    'ছ': ['chh'],
    'জ': ['j'],
    'ঝ': ['jh'],
    'ট': ['t'],
    'ঠ': ['th'],
    'ড': ['d'],
    'ঢ': ['dh'],
    'ণ': ['n'],
    'ত': ['t'],
    'থ': ['th'],
    'দ': ['d'],
    'ধ': ['dh'],
    'ন': ['n'],
    'প': ['p'],
    'ফ': ['f', 'ph'],
    'ব': ['b', 'v'],
    'ভ': ['bh', 'v'],
    'ম': ['m'],
    'য': ['z', 'j'],
    'র': ['r'],
    'ল': ['l'],
    'শ': ['sh', 's'],
    'ষ': ['sh', 's'],
    'স': ['s'],
    'হ': ['h'],
    'া': ['a'],
    'ি': ['i'],
    'ী': ['ee', 'i'],
    'ু': ['u'],
    'ূ': ['oo', 'u'],
    'ে': ['e'],
    'ৈ': ['oi'],
    'ো': ['o'],
    'ৌ': ['ou']
  };

  /**
   * Convert Bangla text to phonetic representation
   */
  static toPhonetic(banglaText: string): string[] {
    const result: string[] = [];

    for (const char of banglaText) {
      const phonetics = this.phoneticMap[char];
      if (phonetics) {
        result.push(...phonetics);
      } else if (/[a-zA-Z]/.test(char)) {
        result.push(char.toLowerCase());
      }
    }

    return result;
  }

  /**
   * Check if English query matches Bangla text phonetically
   */
  static phoneticMatch(englishQuery: string, banglaText: string): boolean {
    const phoneticChars = this.toPhonetic(banglaText);
    const phoneticText = phoneticChars.join('');
    const normalizedQuery = englishQuery.toLowerCase().replace(/\s+/g, '');

    return phoneticText.includes(normalizedQuery) ||
      FuzzySearch.similarity(normalizedQuery, phoneticText) > 0.7;
  }
}

/**
 * Transliteration utilities for Bangla-English conversion
 */
export class Transliteration {
  private static readonly banglaToEnglish: Record<string, string> = {
    'বাংলা': 'bangla',
    'বই': 'boi',
    'লেখক': 'lekhok',
    'প্রকাশক': 'prokashok',
    'প্রকাশনী': 'prokashoni',
    'উপন্যাস': 'uponnash',
    'কবিতা': 'kobita',
    'গল্প': 'golpo',
    'ইতিহাস': 'itihas',
    'বিজ্ঞান': 'biggan',
    'গণিত': 'gonit',
    'ভূগোল': 'bhugol',
    // Add more common words
  };

  private static readonly englishToBangla: Record<string, string> =
    Object.fromEntries(
      Object.entries(this.banglaToEnglish).map(([k, v]) => [v, k])
    );

  /**
   * Transliterate Bangla to English
   */
  static banglaToEng(text: string): string {
    let result = text.toLowerCase();

    Object.entries(this.banglaToEnglish).forEach(([bangla, english]) => {
      result = result.replace(new RegExp(bangla, 'g'), english);
    });

    return result;
  }

  /**
   * Transliterate English to Bangla
   */
  static engToBangla(text: string): string {
    let result = text.toLowerCase();

    Object.entries(this.englishToBangla).forEach(([english, bangla]) => {
      result = result.replace(new RegExp(english, 'g'), bangla);
    });

    return result;
  }

  /**
   * Get all possible transliterations of a query
   */
  static getAllVariations(query: string): string[] {
    const variations = [query];

    // Add transliterated versions
    variations.push(this.banglaToEng(query));
    variations.push(this.engToBangla(query));

    // Remove duplicates
    return [...new Set(variations)];
  }
}

/**
 * Search suggestion engine
 */
export class SuggestionEngine {
  private static suggestions: string[] = [];

  /**
   * Add search query to suggestions database
   */
  static addQuery(query: string) {
    const normalized = FuzzySearch.normalize(query);
    if (normalized && !this.suggestions.includes(normalized)) {
      this.suggestions.push(normalized);
      // Keep only last 1000 suggestions
      if (this.suggestions.length > 1000) {
        this.suggestions.shift();
      }
    }
  }

  /**
   * Get suggestions for a partial query
   */
  static getSuggestions(partialQuery: string, limit = 5): string[] {
    const normalized = FuzzySearch.normalize(partialQuery);
    if (!normalized) return [];

    const matches = this.suggestions
      .filter(suggestion =>
        suggestion.includes(normalized) ||
        FuzzySearch.similarity(normalized, suggestion) > 0.7
      )
      .sort((a, b) => {
        // Prioritize exact starts
        const aStarts = a.startsWith(normalized);
        const bStarts = b.startsWith(normalized);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Then by similarity
        return FuzzySearch.getMatchScore(normalized, b) -
          FuzzySearch.getMatchScore(normalized, a);
      })
      .slice(0, limit);

    return matches;
  }
}

/**
 * Main search ranking algorithm
 */
export class SearchRanking {
  /**
   * Calculate comprehensive search score for a book
   */
  static calculateScore(query: string, book: {
    name: string;
    author?: string;
    publisher?: string;
    notes?: string;
  }): number {
    const normalizedQuery = FuzzySearch.normalize(query);
    let totalScore = 0;

    // Name match (highest weight)
    const nameScore = FuzzySearch.getMatchScore(normalizedQuery, book.name);
    totalScore += nameScore * 5;

    // Author match
    if (book.author) {
      const authorScore = FuzzySearch.getMatchScore(normalizedQuery, book.author);
      totalScore += authorScore * 3;
    }

    // Publisher match
    if (book.publisher) {
      const publisherScore = FuzzySearch.getMatchScore(normalizedQuery, book.publisher);
      totalScore += publisherScore * 2;
    }

    // Notes match (lowest weight)
    if (book.notes) {
      const notesScore = FuzzySearch.getMatchScore(normalizedQuery, book.notes);
      totalScore += notesScore * 1;
    }

    // Check for transliteration matches
    const variations = Transliteration.getAllVariations(query);
    variations.forEach(variation => {
      if (variation !== query) {
        const translitScore = this.calculateScore(variation, book);
        totalScore += translitScore * 0.8; // Slightly lower weight for transliterations
      }
    });

    return Math.min(totalScore, 10); // Cap at 10
  }

  /**
   * Rank and filter search results
   */
  static rankResults<T extends { name: string; author?: string; publisher?: string; notes?: string }>(
    query: string,
    items: T[],
    threshold = 0.3
  ): T[] {
    const scoredItems = items
      .map(item => ({
        item,
        score: this.calculateScore(query, item)
      }))
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score);

    return scoredItems.map(({ item }) => item);
  }
}
