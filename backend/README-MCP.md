# Model Context Protocol (MCP) for Backend Agents

This implementation integrates the [Model Context Protocol](https://modelcontextprotocol.io/introduction) with the backend agents to provide a standardized way for LLMs to interact with SQL and Document processing capabilities.

## Overview

MCP is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications, providing a standardized way to connect AI models to different data sources and tools.

This implementation provides:

1. An MCP server that exposes SQL and Document processing capabilities
2. An MCP client for interacting with the server
3. REST API endpoints for accessing MCP functionality
4. Example code demonstrating usage

## Directory Structure

The MCP implementation is located in the `backend/src/agents/mcp_helpers` directory:

```
backend/src/agents/mcp_helpers/
├── __init__.py         # Module initialization
├── __main__.py         # Entry point for running the server
├── api.py              # FastAPI router for MCP endpoints
├── client.py           # MCP client implementation
└── server.py           # MCP server implementation
```

## Setup

### Install Dependencies

First, add MCP to your requirements:

```bash
pip install -r requirements.txt
```

### Environment Variables

Set the following environment variables:

```
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional
MCP_SERVER_URL=http://localhost:8080
START_MCP_SERVER=true  # Auto-start MCP server with main API
```

## Usage

### Starting the MCP Server

You can start the MCP server directly:

```bash
python -m src.agents.mcp_helpers
```

This will start the server at http://localhost:8080.

You can also customize the host and port:

```bash
python -m src.agents.mcp_helpers --host 127.0.0.1 --port 8888
```

Alternatively, you can set `START_MCP_SERVER=true` in your environment to automatically start the MCP server when running the main FastAPI application.

### Using the MCP Client

```python
from src.agents.mcp_helpers import AgentMCPClient
import asyncio

async def example():
    client = AgentMCPClient(server_url="http://localhost:8080")
    
    try:
        # Connect to the MCP server
        await client.connect()
        
        # Use SQL Agent functionality
        await client.connect_to_database("sqlite:///example.db")
        schema = await client.get_table_schema("users")
        query_result = await client.generate_sql_query(
            "Find all active users", 
            ["users"]
        )
        data = await client.execute_sql_query(query_result["sql_query"])
        
        # Use Document Processor functionality
        result = await client.process_document("document.pdf")
        
    finally:
        await client.disconnect()

asyncio.run(example())
```

### Using the REST API

The implementation includes FastAPI endpoints for accessing MCP functionality through HTTP:

```bash
# Start the FastAPI server
python -m src.main
```

Then you can make API calls to the MCP endpoints:

```bash
# Connect to a database
curl -X POST "http://localhost:8000/mcp/sql/connect" \
  -H "Content-Type: application/json" \
  -d '{"connection_string": "sqlite:///example.db"}'

# Generate SQL from natural language
curl -X POST "http://localhost:8000/mcp/sql/generate" \
  -H "Content-Type: application/json" \
  -d '{"query": "Find all active users", "tables": ["users"]}'

# Process a document
curl -X POST "http://localhost:8000/mcp/document/process" \
  -H "Content-Type: application/json" \
  -d '{"file_path": "document.pdf"}'
```

## MCP Features Implemented

### Tools

- **SQL Agent Tools**:
  - `sql_connect`: Connect to a database
  - `sql_get_table_schema`: Get schema for a table
  - `sql_generate_query`: Generate SQL from natural language
  - `sql_execute_query`: Execute SQL queries

- **Document Processor Tools**:
  - `process_document`: Process documents and generate embeddings

### Resources

- `agent-state://{agent_type}`: Get the current state of an agent
- `agent-context://{agent_type}/{session_id}`: Get context for a specific agent session
- `database-tables://`: Get available database tables

### Prompts

- `generate_sql_prompt`: Create prompts for SQL generation
- `document_analysis_prompt`: Create prompts for document analysis

## Example Code

See the [example script](examples/mcp_example.py) for a complete demonstration of how to use the MCP implementation with both the SQL Agent and Document Processor.

## Architecture

```
                    ┌───────────────┐
                    │   FastAPI     │
                    │   REST API    │
                    └───────┬───────┘
                            │
                ┌───────────▼───────────┐
                │    MCP Client API     │
                └───────────┬───────────┘
                            │
┌ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                │
│   ┌───────────▼───────────┐           │
    │      MCP Server       │
│   └───────────┬───────────┘           │
                │
│   ┌───────────▼───────────┐           │
    │       BaseAgent       │
│   └───────────┬───────────┘           │
                │
│              ┌┴┐                      │
    ┌──────────┘ └──────────┐
│   │                       │           │
    ▼                       ▼
│┌──────────────┐    ┌──────────────┐   │
 │   SQLAgent   │    │DocumentProcessor│
│└──────────────┘    └──────────────┘   │
                                    
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/introduction)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) 