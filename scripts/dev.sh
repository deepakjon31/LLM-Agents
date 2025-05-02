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

# Development mode selection
echo -e "${YELLOW}Select development mode:${NC}"
echo "1) Docker Compose (recommended for local development)"
echo "2) Kubernetes with Skaffold (advanced)"
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
else
    echo -e "${RED}Invalid selection.${NC}"
    exit 1
fi 