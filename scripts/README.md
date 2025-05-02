# Development Scripts

This directory contains utility scripts for development, deployment, and maintenance of the Agentic RAG platform.

## Available Scripts

### `dev.sh`

Development environment setup script. Provides options for:

- Docker Compose local development (recommended for most development)
- Kubernetes with Skaffold (advanced development with K8s)

Usage:
```bash
./scripts/dev.sh
```

The script will:
1. Check prerequisites (Docker, Kubernetes, etc.)
2. Guide you through selecting a development mode
3. Set up the necessary environment
4. Start the selected development environment

### Adding New Scripts

When adding new scripts to this directory:

1. Make sure to make them executable: `chmod +x scripts/your-script.sh`
2. Document them in this README
3. Follow the established patterns for error handling and user feedback 