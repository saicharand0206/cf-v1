"""
seed.py  —  Populate the database with realistic demo data
Run: python seed.py

Creates:
  - 1 admin user
  - 5 student users
  - 20 sample lost/found items
  - 10 sample messages
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta, datetime
import random
from app import create_app, db, bcrypt
from app.models import User, Item, Message, Notification

app = create_app()

STUDENTS = [
    {"name": "Hari Charan Goud",  "email": "hari@ifhe.edu.in",  "college_id": "23BCSXXX001"},
    {"name": "Priya Sharma",       "email": "priya@ifhe.edu.in", "college_id": "23BCSXXX002"},
    {"name": "Arjun Reddy",        "email": "arjun@ifhe.edu.in", "college_id": "23BCSXXX003"},
    {"name": "Sneha Patel",        "email": "sneha@ifhe.edu.in", "college_id": "23BCSXXX004"},
    {"name": "Rohan Kumar",        "email": "rohan@ifhe.edu.in", "college_id": "23BCSXXX005"},
]

ITEMS = [
    # Lost items
    {"title": "Blue iPhone 13 Pro",         "description": "Lost my blue iPhone 13 Pro near the library. Has a cracked screen protector. IMEI sticker on box if needed.", "category": "phone",   "status": "lost",     "location": "Central Library",        "date_offset": -3},
    {"title": "Black Leather Wallet",        "description": "Black leather bi-fold wallet with college ID, debit card and around 300 rupees inside.", "category": "wallet",  "status": "lost",     "location": "Canteen Block B",        "date_offset": -5},
    {"title": "EEE Department ID Card",      "description": "ID card belonging to a 3rd year EEE student. Name visible on card.", "category": "id_card", "status": "found",    "location": "Parking Lot C",           "date_offset": -1},
    {"title": "Blue Nike Backpack",          "description": "Medium-sized blue Nike backpack with laptop compartment. Has a small tear on right strap.", "category": "bag",     "status": "lost",     "location": "Seminar Hall 2",         "date_offset": -7},
    {"title": "Car Keys with Red Keychain",  "description": "Toyota car keys with a red rubber keychain and a broken carabiner clip.", "category": "keys",    "status": "found",    "location": "Sports Ground",           "date_offset": -2},
    {"title": "OnePlus Nord 3 (Black)",      "description": "Black OnePlus Nord 3, has scratched back and lock screen shows a dog wallpaper.", "category": "phone",   "status": "found",    "location": "Main Gate Security",     "date_offset": -4},
    {"title": "Data Structures Textbook",    "description": "CLRS Introduction to Algorithms, 3rd edition. Name written inside front cover: Sneha.", "category": "book",    "status": "lost",     "location": "Block A Classroom 204",  "date_offset": -6},
    {"title": "Apple AirPods Pro Case",      "description": "White AirPods Pro charging case (no earbuds inside). Has custom skin sticker on lid.", "category": "other",   "status": "lost",     "location": "Boys Hostel Common Room", "date_offset": -2},
    {"title": "Dell Inspiron Laptop Bag",    "description": "Gray Dell branded laptop bag, 15 inch. Contains charger and mouse inside.", "category": "bag",     "status": "found",    "location": "Library 2nd Floor",      "date_offset": -1},
    {"title": "Silver HP Laptop",            "description": "HP Pavilion 15, silver color. Stickers of 'Python' and 'VSCode' on lid. Password protected.", "category": "laptop", "status": "lost",     "location": "Computer Lab 3",         "date_offset": -8},
    {"title": "Casio Scientific Calculator", "description": "Casio fx-991EX Classwiz calculator. Name etched on back: ARJUN R.", "category": "other",   "status": "returned", "location": "Block C Exam Hall",       "date_offset": -10},
    {"title": "Green Geometry Box",          "description": "Standard Camlin geometry box with a broken compass. Has name sticker.", "category": "other",   "status": "returned", "location": "Drawing Lab",             "date_offset": -12},
    {"title": "Samsung Galaxy A54",          "description": "Purple Samsung Galaxy A54 with cracked corner. Sim tray is missing.", "category": "phone",   "status": "lost",     "location": "Cafeteria",               "date_offset": -9},
    {"title": "CSE Department Bundle — 3 Books", "description": "OS, DBMS and CN textbooks rubber-banded together. Library stickers on all three.", "category": "book",    "status": "found",    "location": "Reading Room",           "date_offset": -3},
    {"title": "Umbrella (Blue Folding)",     "description": "Blue compact folding umbrella, 'Stormking' brand.", "category": "other",   "status": "lost",     "location": "Admin Block Reception",  "date_offset": -6},
    {"title": "Boat Airdopes 311",           "description": "Black Boat wireless earbuds with blue case. Left earbud has slight crackling sound.", "category": "other",   "status": "found",    "location": "Fitness Center",         "date_offset": -4},
    {"title": "Water Bottle (Milton)",       "description": "Red Milton Thermosteel 1L bottle, name 'ROHAN' engraved on bottom.", "category": "other",   "status": "found",    "location": "Ground Floor Corridor",  "date_offset": -1},
    {"title": "Glasses (Thin Black Frame)",  "description": "Thin rectangular black-framed prescription glasses in a brown faux-leather case.", "category": "other",   "status": "lost",     "location": "Bus Stop",               "date_offset": -5},
    {"title": "Brown Leather Sling Bag",     "description": "Women's brown faux-leather sling bag with zipper. Contains mirror, pens, hair clips.", "category": "bag",     "status": "found",    "location": "Girls Hostel Gate",      "date_offset": -2},
    {"title": "Lab Journal (ECE 4th Year)",  "description": "Spiral notebook labeled 'ECE Lab Journal Sem 7'. Has circuit diagrams inside.", "category": "book",    "status": "found",    "location": "ECE Lab",                "date_offset": -7},
]

MESSAGES = [
    "Hi! I think I found your item. Are you around?",
    "Yes! Where can I collect it?",
    "I can meet you at the library at 2pm?",
    "That works! I'll be near the main entrance.",
    "Thank you so much for keeping it safe!",
    "No problem at all. Happy to help 😊",
    "Is the item still available?",
    "Yes, please come to the admin block.",
    "Can you describe the item more? I may have it.",
    "It has a blue case and my college ID inside.",
]


def seed():
    with app.app_context():
        print("🌱 Seeding database...")

        # Clear existing data (order matters for FK constraints)
        Notification.query.delete()
        Message.query.delete()
        Item.query.delete()
        User.query.delete()
        db.session.commit()

        # ── Create admin ──────────────────────────────────────────────────
        admin = User(
            name="Admin User",
            email="admin@ifhe.edu.in",
            college_id="ADMIN001",
            password=bcrypt.generate_password_hash("admin123").decode("utf-8"),
            role="admin",
        )
        db.session.add(admin)

        # ── Create students ────────────────────────────────────────────────
        students = []
        for s in STUDENTS:
            u = User(
                name=s["name"],
                email=s["email"],
                college_id=s["college_id"],
                password=bcrypt.generate_password_hash("student123").decode("utf-8"),
                role="user",
            )
            db.session.add(u)
            students.append(u)

        db.session.flush()  # Get IDs before committing
        print(f"  ✅ Created {len(students) + 1} users")

        # ── Create items ───────────────────────────────────────────────────
        created_items = []
        for idx, item_data in enumerate(ITEMS):
            owner = students[idx % len(students)]
            d = date.today() + timedelta(days=item_data["date_offset"])
            item = Item(
                user_id=owner.id,
                title=item_data["title"],
                description=item_data["description"],
                category=item_data["category"],
                status=item_data["status"],
                date_lost=d,
                location=item_data["location"],
                image_url=None,  # No images in seed (would need real files)
                created_at=datetime.utcnow() + timedelta(days=item_data["date_offset"]),
            )
            db.session.add(item)
            created_items.append(item)

        db.session.flush()
        print(f"  ✅ Created {len(created_items)} items")

        # ── Create sample messages ─────────────────────────────────────────
        msg_count = 0
        for i in range(0, len(MESSAGES), 2):
            sender   = students[i % len(students)]
            receiver = students[(i + 1) % len(students)]
            item     = created_items[i % len(created_items)]

            for j in range(2):
                msg_idx = i + j
                if msg_idx >= len(MESSAGES):
                    break
                s = sender if j == 0 else receiver
                r = receiver if j == 0 else sender
                msg = Message(
                    sender_id=s.id,
                    receiver_id=r.id,
                    item_id=item.id,
                    content=MESSAGES[msg_idx],
                    created_at=datetime.utcnow() + timedelta(minutes=msg_idx * 5),
                )
                db.session.add(msg)
                msg_count += 1

        db.session.flush()
        print(f"  ✅ Created {msg_count} messages")

        # ── Create sample notifications ────────────────────────────────────
        for s in students:
            notif = Notification(
                user_id=s.id,
                message="Welcome to Campus Find! Post your lost or found items.",
                read=False,
            )
            db.session.add(notif)

        db.session.commit()
        print("  ✅ Created welcome notifications")

        print()
        print("🎉 Database seeded successfully!")
        print()
        print("Login credentials:")
        print("  Admin:   admin@ifhe.edu.in   / admin123")
        print("  Student: hari@ifhe.edu.in    / student123")
        print("  Student: priya@ifhe.edu.in   / student123")
        print("  (all students use password: student123)")


if __name__ == "__main__":
    seed()
