#!/usr/bin/env python3
"""
Example script demonstrating the use of MCP with SQL and Document Processor agents.

This script shows how to:
1. Connect to the MCP server
2. Use SQL agent functionality through MCP
3. Use Document Processor functionality through MCP
4. Access MCP resources and prompts

To run this example:
1. Start the MCP server: python -m src.agents.mcp_helpers
2. Run this script: python examples/mcp_example.py
"""

import asyncio
import json
import os
import sys
from dotenv import load_dotenv
from pathlib import Path

# Add the parent directory to the path so we can import modules
sys.path.append(str(Path(__file__).parent.parent))

from src.agents.mcp_helpers import AgentMCPClient


async def sql_agent_example(client: AgentMCPClient):
    """Example demonstrating SQL agent functionality through MCP."""
    print("\n=== SQL Agent Example ===")
    
    # Connect to a SQLite database
    connection_string = "sqlite:///example.db"
    print(f"Connecting to database: {connection_string}")
    result = await client.connect_to_database(connection_string)
    print(f"Connection result: {json.dumps(result, indent=2)}")
    
    # Create a sample table if it doesn't exist
    create_table_query = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        signup_date TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT 1
    )
    """
    print("Creating sample table")
    await client.execute_sql_query(create_table_query)
    
    # Insert sample data
    insert_data_query = """
    INSERT INTO users (name, email, signup_date, active)
    VALUES 
        ('John Doe', 'john@example.com', '2023-01-15', 1),
        ('Jane Smith', 'jane@example.com', '2023-02-20', 1),
        ('Bob Johnson', 'bob@example.com', '2023-03-10', 0),
        ('Alice Brown', 'alice@example.com', '2023-04-05', 1),
        ('Charlie Wilson', 'charlie@example.com', '2023-05-12', 0)
    ON CONFLICT(id) DO NOTHING
    """
    print("Inserting sample data")
    await client.execute_sql_query(insert_data_query)
    
    # Get table schema
    print("Getting table schema for 'users'")
    schema = await client.get_table_schema("users")
    print(f"Table schema:\n{json.dumps(schema, indent=2)}")
    
    # Generate SQL query from natural language
    nl_query = "Find all active users who signed up in 2023"
    print(f"Generating SQL query for: '{nl_query}'")
    query_result = await client.generate_sql_query(nl_query, ["users"])
    print(f"Generated query:\n{json.dumps(query_result, indent=2)}")
    
    # Execute the generated query
    sql_query = query_result["sql_query"]
    print(f"Executing query: {sql_query}")
    execution_result = await client.execute_sql_query(sql_query)
    print(f"Query result:\n{json.dumps(execution_result, indent=2)}")
    
    # Get SQL prompt
    print("Getting SQL prompt")
    prompt = await client.get_sql_prompt("List users who signed up in January")
    print(f"SQL Prompt:\n{prompt}")


async def document_processor_example(client: AgentMCPClient):
    """Example demonstrating Document Processor functionality through MCP."""
    print("\n=== Document Processor Example ===")
    
    # Create a sample text file
    sample_file = "example_document.txt"
    with open(sample_file, "w") as f:
        f.write("""
        # Sample Document
        
        This is a sample document for testing the Document Processor agent with MCP.
        
        ## Key Points
        
        1. The Document Processor can handle various file formats
        2. It breaks down documents into chunks
        3. It generates embeddings for semantic search
        4. It can be accessed through the Model Context Protocol
        
        ## Example Code
        
        ```python
        from document_processor import DocumentProcessor
        
        processor = DocumentProcessor(api_key)
        chunks = processor.process_document("sample.pdf")
        ```
        
        ## Conclusion
        
        The integration with MCP provides a standardized way to access document processing capabilities.
        """)
    
    # Process the document
    print(f"Processing document: {sample_file}")
    result = await client.process_document(sample_file)
    print(f"Processing result:\n{json.dumps(result, indent=2)}")
    
    # Get document analysis prompt
    print("Getting document analysis prompt")
    prompt = await client.get_document_analysis_prompt(sample_file)
    print(f"Document Analysis Prompt:\n{prompt}")
    
    # Get agent state
    print("Getting document processor agent state")
    state = await client.get_agent_state("document")
    print(f"Agent state:\n{json.dumps(state, indent=2)}")
    
    # Clean up
    os.remove(sample_file)


async def main():
    """Main function that runs the examples."""
    # Load environment variables
    load_dotenv()
    
    # Set the MCP server URL
    mcp_url = os.environ.get("MCP_SERVER_URL", "http://localhost:8080")
    
    print(f"Connecting to MCP server: {mcp_url}")
    client = AgentMCPClient(server_url=mcp_url)
    
    try:
        # Connect to the MCP server
        await client.connect()
        
        # Run SQL agent example
        await sql_agent_example(client)
        
        # Run Document Processor example
        await document_processor_example(client)
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        # Disconnect from the MCP server
        await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main()) 