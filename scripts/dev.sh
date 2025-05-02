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

# ------ Helper Functions ------

# Print a message with color
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if a command exists
check_command() {
    local cmd=$1
    local error_msg=$2
    if ! command -v "$cmd" &> /dev/null; then
        print_message "$RED" "$error_msg"
        exit 1
    fi
}

# Setup Kubernetes namespace
setup_k8s_namespace() {
    # Create namespace if it doesn't exist
    if ! kubectl get namespace agentic-rag &> /dev/null; then
        print_message "$YELLOW" "Creating namespace agentic-rag..."
        kubectl create namespace agentic-rag
    fi
}

# Start minikube if needed
ensure_minikube_running() {
    if ! minikube status | grep -q "Running"; then
        print_message "$YELLOW" "Starting minikube..."
        minikube start
    fi
}

# Setup /etc/hosts entries
setup_hosts_entries() {
    if ! grep -q "app.local" /etc/hosts; then
        print_message "$YELLOW" "Adding hosts entries to /etc/hosts..."
        echo "127.0.0.1 app.local api.app.local mcp.app.local" | sudo tee -a /etc/hosts
    fi
}

# Check for kubectl
check_k8s_prerequisites() {
    check_command "kubectl" "kubectl not found! Please install kubectl and try again."

    # Check for Kubernetes cluster
    if ! kubectl get nodes &> /dev/null; then
        print_message "$RED" "No Kubernetes cluster found or kubectl not configured!"
        print_message "$RED" "Enable Kubernetes in Docker Desktop or set up minikube/kind"
        exit 1
    fi
}

# ------ Main Script ------

print_message "$GREEN" "Agentic RAG Development Setup"
echo "=================================================="

# Check prerequisites
print_message "$YELLOW" "Checking prerequisites..."

# Check Docker
check_command "docker" "Docker not found! Please install Docker and try again."

# Docker Compose check with fallback to docker-compose
DOCKER_COMPOSE="docker compose"
if ! $DOCKER_COMPOSE version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    check_command "$DOCKER_COMPOSE" "Docker Compose not found! Please install Docker Compose and try again."
fi

# Development mode selection
print_message "$YELLOW" "Select development mode:"
echo "1) Docker Compose (recommended for local development)"
echo "2) Kubernetes with Skaffold (advanced)"
echo "3) Kubernetes with MCP (Model Context Protocol) support"
read -r dev_mode

case "$dev_mode" in
    "1")
        print_message "$GREEN" "Starting with Docker Compose..."
        # Check if .env file exists, create if not
        if [ ! -f backend/.env ]; then
            echo "Creating .env file for backend..."
            cp backend/.env.example backend/.env 2>/dev/null || echo "OPENAI_API_KEY=your-key-here" > backend/.env
        fi
        
        # Build and start services
        $DOCKER_COMPOSE up -d
        
        print_message "$GREEN" "Services started!"
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:8000"
        echo "To view logs: $DOCKER_COMPOSE logs -f"
        echo "To stop: $DOCKER_COMPOSE down"
        ;;
    
    "2")
        check_k8s_prerequisites
        
        # Check for skaffold
        if ! command -v skaffold &> /dev/null; then
            print_message "$YELLOW" "Skaffold not found. Would you like to install it? (y/n)"
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
                print_message "$RED" "Skaffold is required for Kubernetes development mode."
                exit 1
            fi
        fi

        # Setup namespace
        setup_k8s_namespace

        # Update hostPath in Kubernetes deployments to use absolute paths
        echo "Updating hostPath in k8s deployments..."
        BACKEND_PATH="$PROJECT_DIR/backend"
        FRONTEND_PATH="$PROJECT_DIR/frontend"

        # Use sed to replace the placeholder paths with actual paths
        sed -i.bak "s|/path/to/local/backend|$BACKEND_PATH|g" k8s/backend/deployment.yaml
        sed -i.bak "s|/path/to/local/frontend|$FRONTEND_PATH|g" k8s/frontend/deployment.yaml
        rm -f k8s/backend/deployment.yaml.bak k8s/frontend/deployment.yaml.bak

        # Check for OPENAI_API_KEY
        if [ -z "$OPENAI_API_KEY" ]; then
            print_message "$YELLOW" "OPENAI_API_KEY environment variable not found."
            echo -e "Please enter your OpenAI API key:"
            read -r openai_key
            export OPENAI_API_KEY="$openai_key"
            
            # Update the encoded secret
            ENCODED_KEY=$(echo -n "$openai_key" | base64)
            sed -i.bak "s|WU9VUl9PUEVOQUlfQVBJX0tFWQ==|$ENCODED_KEY|g" k8s/secrets.yaml
            rm -f k8s/secrets.yaml.bak
        fi
        
        print_message "$GREEN" "Starting with Skaffold..."
        skaffold dev --port-forward
        ;;

    "3")
        print_message "$GREEN" "Setting up MCP development environment..."
        
        # Check K8s and minikube
        check_command "kubectl" "kubectl is not installed. Please install kubectl first."
        check_command "minikube" "minikube is not installed. Please install minikube first."
        
        # Start minikube if needed
        ensure_minikube_running

        # Set environment variables for kustomize
        export BACKEND_CODE_PATH="$PROJECT_DIR/backend"
        export FRONTEND_CODE_PATH="$PROJECT_DIR/frontend"

        # Setup namespace
        setup_k8s_namespace

        # Apply kustomize configuration
        print_message "$YELLOW" "Applying Kubernetes configuration..."
        kubectl apply -k "$PROJECT_DIR/k8s"

        # Set up port forwarding for development
        print_message "$YELLOW" "Setting up port forwarding..."
        
        # Use trap to ensure background processes are killed when the script exits
        trap 'kill $(jobs -p) 2>/dev/null' EXIT
        
        kubectl -n agentic-rag port-forward svc/frontend 3000:3000 &
        kubectl -n agentic-rag port-forward svc/backend 8000:8000 &
        kubectl -n agentic-rag port-forward svc/mcp 8080:8080 &

        # Add hosts entries
        setup_hosts_entries

        print_message "$GREEN" "MCP development environment setup complete!"
        print_message "$GREEN" "Frontend URL: http://app.local:3000"
        print_message "$GREEN" "Backend API URL: http://api.app.local:8000"
        print_message "$GREEN" "MCP URL: http://mcp.app.local:8080"
        print_message "$YELLOW" "Press Ctrl+C to stop port forwarding"

        # Wait for Ctrl+C
        wait
        ;;
    
    *)
        print_message "$RED" "Invalid selection."
        exit 1
        ;;
esac 