from mcp.server.fastmcp import FastMCP
import json
from typing import Dict, Any, List, Optional
import os
from datetime import datetime

from ..sql_agent import SQLAgent
from ..document_processor import DocumentProcessor

# Create an MCP server for backend agents
mcp = FastMCP("AgentMCP")

# Global agent instances
_sql_agent = None
_doc_processor = None

def get_sql_agent() -> SQLAgent:
    """Get or create a SQL agent instance."""
    global _sql_agent
    if _sql_agent is None:
        openai_api_key = os.environ.get("OPENAI_API_KEY", "")
        _sql_agent = SQLAgent(openai_api_key)
    return _sql_agent

def get_doc_processor() -> DocumentProcessor:
    """Get or create a Document Processor agent instance."""
    global _doc_processor
    if _doc_processor is None:
        openai_api_key = os.environ.get("OPENAI_API_KEY", "")
        _doc_processor = DocumentProcessor(openai_api_key)
    return _doc_processor

# === SQL Agent Tools ===

@mcp.tool()
def sql_connect(connection_string: str) -> Dict[str, Any]:
    """Connect to a database using the SQL agent."""
    agent = get_sql_agent()
    agent.connect_to_database(connection_string)
    return {
        "status": "connected",
        "available_tables": agent.get_agent_state().get("available_tables", []),
        "connection_time": agent.get_agent_state().get("connection_time")
    }

@mcp.tool()
def sql_get_table_schema(table_name: str) -> Dict[str, Any]:
    """Get the schema of a database table."""
    agent = get_sql_agent()
    return agent.get_table_schema(table_name)

@mcp.tool()
def sql_generate_query(natural_language_query: str, tables: List[str]) -> Dict[str, Any]:
    """Generate a SQL query from natural language."""
    agent = get_sql_agent()
    
    # Get schemas for specified tables
    schemas = []
    for table in tables:
        try:
            schema = agent.get_table_schema(table)
            schemas.append(schema)
        except Exception as e:
            pass
    
    # Generate SQL query
    sql_query = agent.generate_sql_query(natural_language_query, schemas)
    
    return {
        "sql_query": sql_query,
        "tables": tables
    }

@mcp.tool()
def sql_execute_query(query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute a SQL query."""
    agent = get_sql_agent()
    return agent.execute_query(query, params)

# === Document Processor Tools ===

@mcp.tool()
def process_document(file_path: str, chunk_size: int = 1000) -> Dict[str, Any]:
    """Process a document and generate embeddings."""
    agent = get_doc_processor()
    chunks = agent.process_document(file_path, chunk_size)
    return {
        "status": "processed",
        "file_path": file_path,
        "chunk_count": len(chunks),
        "first_chunk_sample": chunks[0]["text"][:100] + "..." if chunks else ""
    }

# === Resources ===

@mcp.resource("agent-state://{agent_type}")
def get_agent_state(agent_type: str) -> str:
    """Get the current state of an agent."""
    if agent_type == "sql":
        return json.dumps(get_sql_agent().get_agent_state(), indent=2)
    elif agent_type == "document":
        return json.dumps(get_doc_processor().get_agent_state(), indent=2)
    else:
        return json.dumps({"error": f"Unknown agent type: {agent_type}"})

@mcp.resource("agent-context://{agent_type}/{session_id}")
def get_agent_context(agent_type: str, session_id: str) -> str:
    """Get the context for a specific agent session."""
    context = {}
    
    if agent_type == "sql":
        agent = get_sql_agent()
        if agent.context["session_id"] == session_id:
            context = agent.get_context()
    elif agent_type == "document":
        agent = get_doc_processor()
        if agent.context["session_id"] == session_id:
            context = agent.get_context()
            
    return json.dumps(context, indent=2)

@mcp.resource("database-tables://")
def get_database_tables() -> str:
    """Get the list of available database tables."""
    agent = get_sql_agent()
    tables = agent.get_agent_state().get("available_tables", [])
    return json.dumps(tables, indent=2)

# === Prompts ===

@mcp.prompt()
def generate_sql_prompt(query: str) -> str:
    """Create a natural language to SQL prompt."""
    return f"""
    Given the following tables in the database:
    {json.dumps(get_sql_agent().get_agent_state().get("available_tables", []), indent=2)}
    
    Generate a SQL query that answers this question: {query}
    
    Make sure to explain your reasoning.
    """

@mcp.prompt()
def document_analysis_prompt(file_path: str) -> str:
    """Create a document analysis prompt."""
    agent = get_doc_processor()
    state = agent.get_agent_state()
    
    return f"""
    You are analyzing a document at: {file_path}
    
    The document was processed into {state.get("total_chunks", 0)} chunks.
    
    Please provide:
    1. A summary of the document
    2. Key entities and concepts
    3. Potential insights or action items
    """

# Function to run the server
def run_server(host="0.0.0.0", port=8080):
    """Run the MCP server."""
    # Set the OpenAI API key if not already set
    if "OPENAI_API_KEY" not in os.environ:
        from dotenv import load_dotenv
        load_dotenv()
    
    # Run the MCP server
    print(f"Starting MCP Agent Server on http://{host}:{port}")
    mcp.run(host=host, port=port)

# Start the server if this file is run directly
if __name__ == "__main__":
    run_server() 