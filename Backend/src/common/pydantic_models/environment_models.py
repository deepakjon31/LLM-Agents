import dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

dotenv.load_dotenv()

class LLMModelsSettings(BaseSettings):
    """LLM models settings"""
    model_config = SettingsConfigDict(env_prefix="AI_")
    grok_api_key: str

class DatabaseSettings(BaseSettings):
    """Database settings"""
    model_config = SettingsConfigDict(env_prefix="DB_")
    DATABASE_DIALECT: str
    DATABASE_HOSTNAME: str
    DATABASE_NAME: str
    DATABASE_PASSWORD: str
    DATABASE_PORT: int
    DATABASE_USERNAME: str
    DEBUG_MODE: bool
