from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/rutinas_gimnasio"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

