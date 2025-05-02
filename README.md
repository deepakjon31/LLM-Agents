# Agentic RAG Platform

A full-stack application for Agentic RAG with Multi-component Prompting (MCP) for SQL Agents and Document Agents using OpenAI LLM model and Postgres Vector DB.

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
     POSTGRES_DB=agentic_rag
     MONGO_CONNECTION_STRING=mongodb://localhost:27017/
     MONGO_DB_NAME=agentic_rag
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

## License

MIT