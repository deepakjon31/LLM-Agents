import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import axios from 'axios';

// Helper function to get MCP server URL
const getMcpUrl = () => {
  // Use environment variable in production or default for development
  return process.env.NEXT_PUBLIC_MCP_URL || 'http://mcp.app.local';
};

// Proxy request to MCP server
export async function POST(request: NextRequest) {
  try {
    // Get auth session
    const session = await getServerSession();
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Call MCP service 
    const response = await axios.post(
      `${getMcpUrl()}${request.nextUrl.pathname}`, 
      body,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return response from MCP server
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('MCP API error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' }, 
      { status: error.response?.status || 500 }
    );
  }
}

// Handle GET requests
export async function GET(request: NextRequest) {
  try {
    // Get auth session
    const session = await getServerSession();
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Call MCP service
    const response = await axios.get(
      `${getMcpUrl()}${request.nextUrl.pathname}${request.nextUrl.search}`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      }
    );
    
    // Return response from MCP server
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('MCP API error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' }, 
      { status: error.response?.status || 500 }
    );
  }
} 