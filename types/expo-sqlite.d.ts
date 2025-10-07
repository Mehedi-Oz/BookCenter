declare module 'expo-sqlite' {
  export type SQLResultSet = any;
  export type SQLTransaction = any;
  export type SQLiteDatabase = {
    execAsync: (sql: string) => Promise<void>;
    runAsync: (sql: string, params?: any[]) => Promise<{ changes?: number } | void>;
    getAllAsync: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
    getFirstAsync: <T = any>(sql: string, params?: any[]) => Promise<T | null>;
  };
  export function openDatabaseAsync(name?: string): Promise<SQLiteDatabase>;
}
