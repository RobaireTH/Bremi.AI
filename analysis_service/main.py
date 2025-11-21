import uvicorn
import logging
from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import json

from database import SessionLocal, engine, init_db, ScheduledFollowUp, ChatHistory
from analyzer import ContextAnalyzer
from risk_model import RiskAnalysisModel
from email_service import BrevoEmailService
from whatsapp_service import WhatsAppService
from chat_service import ChatService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
whatsapp_service = WhatsAppService()
chat_service = ChatService()

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
            log_msg = f"EMAIL TRIGGERED | User: {item.user_id} | Topic: {item.topic}"
            logger.info(log_msg)
            
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
                logger.warning(f"No email address found for user {item.user_id}")
                item.status = "failed_no_email"
        
        db.commit()
    except Exception as e:
        logger.error(f"Scheduler Error: {e}")
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
            logger.critical(f"CRITICAL RISK DETECTED for User {user_id}: {risk_assessment.risk_level}")
            # In a real app, this would trigger an immediate alert
    except Exception as e:
        logger.error(f"Risk Analysis Failed: {e}")
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
        logger.error(f"Follow-up Analysis Failed: {e}")
        results["followup_error"] = str(e)

    # 3. Title Generation (if enough context)
    if len(history) >= 2:
        try:
            title = analyzer.generate_title(history)
            results["suggested_title"] = title
        except Exception as e:
            logger.error(f"Title Generation Failed: {e}")
    
    return results

@app.get("/pending-tasks")
def get_pending_tasks(db: Session = Depends(get_db)):
    return db.query(ScheduledFollowUp).filter(ScheduledFollowUp.status == "pending").all()

# --- WhatsApp Webhook ---

@app.get("/whatsapp/webhook")
async def verify_webhook(
    mode: str = Query(alias="hub.mode"),
    token: str = Query(alias="hub.verify_token"),
    challenge: str = Query(alias="hub.challenge")
):
    """
    Verifies the webhook with WhatsApp.
    """
    verify_token = os.getenv("VERIFY_TOKEN", "bremi_secure_token")
    
    if mode == "subscribe" and token == verify_token:
        logger.info("WEBHOOK_VERIFIED")
        return int(challenge)
    
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/whatsapp/webhook")
async def webhook_handler(request: Request):
    """
    Handles incoming WhatsApp messages.
    """
    try:
        body = await request.json()
        logger.info(f"Incoming Webhook: {json.dumps(body, indent=2)}")
        
        # Check if it's a message from a user
        if (
            body.get("entry") and 
            body["entry"][0].get("changes") and 
            body["entry"][0]["changes"][0].get("value") and 
            body["entry"][0]["changes"][0]["value"].get("messages")
        ):
            change = body["entry"][0]["changes"][0]["value"]
            message = change["messages"][0]
            
            if message["type"] == "text":
                from_number = message["from"]
                msg_body = message["text"]["body"]
                msg_id = message["id"]
                
                # Mark as read
                await whatsapp_service.mark_as_read(msg_id)
                
                db = SessionLocal()
                try:
                    # 1. Save User Message
                    user_msg = ChatHistory(
                        user_id=from_number,
                        role="user",
                        content=msg_body
                    )
                    db.add(user_msg)
                    db.commit() # Commit to get ID/Timestamp if needed
                    
                    # 2. Fetch History (Limit to last 20 messages for context)
                    # We need to sort by timestamp asc for the model
                    history_records = db.query(ChatHistory).filter(
                        ChatHistory.user_id == from_number
                    ).order_by(ChatHistory.timestamp.desc()).limit(20).all()
                    
                    # Reverse to chronological order
                    history_records.reverse()
                    
                    history = [{"role": h.role, "text": h.content} for h in history_records]
                    
                    # 3. Generate Response
                    response_text = await chat_service.generate_response(history, msg_body)
                    
                    # 4. Save Model Response
                    model_msg = ChatHistory(
                        user_id=from_number,
                        role="model",
                        content=response_text
                    )
                    db.add(model_msg)
                    db.commit()
                    
                    # 5. Send Response
                    await whatsapp_service.send_message(from_number, response_text)
                    
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    db.rollback()
                finally:
                    db.close()
                
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook Error: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
