"""
Entry point for running the MCP server directly.

Usage:
    python -m src.agents.mcp_helpers
"""

import argparse
import os
import uvicorn
from dotenv import load_dotenv
from .server import run_server

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run the MCP server for backend agents")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind the server to")
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Make sure OpenAI API key is set
    if "OPENAI_API_KEY" not in os.environ:
        print("Warning: OPENAI_API_KEY environment variable not set")
    
    # Get the FastAPI app from run_server
    app = run_server()
    
    # Start the uvicorn server
    print(f"Starting MCP server on http://{args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)

if __name__ == "__main__":
    main() 