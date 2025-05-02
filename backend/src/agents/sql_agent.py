from typing import List, Dict, Any, Optional
from openai import OpenAI
import pandas as pd
from sqlalchemy import create_engine, text
import json
from datetime import datetime
from .base_agent import BaseAgent

class SQLAgent(BaseAgent):
    def __init__(self, openai_api_key: str):
        super().__init__()
        self.client = OpenAI(api_key=openai_api_key)
        self.engine = None
        self.update_agent_state({
            "database_connected": False,
            "last_query": None,
            "last_query_result": None,
            "available_tables": [],
            "current_schema": None
        })

    def connect_to_database(self, connection_string: str):
        """Connect to the database using SQLAlchemy and initialize context."""
        self.engine = create_engine(connection_string)
        
        # Initialize MCP context with database connection
        self.initialize_context(f"db_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        # Update agent state with connection info
        self.update_agent_state({
            "database_connected": True,
            "connection_string": connection_string,
            "connection_time": datetime.now().isoformat()
        })
        
        # Update context with system message
        self.update_context(
            "Database connection established",
            role="system",
            metadata={
                "connection_string": connection_string,
                "connection_time": datetime.now().isoformat()
            }
        )
        
        # Load available tables into context
        self._load_available_tables()

    def _load_available_tables(self):
        """Load available tables into the agent's context."""
        if not self.engine:
            raise ValueError("Database connection not established")
        
        with self.engine.connect() as conn:
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = conn.execute(tables_query).fetchall()
            available_tables = [table[0] for table in tables]
            
            self.update_agent_state({
                "available_tables": available_tables
            })
            
            self.update_context(
                "Loaded available tables",
                role="system",
                metadata={"tables": available_tables}
            )

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get schema information for a table and update context."""
        if not self.engine:
            raise ValueError("Database connection not established")
        
        with self.engine.connect() as conn:
            # Get column information
            columns_query = text(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = :table_name
            """)
            columns = conn.execute(columns_query, {"table_name": table_name}).fetchall()
            
            # Get primary key information
            pk_query = text(f"""
                SELECT column_name
                FROM information_schema.key_column_usage
                WHERE table_name = :table_name
                AND constraint_name IN (
                    SELECT constraint_name
                    FROM information_schema.table_constraints
                    WHERE table_name = :table_name
                    AND constraint_type = 'PRIMARY KEY'
                )
            """)
            primary_keys = conn.execute(pk_query, {"table_name": table_name}).fetchall()
            
            # Get foreign key information
            fk_query = text(f"""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.key_column_usage kcu
                JOIN information_schema.constraint_column_usage ccu
                    ON kcu.constraint_name = ccu.constraint_name
                WHERE kcu.table_name = :table_name
                AND kcu.constraint_name IN (
                    SELECT constraint_name
                    FROM information_schema.table_constraints
                    WHERE table_name = :table_name
                    AND constraint_type = 'FOREIGN KEY'
                )
            """)
            foreign_keys = conn.execute(fk_query, {"table_name": table_name}).fetchall()
            
            schema = {
                "table_name": table_name,
                "columns": [{"name": c[0], "type": c[1], "nullable": c[2]} for c in columns],
                "primary_keys": [pk[0] for pk in primary_keys],
                "foreign_keys": [{"column": fk[0], "foreign_table": fk[1], "foreign_column": fk[2]} for fk in foreign_keys]
            }
            
            # Update agent state with current schema
            self.update_agent_state({
                "current_schema": schema
            })
            
            # Update context with schema information
            self.update_context(
                f"Retrieved schema for table {table_name}",
                role="system",
                metadata={"schema": schema}
            )
            
            return schema

    def generate_sql_query(self, natural_language_query: str, table_schemas: List[Dict[str, Any]]) -> str:
        """Generate SQL query from natural language using OpenAI with MCP context."""
        # Update context with user query
        self.update_context(natural_language_query, role="user")
        
        # Prepare MCP context for LLM
        conversation_history = self.get_conversation_history()
        agent_state = self.get_agent_state()
        
        # Build context-aware prompt
        context = {
            "conversation_history": conversation_history[-5:],
            "agent_state": agent_state,
            "table_schemas": table_schemas
        }
        
        prompt = f"""
        Based on the following MCP context, generate a SQL query:
        
        Conversation History:
        {json.dumps([{"role": msg["role"], "content": msg["content"]} for msg in context["conversation_history"]], indent=2)}
        
        Agent State:
        {json.dumps(context["agent_state"], indent=2)}
        
        Table Schemas:
        {json.dumps(context["table_schemas"], indent=2)}
        
        Natural Language Query:
        {natural_language_query}
        
        Generate a SQL query that answers this question.
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a SQL expert. Generate SQL queries based on natural language questions and MCP context."},
                {"role": "user", "content": prompt}
            ]
        )
        
        sql_query = response.choices[0].message.content.strip()
        
        # Update context with generated query
        self.update_context(
            f"Generated SQL query: {sql_query}",
            role="assistant",
            metadata={"sql_query": sql_query}
        )
        
        return sql_query

    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a SQL query and return the results with MCP context updates."""
        if not self.engine:
            raise ValueError("Database connection not established")
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                df = pd.DataFrame(result.fetchall(), columns=result.keys())
                
                # Update agent state with query results
                self.update_agent_state({
                    "last_query": query,
                    "last_query_result": df.to_dict(orient='records')
                })
                
                # Update context with execution results
                self.update_context(
                    f"Executed query: {query}",
                    role="system",
                    metadata={
                        "query": query,
                        "params": params,
                        "result_count": len(df),
                        "columns": list(df.columns)
                    }
                )
                
                return {
                    "success": True,
                    "data": df.to_dict(orient='records'),
                    "columns": list(df.columns),
                    "row_count": len(df)
                }
        except Exception as e:
            # Update context with error information
            self.update_context(
                f"Query execution failed: {str(e)}",
                role="system",
                metadata={"error": str(e)}
            )
            return {
                "success": False,
                "error": str(e)
            }

    def _suggest_visualization(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Suggest appropriate visualization for the query results."""
        # Implementation of visualization suggestion logic
        pass 