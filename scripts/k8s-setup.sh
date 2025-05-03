#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Print a message with color
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_message $RED "$1 could not be found. Please install it first."
        exit 1
    fi
}

# Ensure backend Dockerfile.dev exists
ensure_backend_dockerfile() {
    if [ ! -f "$PROJECT_DIR/backend/Dockerfile.dev" ]; then
        print_message $YELLOW "Creating Dockerfile.dev for backend..."
        cat > "$PROJECT_DIR/backend/Dockerfile.dev" << 'EOF'
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 8000
EXPOSE 8080

# Start the application with hot reload
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF
        print_message $GREEN "Backend Dockerfile.dev created!"
    fi
}

# Ensure frontend Dockerfile.dev exists
ensure_frontend_dockerfile() {
    if [ ! -f "$PROJECT_DIR/frontend/Dockerfile.dev" ]; then
        print_message $YELLOW "Creating Dockerfile.dev for frontend..."
        cat > "$PROJECT_DIR/frontend/Dockerfile.dev" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with cache mounting for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application in development mode
CMD ["npm", "run", "dev"]
EOF
        print_message $GREEN "Frontend Dockerfile.dev created!"
    fi
}

# Setup /etc/hosts entries
setup_hosts_entries() {
    if ! grep -q "app.local" /etc/hosts; then
        print_message $YELLOW "Adding hosts entries to /etc/hosts..."
        echo "127.0.0.1 app.local api.app.local mcp.app.local" | sudo tee -a /etc/hosts
    fi
}

# Update secrets in Kubernetes
update_secrets() {
    if [ -z "$OPENAI_API_KEY" ]; then
        print_message $YELLOW "OPENAI_API_KEY environment variable not found."
        echo -e "Please enter your OpenAI API key:"
        read -r openai_key
        export OPENAI_API_KEY="$openai_key"
    else
        print_message $GREEN "Using OPENAI_API_KEY from environment."
    fi
    
    # Update the encoded secret with the environment variable
    ENCODED_KEY=$(echo -n "$OPENAI_API_KEY" | base64)
    sed -i.bak "s|WU9VUl9PUEVOQUlfQVBJX0tFWQ==|$ENCODED_KEY|g" "$PROJECT_DIR/k8s/secrets.yaml"
    rm -f "$PROJECT_DIR/k8s/secrets.yaml.bak"
}

# Update hostPath in Kubernetes deployments
update_paths() {
    print_message $YELLOW "Updating hostPath in Kubernetes deployments..."
    
    BACKEND_PATH="$PROJECT_DIR/backend"
    FRONTEND_PATH="$PROJECT_DIR/frontend"
    
    # Use sed to replace the placeholder paths with actual paths
    sed -i.bak "s|/path/to/local/backend|$BACKEND_PATH|g" "$PROJECT_DIR/k8s/backend/deployment.yaml"
    sed -i.bak "s|/path/to/local/frontend|$FRONTEND_PATH|g" "$PROJECT_DIR/k8s/frontend/deployment.yaml"
    rm -f "$PROJECT_DIR/k8s/backend/deployment.yaml.bak" "$PROJECT_DIR/k8s/frontend/deployment.yaml.bak"
    
    print_message $GREEN "Paths updated successfully!"
}

# Main Script
print_message $GREEN "Setting up Kubernetes development environment"
print_message $GREEN "=============================================="

# Check prerequisites
print_message $YELLOW "Checking prerequisites..."
check_command "docker"
check_command "kubectl"
check_command "skaffold"

# Check for Docker Desktop Kubernetes
if ! kubectl get nodes &> /dev/null; then
    print_message $RED "Kubernetes is not running!"
    print_message $YELLOW "Please enable Kubernetes in Docker Desktop settings."
    exit 1
fi

# Setup namespace
kubectl create namespace agentic-rag --dry-run=client -o yaml | kubectl apply -f -

# Ensure Dockerfiles exist
ensure_backend_dockerfile
ensure_frontend_dockerfile

# Setup hosts entries
setup_hosts_entries

# Update paths in Kubernetes manifests
update_paths

# Update secrets
update_secrets

# Create initial images to use with cacheFrom
print_message $YELLOW "Building initial images for caching..."
docker build -t backend:latest -f "$PROJECT_DIR/backend/Dockerfile.dev" "$PROJECT_DIR/backend" || print_message $YELLOW "Failed to build backend image, but continuing..."
docker build -t frontend:latest -f "$PROJECT_DIR/frontend/Dockerfile.dev" "$PROJECT_DIR/frontend" || print_message $YELLOW "Failed to build frontend image, but continuing..."

# Show help on how to use Skaffold
print_message $GREEN "Setup completed!"
print_message $GREEN "To start development environment, run:"
print_message $YELLOW "cd $PROJECT_DIR && skaffold dev -f scripts/skaffold.yaml --profile=dev --profile=docker-desktop"
print_message $GREEN "For debugging, add --profile=debug"

# Ask if user wants to start Skaffold now
print_message $YELLOW "Do you want to start the development environment now? (y/n)"
read -r start_now
if [[ $start_now == "y" ]]; then
    cd $PROJECT_DIR
    print_message $GREEN "Starting Skaffold development environment..."
    skaffold dev -f scripts/skaffold.yaml --profile=dev --profile=docker-desktop
fi 