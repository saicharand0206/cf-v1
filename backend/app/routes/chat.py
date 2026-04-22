"""
app/routes/chat.py  —  Message history & conversation list
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Message, User

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/conversations", methods=["GET"])
@jwt_required()
def conversations():
    """Return list of users the current user has chatted with."""
    user_id = int(get_jwt_identity())

    sent_to     = db.session.query(Message.receiver_id).filter_by(sender_id=user_id).distinct()
    received_from = db.session.query(Message.sender_id).filter_by(receiver_id=user_id).distinct()

    partner_ids = {r[0] for r in sent_to} | {r[0] for r in received_from}
    partners = User.query.filter(User.id.in_(partner_ids)).all()

    result = []
    for p in partners:
        last_msg = Message.query.filter(
            db.or_(
                db.and_(Message.sender_id == user_id, Message.receiver_id == p.id),
                db.and_(Message.sender_id == p.id, Message.receiver_id == user_id),
            )
        ).order_by(Message.created_at.desc()).first()

        unread = Message.query.filter_by(
            sender_id=p.id, receiver_id=user_id, read=False
        ).count()

        result.append({
            "partner": p.to_dict(),
            "last_message": last_msg.to_dict() if last_msg else None,
            "unread_count": unread,
        })

    return jsonify(result), 200


@chat_bp.route("/history/<int:partner_id>", methods=["GET"])
@jwt_required()
def history(partner_id):
    """Return message history between current user and partner."""
    user_id = int(get_jwt_identity())

    msgs = Message.query.filter(
        db.or_(
            db.and_(Message.sender_id == user_id, Message.receiver_id == partner_id),
            db.and_(Message.sender_id == partner_id, Message.receiver_id == user_id),
        )
    ).order_by(Message.created_at.asc()).all()

    # Mark received messages as read
    for m in msgs:
        if m.receiver_id == user_id and not m.read:
            m.read = True
    db.session.commit()

    return jsonify([m.to_dict() for m in msgs]), 200
