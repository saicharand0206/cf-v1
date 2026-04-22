"""
app/models.py  —  All SQLAlchemy database models
"""
from app import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    college_id = db.Column(db.String(50), unique=True, nullable=True)
    password   = db.Column(db.String(255), nullable=False)
    role       = db.Column(db.String(10), default="user")   # "user" | "admin"
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items         = db.relationship("Item", backref="owner", lazy=True)
    sent_msgs     = db.relationship("Message", foreign_keys="Message.sender_id",   backref="sender",   lazy=True)
    received_msgs = db.relationship("Message", foreign_keys="Message.receiver_id", backref="receiver", lazy=True)
    notifications = db.relationship("Notification", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "college_id": self.college_id,
            "role":       self.role,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat(),
        }


class Item(db.Model):
    __tablename__ = "items"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category    = db.Column(db.String(50))   # phone | wallet | bag | id_card | keys | other
    status      = db.Column(db.String(10), default="lost")  # lost | found | returned
    date_lost   = db.Column(db.Date)
    location    = db.Column(db.String(200))
    image_url   = db.Column(db.Text)
    image_feat  = db.Column(db.Text)   # JSON-serialized embedding vector
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "user_id":     self.user_id,
            "owner_name":  self.owner.name if self.owner else None,
            "title":       self.title,
            "description": self.description,
            "category":    self.category,
            "status":      self.status,
            "date_lost":   self.date_lost.isoformat() if self.date_lost else None,
            "location":    self.location,
            "image_url":   self.image_url,
            "created_at":  self.created_at.isoformat(),
        }


class Message(db.Model):
    __tablename__ = "messages"

    id          = db.Column(db.Integer, primary_key=True)
    sender_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    item_id     = db.Column(db.Integer, db.ForeignKey("items.id"), nullable=True)
    content     = db.Column(db.Text, nullable=False)
    read        = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "sender_id":   self.sender_id,
            "sender_name": self.sender.name if self.sender else None,
            "receiver_id": self.receiver_id,
            "item_id":     self.item_id,
            "content":     self.content,
            "read":        self.read,
            "created_at":  self.created_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message    = db.Column(db.Text)
    read       = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "message":    self.message,
            "read":       self.read,
            "created_at": self.created_at.isoformat(),
        }
