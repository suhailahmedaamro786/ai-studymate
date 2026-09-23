from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = "https://hzmyjolpkykbnsdsiimy.supabase.co"
    supabase_anon_key: str
    supabase_service_role_key: str
    # JWT verification uses Supabase's JWKS endpoint; the legacy JWT secret is not required.
    supabase_jwt_secret: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""
    gemini_api_key: str = ""
    ai_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    groq_model: str = "llama-3.3-70b-versatile"
    gemini_model: str = "gemini-2.0-flash"
    gemini_embedding_model: str = "gemini-embedding-2"
    embedding_dimension: int = 768
    environment: str = "development"
    log_level: str = "info"
    cors_origins: str = "http://localhost:3000"
    grounding_threshold: float = 0.7
    max_file_size_mb: int = 25
    max_chunk_size: int = 500
    chunk_overlap: int = 100
    retrieval_top_k: int = 5

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
