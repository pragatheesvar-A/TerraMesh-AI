import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

# Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mineguard.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from models import BroadcastGroup, BroadcastChannel, BroadcastRecipient, Base
import database

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(BroadcastGroup).count() > 0:
        print("Broadcasts already seeded.")
        return

    defaults = [
        ("Workers", "Underground workers, mine workers, assigned operational personnel"),
        ("Supervisors", "Shift supervisors, section supervisors, underground supervisors"),
        ("Admins", "Mine administrators, system administrators"),
        ("Emergency Team", "Emergency response personnel, rescue team, emergency coordinators"),
        ("Maintenance Team", "Electrical team, mechanical team, maintenance personnel"),
        ("Safety Team", "Safety officers, safety supervisors, safety personnel"),
        ("Management", "Authorized mine management"),
        ("Control Room", "Control-room operators, monitoring personnel"),
        ("All Personnel", "All active registered personnel"),
    ]

    for name, desc in defaults:
        new_id = f"BG-{uuid.uuid4().hex[:8].upper()}"
        group = BroadcastGroup(
            id=new_id,
            name=name,
            description=desc,
            status="ACTIVE",
            created_by="System"
        )
        db.add(group)
        
        chan = BroadcastChannel(
            broadcast_id=new_id,
            sms_enabled=True,
            email_enabled=True,
            dashboard_enabled=True
        )
        db.add(chan)
        
        # Add a dummy recipient to each just for UI stats
        db.add(BroadcastRecipient(
            broadcast_id=new_id,
            user_id="U-001",
            role=name
        ))

    db.commit()
    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed()
