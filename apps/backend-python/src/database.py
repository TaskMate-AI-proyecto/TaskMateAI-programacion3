from src.config.database import Base, engine
from src.models import User, Category, Task


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
