import os
import json
from typing import Dict, Any, List, Optional
import numpy as np
from langchain_openai import OpenAI, ChatOpenAI
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import MongoDBAtlasVectorSearch
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from ..common.db.connection import get_mongo_collection


# Initialize OpenAI models
api_key = os.getenv("OPENAI_API_KEY")
embeddings = OpenAIEmbeddings(openai_api_key=api_key)
llm = ChatOpenAI(temperature=0, openai_api_key=api_key, model_name="gpt-4")


class ChartData(BaseModel):
    chart_type: str = Field(description="Type of chart (bar, line, pie, etc.)")
    title: str = Field(description="Title of the chart")
    labels: List[str] = Field(description="Labels for the chart")
    datasets: List[Dict[str, Any]] = Field(description="Dataset for the chart")


class DocumentResponse(BaseModel):
    response: str = Field(description="Text response to the query")
    chart_data: Optional[ChartData] = Field(None, description="Chart data if applicable")
    sources: List[str] = Field(description="Source document chunks")
    no_results: bool = Field(False, description="True if no relevant results found")


def search_similar_chunks(query: str, document_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """Search for similar chunks using vector similarity"""
    # Get MongoDB collection
    vector_collection = get_mongo_collection("vector_store")
    
    # Generate query embedding
    query_embedding = embeddings.embed_query(query)
    
    # Build search query
    search_query = {
        "vector": {"$nearSphere": {"$geometry": {"type": "Point", "coordinates": query_embedding}, "$maxDistance": 0.5}}
    }
    
    # Add document filter if specified
    if document_ids:
        search_query["document_id"] = {"$in": document_ids}
    
    # Execute search
    results = list(vector_collection.find(search_query).limit(5))
    
    return results


def format_sources(sources: List[Dict[str, Any]]) -> List[str]:
    """Format source chunks for display"""
    return [f"Source {i+1}: {source['text'][:200]}..." for i, source in enumerate(sources)]


def determine_if_chart_needed(query: str, context: str) -> bool:
    """Determine if the query might benefit from a chart visualization"""
    chart_keywords = [
        "chart", "graph", "plot", "visualize", "visualization", "trend", 
        "compare", "comparison", "distribution", "percentage", "proportion",
        "statistics", "metrics", "numbers", "count", "amounts"
    ]
    
    # Check if query contains chart keywords
    if any(keyword in query.lower() for keyword in chart_keywords):
        return True
    
    return False


def generate_chart_data(query: str, context: str) -> Optional[Dict[str, Any]]:
    """Generate chart data based on query and context"""
    if not determine_if_chart_needed(query, context):
        return None
    
    # Create prompt for chart data generation
    prompt_template = """
    Based on the following query and context, generate appropriate chart data:
    
    Query: {query}
    
    Context: {context}
    
    If the data contains numerical information that would benefit from visualization, generate chart data in the following format:
    
    chart_type: Type of chart (bar, line, pie, etc.)
    title: Title for the chart
    labels: Labels for the x-axis or categories
    datasets: The data for the chart
    
    If no chart is needed, return null.
    
    {format_instructions}
    """
    
    parser = PydanticOutputParser(pydantic_object=ChartData)
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["query", "context"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    try:
        result = llm.invoke(prompt.format(query=query, context=context))
        chart_data = parser.parse(result)
        return chart_data.dict()
    except Exception as e:
        print(f"Error generating chart data: {e}")
        return None


def query_documents(query: str, document_ids: Optional[List[int]] = None) -> Dict[str, Any]:
    """Query documents using RAG approach"""
    # Search for similar chunks
    similar_chunks = search_similar_chunks(query, document_ids)
    
    # If no relevant chunks found
    if not similar_chunks:
        return {
            "response": "I couldn't find any relevant information in the documents.",
            "no_results": True
        }
    
    # Combine text from chunks for context
    context = "\n\n".join([chunk["text"] for chunk in similar_chunks])
    
    # Create prompt for RAG
    prompt_template = """
    You are an AI assistant helping users find information in their documents.
    Use the following pieces of context to answer the question.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    
    Context:
    {context}
    
    Question: {question}
    
    Answer:
    """
    
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )
    
    # Generate answer
    chain = prompt | llm
    response = chain.invoke({"context": context, "question": query})
    
    # Generate chart data if needed
    chart_data = generate_chart_data(query, context)
    
    # Format sources
    sources = format_sources(similar_chunks)
    
    # Return full response
    return {
        "response": response.content,
        "chart_data": chart_data,
        "sources": sources,
        "no_results": False
    } 