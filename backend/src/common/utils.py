from bson import ObjectId
from datetime import datetime
import json

def serialize_mongo_id(doc):
    """Convert MongoDB ObjectId to string in a document."""
    if doc is None:
        return None
        
    if isinstance(doc, list):
        return [serialize_mongo_id(item) for item in doc]
        
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id' and isinstance(value, ObjectId):
                result['id'] = str(value)
            else:
                result[key] = serialize_mongo_id(value)
        return result
        
    if isinstance(doc, ObjectId):
        return str(doc)
        
    if isinstance(doc, datetime):
        return doc.isoformat()
        
    return doc

class MongoJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles MongoDB ObjectId and datetime objects."""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj) 