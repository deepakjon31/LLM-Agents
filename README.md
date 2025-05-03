# AI Chatbot

A full-stack application for AI Chatbot with Multi-component Prompting (MCP) for SQL Agents and Document Agents using OpenAI LLM model and Postgres Vector DB.

## Features

- **Authentication**: User login, logout, and signup with mobile number and password
- **SQL Agent**: Query SQL databases using natural language
- **Document Agent**: Chat with uploaded documents using RAG approach
- **Interactive Visualizations**: Display graphs and charts for data queries
- **History Management**: View and manage chat history
- **Document Management**: Upload, view, and delete documents

## Technology Stack

### Frontend (Next.js)
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- NextAuth.js for authentication
- Chart.js for data visualization
- Axios for API requests

### Backend (FastAPI)
- FastAPI for API endpoints
- SQLAlchemy for database ORM
- MongoDB for vector storage
- PostgreSQL for relational data
- OpenAI for LLM capabilities
- LangChain for RAG framework

## Project Structure

```
/
├── backend/               # FastAPI backend 
│   ├── src/               # Source code
│   │   ├── apis/          # API endpoints
│   │   ├── agents/        # SQL and document agents
│   │   └── common/        # Shared utilities and models
│   ├── Dockerfile         # Backend Docker configuration
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js frontend
│   ├── src/               # Source code
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── providers/     # Context providers
│   │   └── types/         # TypeScript type definitions
│   └── package.json       # Node dependencies
├── k8s/                   # Kubernetes configuration files
├── scripts/               # Development and utility scripts
└── docker-compose.yaml    # Docker compose configuration
```

## Development Setup

1. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create a .env file with necessary environment variables
   uvicorn src.main:app --reload
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   # Create a .env.local file with necessary environment variables
   npm run dev
   ```

3. **Using Development Scripts**:
   ```bash
   # For a guided setup experience:
   ./scripts/dev.sh
   ```

4. **Environment Variables**:
   - Backend (.env):
     ```
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=password
     POSTGRES_SERVER=localhost
     POSTGRES_PORT=5432
     POSTGRES_DB=ai_chatbot
     MONGO_CONNECTION_STRING=mongodb://localhost:27017/
     MONGO_DB_NAME=ai_chatbot
     SECRET_KEY=your-secret-key
     OPENAI_API_KEY=your-openai-api-key
     ```
   
   - Frontend (.env.local):
     ```
     NEXTAUTH_URL=http://localhost:3000
     NEXTAUTH_SECRET=your-secret-key
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```

## Docker Deployment

```bash
docker-compose up -d
```

## MCP Integration

This project integrates the Model Context Protocol (MCP) to standardize how our applications provide context to LLMs. The MCP implementation allows for seamless interaction between the frontend, backend, and AI models.

### MCP Architecture

The MCP integration is implemented as a service within our backend, located in the `backend/src/agents/mcp_helpers` directory. This implementation provides:

1. An MCP server that exposes SQL and Document processing capabilities
2. An MCP client for interacting with the server
3. REST API endpoints for accessing MCP functionality

### Running with MCP

To run the application with MCP support:

```bash
# Start the development environment with MCP support
./scripts/dev.sh
```

Then select option 3 for "Kubernetes with MCP (Model Context Protocol) support" when prompted.

This script will:
1. Start a Kubernetes development environment
2. Configure port forwarding for all services
3. Set up the necessary host entries

### MCP API Endpoints

The following MCP API endpoints are available:

#### SQL Agent
- `POST /mcp/sql/connect` - Connect to a database
- `POST /mcp/sql/schema` - Get schema for a table
- `POST /mcp/sql/generate` - Generate SQL from natural language
- `POST /mcp/sql/execute` - Execute SQL queries

#### Document Processor
- `POST /mcp/document/process` - Process documents and generate embeddings

#### Resources
- `GET /mcp/resources/agent-state/{agent_type}` - Get the current state of an agent
- `GET /mcp/resources/agent-context/{agent_type}/{session_id}` - Get context for a specific agent session
- `GET /mcp/resources/database-tables` - Get available database tables

#### Prompts
- `POST /mcp/prompts/sql` - Get SQL prompts
- `POST /mcp/prompts/document` - Get document analysis prompts

For more details on the MCP implementation, please see the [MCP README](backend/README-MCP.md).

## License

MIT