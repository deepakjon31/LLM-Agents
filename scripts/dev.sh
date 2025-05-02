#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Agentic RAG Development Setup${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found! Please install Docker and try again.${NC}"
    exit 1
fi

# Docker Compose check with fallback to docker-compose
DOCKER_COMPOSE="docker compose"
if ! $DOCKER_COMPOSE version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    if ! $DOCKER_COMPOSE version &> /dev/null; then
        echo -e "${RED}Docker Compose not found! Please install Docker Compose and try again.${NC}"
        exit 1
    fi
fi

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Development mode selection
echo -e "${YELLOW}Select development mode:${NC}"
echo "1) Docker Compose (recommended for local development)"
echo "2) Kubernetes with Skaffold (advanced)"
echo "3) Kubernetes with MCP (Model Context Protocol) support"
read -r dev_mode

if [ "$dev_mode" == "1" ]; then
    echo -e "${GREEN}Starting with Docker Compose...${NC}"
    # Check if .env file exists, create if not
    if [ ! -f backend/.env ]; then
        echo "Creating .env file for backend..."
        cp backend/.env.example backend/.env 2>/dev/null || echo "OPENAI_API_KEY=your-key-here" > backend/.env
    fi
    
    # Build and start services
    $DOCKER_COMPOSE up -d
    
    echo -e "${GREEN}Services started!${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:8000"
    echo "To view logs: $DOCKER_COMPOSE logs -f"
    echo "To stop: $DOCKER_COMPOSE down"
    
elif [ "$dev_mode" == "2" ]; then
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}kubectl not found! Please install kubectl and try again.${NC}"
        exit 1
    fi

    # Check for Kubernetes cluster
    if ! kubectl get nodes &> /dev/null; then
        echo -e "${RED}No Kubernetes cluster found or kubectl not configured!${NC}"
        echo -e "Enable Kubernetes in Docker Desktop or set up minikube/kind"
        exit 1
    fi

    # Check for skaffold
    if ! command -v skaffold &> /dev/null; then
        echo -e "${YELLOW}Skaffold not found. Would you like to install it? (y/n)${NC}"
        read -r install_skaffold
        if [[ $install_skaffold == "y" ]]; then
            echo "Installing skaffold..."
            # For macOS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install skaffold
            else
                curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
                chmod +x skaffold
                sudo mv skaffold /usr/local/bin
            fi
        else
            echo -e "${RED}Skaffold is required for Kubernetes development mode.${NC}"
            exit 1
        fi
    fi

    # Create namespace if it doesn't exist
    if ! kubectl get namespace agentic-rag &> /dev/null; then
        echo "Creating Kubernetes namespace: agentic-rag"
        kubectl create namespace agentic-rag
    fi

    # Update hostPath in Kubernetes deployments to use absolute paths
    echo "Updating hostPath in k8s deployments..."
    BACKEND_PATH=$(pwd)/backend
    FRONTEND_PATH=$(pwd)/frontend

    # Use sed to replace the placeholder paths with actual paths
    sed -i.bak "s|/path/to/local/backend|$BACKEND_PATH|g" k8s/backend/deployment.yaml
    sed -i.bak "s|/path/to/local/frontend|$FRONTEND_PATH|g" k8s/frontend/deployment.yaml
    rm -f k8s/backend/deployment.yaml.bak k8s/frontend/deployment.yaml.bak

    # Check for OPENAI_API_KEY
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}OPENAI_API_KEY environment variable not found.${NC}"
        echo -e "Please enter your OpenAI API key:"
        read -r openai_key
        export OPENAI_API_KEY="$openai_key"
        
        # Update the encoded secret
        ENCODED_KEY=$(echo -n "$openai_key" | base64)
        sed -i.bak "s|WU9VUl9PUEVOQUlfQVBJX0tFWQ==|$ENCODED_KEY|g" k8s/secrets.yaml
        rm -f k8s/secrets.yaml.bak
    fi
    
    echo -e "${GREEN}Starting with Skaffold...${NC}"
    skaffold dev --port-forward

elif [ "$dev_mode" == "3" ]; then
    echo -e "${GREEN}Setting up MCP development environment...${NC}"
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}kubectl is not installed. Please install kubectl first.${NC}"
        exit 1
    fi

    # Check if minikube is installed
    if ! command -v minikube &> /dev/null; then
        echo -e "${RED}minikube is not installed. Please install minikube first.${NC}"
        exit 1
    fi

    # Start minikube if it's not running
    if ! minikube status | grep -q "Running"; then
        echo -e "${YELLOW}Starting minikube...${NC}"
        minikube start
    fi

    # Set environment variables for kustomize
    export BACKEND_CODE_PATH="${PROJECT_DIR}/backend"
    export FRONTEND_CODE_PATH="${PROJECT_DIR}/frontend"

    # Create namespace if it doesn't exist
    if ! kubectl get namespace agentic-rag &> /dev/null; then
        echo -e "${YELLOW}Creating namespace agentic-rag...${NC}"
        kubectl create namespace agentic-rag
    fi

    # Apply kustomize configuration
    echo -e "${YELLOW}Applying Kubernetes configuration...${NC}"
    kubectl apply -k "${PROJECT_DIR}/k8s"

    # Set up port forwarding for development
    echo -e "${YELLOW}Setting up port forwarding...${NC}"
    kubectl -n agentic-rag port-forward svc/frontend 3000:3000 &
    kubectl -n agentic-rag port-forward svc/backend 8000:8000 &
    kubectl -n agentic-rag port-forward svc/mcp 8080:8080 &

    # Add hosts entries to /etc/hosts if they don't exist
    if ! grep -q "app.local" /etc/hosts; then
        echo -e "${YELLOW}Adding hosts entries to /etc/hosts...${NC}"
        echo "127.0.0.1 app.local api.app.local mcp.app.local" | sudo tee -a /etc/hosts
    fi

    echo -e "${GREEN}MCP development environment setup complete!${NC}"
    echo -e "${GREEN}Frontend URL: http://app.local:3000${NC}"
    echo -e "${GREEN}Backend API URL: http://api.app.local:8000${NC}"
    echo -e "${GREEN}MCP URL: http://mcp.app.local:8080${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop port forwarding${NC}"

    # Wait for Ctrl+C
    wait
else
    echo -e "${RED}Invalid selection.${NC}"
    exit 1
fi 