import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from typing import List, Dict

from database import SessionLocal, engine, init_db, ScheduledFollowUp
from analyzer import ContextAnalyzer

# Initialize DB
init_db()

app = FastAPI(title="Bremi Memory Service")
analyzer = ContextAnalyzer()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Scheduler Logic ---
def check_for_due_followups():
    """
    Runs every hour. Checks DB for pending emails that are due.
    """
    db = SessionLocal()
    try:
        now = datetime.now()
        due_items = db.query(ScheduledFollowUp).filter(
            ScheduledFollowUp.status == "pending",
            ScheduledFollowUp.scheduled_time <= now
        ).all()

        for item in due_items:
            print(f"📧 [MOCK EMAIL SENT] To User {item.user_id}:")
            print(f"   Subject: Checking in on {item.topic}")
            print(f"   Body: {item.email_content}")
            print("-" * 30)
            
            # Mark as sent
            item.status = "sent"
        
        db.commit()
    except Exception as e:
        print(f"Scheduler Error: {e}")
    finally:
        db.close()

# Start Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(check_for_due_followups, 'interval', hours=1) # Checks every hour
scheduler.start()

# --- API Endpoints ---

@app.post("/sync-chat")
def sync_chat_history(
    user_id: str, 
    history: List[Dict[str, str]], 
    db: Session = Depends(get_db)
):
    """
    Ingests chat history, analyzes it for open loops, and schedules follow-ups if needed.
    """
    # 1. Analyze
    plan = analyzer.analyze_for_followup(history)
    
    if plan.needs_followup:
        # 2. Calculate Trigger Time
        trigger_time = datetime.now() + timedelta(hours=plan.suggested_delay_hours)
        
        # 3. Save to DB
        new_task = ScheduledFollowUp(
            user_id=user_id,
            topic=plan.topic,
            context_summary=plan.context_summary,
            email_content=plan.email_draft,
            scheduled_time=trigger_time,
            status="pending"
        )
        db.add(new_task)
        db.commit()
        
        return {
            "status": "scheduled", 
            "topic": plan.topic, 
            "time": trigger_time
        }
    
    return {"status": "no_action_needed"}

@app.get("/pending-tasks")
def get_pending_tasks(db: Session = Depends(get_db)):
    return db.query(ScheduledFollowUp).filter(ScheduledFollowUp.status == "pending").all()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
