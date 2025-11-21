import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from typing import List, Dict
import os

from database import SessionLocal, engine, init_db, ScheduledFollowUp
from analyzer import ContextAnalyzer
from risk_model import RiskAnalysisModel
from email_service import BrevoEmailService

# Initialize DB
init_db()

app = FastAPI(title="Bremi Memory Service")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ContextAnalyzer()
risk_analyzer = RiskAnalysisModel()
email_service = BrevoEmailService()

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
            log_msg = f"""
--------------------------------------------------
[EMAIL TRIGGERED] {datetime.now()}
To User: {item.user_id} ({item.user_email})
Topic: {item.topic}
--------------------------------------------------
"""
            print(log_msg)
            
            # Send via Brevo
            if item.user_email:
                success = email_service.send_checkup_email(
                    to_email=item.user_email,
                    name="Friend", # Could be improved if we stored name
                    topic=item.topic,
                    content=item.email_content
                )
                if success:
                    item.status = "sent"
                else:
                    item.status = "failed"
            else:
                print("No email address found for user.")
                item.status = "failed_no_email"
            
            # Log to file for demo purposes
            with open("sent_emails.log", "a", encoding="utf-8") as f:
                f.write(log_msg)
        
        db.commit()
    except Exception as e:
        print(f"Scheduler Error: {e}")
    finally:
        db.close()

# Start Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(check_for_due_followups, 'interval', seconds=30) # Check every 30s for demo
scheduler.start()

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Bremi Memory Service"}

@app.post("/sync-chat")
def sync_chat_history(
    user_id: str, 
    history: List[Dict[str, str]], 
    user_email: str = None, # Optional email
    db: Session = Depends(get_db)
):
    """
    Ingests chat history, analyzes it for open loops and risks.
    """
    results = {}

    # 1. Risk Analysis
    try:
        risk_assessment = risk_analyzer.analyze_session(history)
        results["risk_assessment"] = risk_assessment.model_dump()
        
        if risk_assessment.is_critical:
            print(f"CRITICAL RISK DETECTED for User {user_id}: {risk_assessment.risk_level}")
            # In a real app, this would trigger an immediate alert
    except Exception as e:
        print(f"Risk Analysis Failed: {e}")
        results["risk_error"] = str(e)

    # 2. Follow-up Analysis
    try:
        plan = analyzer.analyze_for_followup(history)
        results["followup_plan"] = plan.model_dump()
        
        if plan.needs_followup:
            # Calculate Trigger Time
            trigger_time = datetime.now() + timedelta(hours=plan.suggested_delay_hours)
            
            # Save to DB
            new_task = ScheduledFollowUp(
                user_id=user_id,
                user_email=user_email,
                topic=plan.topic,
                context_summary=plan.context_summary,
                email_content=plan.email_draft,
                scheduled_time=trigger_time,
                status="pending"
            )
            db.add(new_task)
            db.commit()
            
            results["scheduled_followup"] = {
                "topic": plan.topic,
                "time": trigger_time
            }
    except Exception as e:
        print(f"Follow-up Analysis Failed: {e}")
        results["followup_error"] = str(e)

    # 3. Title Generation (if enough context)
    if len(history) >= 2:
        try:
            title = analyzer.generate_title(history)
            results["suggested_title"] = title
        except Exception as e:
            print(f"Title Generation Failed: {e}")
    
    return results

@app.get("/pending-tasks")
def get_pending_tasks(db: Session = Depends(get_db)):
    return db.query(ScheduledFollowUp).filter(ScheduledFollowUp.status == "pending").all()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
