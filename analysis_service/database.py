from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./bremi_memory.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ScheduledFollowUp(Base):
    __tablename__ = "scheduled_followups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    topic = Column(String)
    context_summary = Column(String)
    email_content = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    scheduled_time = Column(DateTime)
    status = Column(String, default="pending") # pending, sent, cancelled

def init_db():
    Base.metadata.create_all(bind=engine)
