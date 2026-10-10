from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://scaffold:scaffold@localhost:5432/scaffold"
    redis_url: str = "redis://localhost:6379/0"
    llm_base_url: str = "http://localhost:11434"
    llm_model: str = "llama3.2:3b"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
