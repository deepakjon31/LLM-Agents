import { getSession } from 'next-auth/react';

/**
 * Utility function to make authenticated requests to the MCP service
 * via the Next.js API route proxy
 */
export async function callMcpApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: any
): Promise<T> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data && method === 'POST') {
    options.body = JSON.stringify(data);
  }
  
  // Use the Next.js API route which handles authentication and proxying
  const url = `/api/mcp${endpoint}${method === 'GET' && data ? `?${new URLSearchParams(data)}` : ''}`;
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MCP API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

/**
 * Connect to a database using the MCP SQL agent
 */
export async function connectToDatabase(connectionString: string) {
  return callMcpApi('/sql/connect', 'POST', { connection_string: connectionString });
}

/**
 * Get schema for a table
 */
export async function getTableSchema(tableName: string) {
  return callMcpApi('/sql/schema', 'POST', { table_name: tableName });
}

/**
 * Generate SQL from natural language
 */
export async function generateSqlQuery(query: string, tables: string[]) {
  return callMcpApi('/sql/generate', 'POST', { query, tables });
}

/**
 * Execute a SQL query
 */
export async function executeSqlQuery(query: string, params?: Record<string, any>) {
  return callMcpApi('/sql/execute', 'POST', { query, params });
}

/**
 * Process a document
 */
export async function processDocument(filePath: string, chunkSize: number = 1000) {
  return callMcpApi('/document/process', 'POST', { file_path: filePath, chunk_size: chunkSize });
}

/**
 * Get SQL prompt
 */
export async function getSqlPrompt(query: string) {
  return callMcpApi('/prompts/sql', 'POST', { query });
}

/**
 * Get document analysis prompt
 */
export async function getDocumentAnalysisPrompt(filePath: string) {
  return callMcpApi('/prompts/document', 'POST', { file_path: filePath });
} 