from typing import Dict, Any, Optional, List
from datetime import datetime
import json

class BaseAgent:
    def __init__(self):
        self.context: Dict[str, Any] = {
            "session_id": None,
            "timestamp": None,
            "conversation_history": [],
            "agent_state": {},
            "metadata": {}
        }
    
    def initialize_context(self, session_id: str) -> None:
        """Initialize the context for a new session."""
        self.context["session_id"] = session_id
        self.context["timestamp"] = datetime.now().isoformat()
        self.context["conversation_history"] = []
        self.context["agent_state"] = {}
        self.context["metadata"] = {}
    
    def update_context(self, 
                      message: str, 
                      role: str = "user",
                      metadata: Optional[Dict[str, Any]] = None) -> None:
        """Update the context with a new message and metadata."""
        self.context["conversation_history"].append({
            "role": role,
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        
        if metadata:
            self.context["metadata"].update(metadata)
    
    def get_context(self) -> Dict[str, Any]:
        """Get the current context."""
        return self.context
    
    def clear_context(self) -> None:
        """Clear the current context."""
        self.context = {
            "session_id": None,
            "timestamp": None,
            "conversation_history": [],
            "agent_state": {},
            "metadata": {}
        }
    
    def save_context(self, file_path: str) -> None:
        """Save the current context to a file."""
        with open(file_path, 'w') as f:
            json.dump(self.context, f, indent=2)
    
    def load_context(self, file_path: str) -> None:
        """Load context from a file."""
        with open(file_path, 'r') as f:
            self.context = json.load(f)
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get the conversation history."""
        return self.context["conversation_history"]
    
    def update_agent_state(self, state: Dict[str, Any]) -> None:
        """Update the agent's state."""
        self.context["agent_state"].update(state)
    
    def get_agent_state(self) -> Dict[str, Any]:
        """Get the agent's current state."""
        return self.context["agent_state"] 