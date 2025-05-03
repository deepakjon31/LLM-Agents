# Development Scripts

This directory contains utility scripts for development, deployment, and maintenance of the AI Chatbot platform.

## Available Scripts

### `dev.sh`

Development environment setup script. Provides options for:

- Docker Compose local development (recommended for most development)
- Kubernetes with Skaffold (advanced development with K8s)
- Kubernetes with MCP (Model Context Protocol) support

Usage:
```bash
./scripts/dev.sh
```

The script will:
1. Check prerequisites (Docker, Kubernetes, etc.)
2. Guide you through selecting a development mode
3. Set up the necessary environment
4. Start the selected development environment

#### MCP Development Mode

The MCP (Model Context Protocol) development mode:
- Sets up the backend with MCP server enabled
- Configures Kubernetes with appropriate port forwarding
- Sets up local domain names for easy access (app.local, api.app.local, mcp.app.local)
- Enables hot-reloading for MCP code changes

### Adding New Scripts

When adding new scripts to this directory:

1. Make sure to make them executable: `chmod +x scripts/your-script.sh`
2. Document them in this README
3. Follow the established patterns for error handling and user feedback 