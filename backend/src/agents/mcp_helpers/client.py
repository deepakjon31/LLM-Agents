import asyncio
import json
from typing import Dict, Any, List, Optional
from mcp import ClientSession, HttpServerParameters, types

class AgentMCPClient:
    """Client for interacting with Agent MCP Server."""
    
    def __init__(self, server_url: str = "http://localhost:8080"):
        """Initialize the MCP client.
        
        Args:
            server_url: URL of the MCP server
        """
        self.server_url = server_url
        self.session = None
        self.server_params = HttpServerParameters(url=server_url)
    
    async def connect(self):
        """Connect to the MCP server."""
        # Create a new client session
        from mcp.client.http import http_client
        
        async with http_client(self.server_params) as (read, write):
            self.session = ClientSession(read, write)
            await self.session.initialize()
            capabilities = await self.session.get_capabilities()
            
            print(f"Connected to MCP server: {self.server_url}")
            print(f"Server capabilities: {capabilities}")
            
            return self.session
    
    async def disconnect(self):
        """Disconnect from the MCP server."""
        if self.session:
            await self.session.shutdown()
            self.session = None
    
    # === SQL Agent Functions ===
    
    async def connect_to_database(self, connection_string: str) -> Dict[str, Any]:
        """Connect to a database using the SQL agent."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        result = await self.session.call_tool(
            "sql_connect", 
            arguments={"connection_string": connection_string}
        )
        return json.loads(result)
    
    async def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get the schema of a database table."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        result = await self.session.call_tool(
            "sql_get_table_schema", 
            arguments={"table_name": table_name}
        )
        return json.loads(result)
    
    async def generate_sql_query(self, query: str, tables: List[str]) -> Dict[str, Any]:
        """Generate a SQL query from natural language."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        result = await self.session.call_tool(
            "sql_generate_query", 
            arguments={
                "natural_language_query": query,
                "tables": tables
            }
        )
        return json.loads(result)
    
    async def execute_sql_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a SQL query."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        result = await self.session.call_tool(
            "sql_execute_query", 
            arguments={
                "query": query,
                "params": params
            }
        )
        return json.loads(result)
    
    # === Document Processor Functions ===
    
    async def process_document(self, file_path: str, chunk_size: int = 1000) -> Dict[str, Any]:
        """Process a document and generate embeddings."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        result = await self.session.call_tool(
            "process_document", 
            arguments={
                "file_path": file_path,
                "chunk_size": chunk_size
            }
        )
        return json.loads(result)
    
    # === Resource Access Functions ===
    
    async def get_agent_state(self, agent_type: str) -> Dict[str, Any]:
        """Get the current state of an agent."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        content, _ = await self.session.read_resource(f"agent-state://{agent_type}")
        return json.loads(content)
    
    async def get_agent_context(self, agent_type: str, session_id: str) -> Dict[str, Any]:
        """Get the context for a specific agent session."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        content, _ = await self.session.read_resource(f"agent-context://{agent_type}/{session_id}")
        return json.loads(content)
    
    async def get_available_tables(self) -> List[str]:
        """Get the list of available database tables."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        content, _ = await self.session.read_resource("database-tables://")
        return json.loads(content)
    
    # === Prompt Functions ===
    
    async def get_sql_prompt(self, query: str) -> str:
        """Get a SQL generation prompt."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        prompt = await self.session.get_prompt(
            "generate_sql_prompt", 
            arguments={"query": query}
        )
        return prompt.messages[0].content.text
    
    async def get_document_analysis_prompt(self, file_path: str) -> str:
        """Get a document analysis prompt."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server")
        
        prompt = await self.session.get_prompt(
            "document_analysis_prompt", 
            arguments={"file_path": file_path}
        )
        return prompt.messages[0].content.text 