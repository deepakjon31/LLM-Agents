import os
import json
from typing import Dict, Any, List, Optional
import sqlalchemy
from sqlalchemy import inspect, create_engine
from langchain_openai import ChatOpenAI
from langchain.agents import create_sql_agent
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from langchain.prompts import PromptTemplate

from ..common.db.connection import get_mongo_collection


# Initialize OpenAI model
api_key = os.getenv("OPENAI_API_KEY")
llm = ChatOpenAI(temperature=0, openai_api_key=api_key, model_name="gpt-4")


class ChartData(BaseModel):
    chart_type: str = Field(description="Type of chart (bar, line, pie, etc.)")
    title: str = Field(description="Title of the chart")
    labels: List[str] = Field(description="Labels for the chart")
    datasets: List[Dict[str, Any]] = Field(description="Dataset for the chart")


def get_database_connection(database_id: Optional[int] = None, database_type: Optional[str] = None) -> sqlalchemy.engine.Engine:
    """Get database connection from metadata"""
    # For demonstration, using a simple SQLite database
    # In production, would retrieve connection details from MongoDB metadata collection
    
    if database_id:
        # Retrieve connection details from MongoDB
        db_collection = get_mongo_collection("sql_metadata")
        db_info = db_collection.find_one({"id": database_id})
        
        if not db_info:
            raise ValueError(f"Database with ID {database_id} not found")
        
        connection_string = db_info["connection_string"]
    else:
        # Use default database for testing
        connection_string = "sqlite:///./test.db"
    
    return create_engine(connection_string)


def introspect_database(engine: sqlalchemy.engine.Engine) -> Dict[str, Any]:
    """Introspect database schema"""
    inspector = inspect(engine)
    schema_info = {}
    
    # Get all tables
    schema_info["tables"] = {}
    for table_name in inspector.get_table_names():
        schema_info["tables"][table_name] = {
            "columns": [],
            "primary_key": [],
            "foreign_keys": []
        }
        
        # Get columns
        for column in inspector.get_columns(table_name):
            schema_info["tables"][table_name]["columns"].append({
                "name": column["name"],
                "type": str(column["type"]),
                "nullable": column.get("nullable", True)
            })
        
        # Get primary keys
        pk = inspector.get_pk_constraint(table_name)
        schema_info["tables"][table_name]["primary_key"] = pk.get("constrained_columns", [])
        
        # Get foreign keys
        fks = inspector.get_foreign_keys(table_name)
        for fk in fks:
            schema_info["tables"][table_name]["foreign_keys"].append({
                "referred_table": fk["referred_table"],
                "referred_columns": fk["referred_columns"],
                "constrained_columns": fk["constrained_columns"]
            })
    
    return schema_info


def generate_chart_data(query_result: List[Dict[str, Any]], sql_query: str) -> Optional[Dict[str, Any]]:
    """Generate chart data from SQL query results"""
    if not query_result or len(query_result) < 2:  # Need at least a few rows for a chart
        return None
    
    # Create prompt for chart data generation
    prompt_template = """
    Based on the following SQL query and its results, generate appropriate chart data:
    
    SQL Query: {sql_query}
    
    Query Results (first 5 rows): {results}
    
    Generate chart data in the following format:
    
    chart_type: Recommended chart type (bar, line, pie, etc.)
    title: A descriptive title for the chart
    labels: Labels for the x-axis or categories
    datasets: The data for the chart
    
    If no chart is appropriate, return null.
    
    {format_instructions}
    """
    
    parser = PydanticOutputParser(pydantic_object=ChartData)
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["sql_query", "results"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    # Limit results to first 5 rows for prompt
    results_sample = query_result[:5]
    
    try:
        result = llm.invoke(prompt.format(sql_query=sql_query, results=json.dumps(results_sample, indent=2)))
        chart_data = parser.parse(result)
        return chart_data.dict()
    except Exception as e:
        print(f"Error generating chart data: {e}")
        return None


def query_sql_database(prompt: str, database_id: Optional[int] = None, database_type: Optional[str] = None) -> Dict[str, Any]:
    """Query SQL database using LangChain SQL Agent"""
    try:
        # Get database connection
        engine = get_database_connection(database_id, database_type)
        
        # Create SQL database object
        db = SQLDatabase(engine)
        
        # Create SQL toolkit
        toolkit = SQLDatabaseToolkit(db=db, llm=llm)
        
        # Create SQL agent
        agent_executor = create_sql_agent(
            llm=llm,
            toolkit=toolkit,
            verbose=True,
            agent_type="openai-tools",
        )
        
        # Run agent
        result = agent_executor.invoke({"input": prompt})
        
        # Extract SQL query if possible
        sql_query = ""
        for action in result.get("intermediate_steps", []):
            if hasattr(action[0], "tool") and action[0].tool == "sql_db_query":
                sql_query = action[0].tool_input.get("query", "")
                break
        
        # Generate chart data if appropriate
        chart_data = None
        if sql_query and "output" in result and isinstance(result["output"], str):
            # Try to parse the output as JSON if it looks like a result set
            try:
                # Extract JSON from the output if enclosed in ```json and ```
                import re
                json_match = re.search(r"```json\n(.*)\n```", result["output"], re.DOTALL)
                if json_match:
                    query_result = json.loads(json_match.group(1))
                    if isinstance(query_result, list) and len(query_result) > 0:
                        chart_data = generate_chart_data(query_result, sql_query)
            except Exception as e:
                print(f"Error parsing query result JSON: {e}")
        
        # Return response
        return {
            "response": result["output"],
            "chart_data": chart_data,
            "sql_query": sql_query,
            "no_results": "no results" in result["output"].lower() or "couldn't find" in result["output"].lower()
        }
    except Exception as e:
        print(f"Error querying SQL database: {e}")
        return {
            "response": f"An error occurred while querying the database: {str(e)}",
            "error": str(e),
            "no_results": True
        } 