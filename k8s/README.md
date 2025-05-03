# Kubernetes Setup for AI Chatbot

This directory contains Kubernetes configuration files for deploying the AI Chatbot platform.

## Directory Structure

- `backend/` - Backend API service configuration
- `frontend/` - Frontend application configuration
- `databases/` - Database configurations (PostgreSQL, MongoDB)
- `patches/` - Kustomize patches for resource customization
- `secrets.yaml` - Secret resources (encoded for development)
- `ingress.yaml` - Ingress configuration for external access
- `kustomization.yaml` - Kustomize configuration

## Development Setup

For local development with Kubernetes:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled
2. Install [Skaffold](https://skaffold.dev/docs/install/)
3. Run the development script:

```bash
./scripts/dev.sh
```

Select option 2 for Kubernetes with Skaffold.

## Manual Deployment

If you prefer to deploy manually:

```bash
# Apply all resources
kubectl apply -k k8s/

# Check deployment status
kubectl get pods -n agentic-rag

# Port forward services for local access
kubectl port-forward svc/frontend 3000:3000 -n agentic-rag
kubectl port-forward svc/backend 8000:8000 -n agentic-rag
```

## Accessing the Application

- Frontend: http://app.local (add to /etc/hosts) or via port-forward
- Backend API: http://api.app.local (add to /etc/hosts) or via port-forward

## Customization

- Resource limits can be adjusted in `patches/resources-patch.yaml`
- Database configurations can be modified in `databases/`
- Environment variables can be added in `configMapGenerator` in `kustomization.yaml`

## Production Deployment

For production deployment, you should:

1. Use proper secrets management (HashiCorp Vault, AWS Secrets Manager, etc.)
2. Set up proper ingress with TLS
3. Configure resource limits appropriate for your environment
4. Use a container registry for images 