import dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

dotenv.load_dotenv()

class LLMModelsSettings(BaseSettings):
    """LLM models settings"""
    model_config = SettingsConfigDict(env_prefix="AI_")
    grok_api_key: str
