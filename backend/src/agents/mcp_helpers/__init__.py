"""
Model Context Protocol (MCP) implementation for backend agents.

This module provides MCP server, client, and API functionality for the backend agents,
allowing standardized interactions with SQL and Document processor agents.
"""

from .client import AgentMCPClient
from .server import mcp, run_server
# Remove the import that causes the circular dependency
# from src.agents.mcp_helpers.api import router as mcp_router

__all__ = ["AgentMCPClient", "mcp", "run_server"] # Remove mcp_router from __all__ 