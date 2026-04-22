"""
app/sockets.py  —  Socket.IO real-time event handlers
"""
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio, db
from app.models import Message, User


def get_user_from_token(token):
    try:
        decoded  = decode_token(token)
        user_id  = int(decoded["sub"])
        return User.query.get(user_id)
    except Exception:
        return None


@socketio.on("connect")
def on_connect(auth):
    """Client connects — join their personal room for private notifications."""
    token = (auth or {}).get("token", "")
    user  = get_user_from_token(token)
    if user:
        join_room(f"user_{user.id}")
        emit("connected", {"message": f"Welcome, {user.name}!"})


@socketio.on("disconnect")
def on_disconnect():
    pass


@socketio.on("join_chat")
def on_join_chat(data):
    """Join a private chat room between two users."""
    token    = data.get("token", "")
    user     = get_user_from_token(token)
    partner_id = data.get("partner_id")
    if user and partner_id:
        room = _chat_room(user.id, int(partner_id))
        join_room(room)
        emit("joined_chat", {"room": room})


@socketio.on("leave_chat")
def on_leave_chat(data):
    token      = data.get("token", "")
    user       = get_user_from_token(token)
    partner_id = data.get("partner_id")
    if user and partner_id:
        room = _chat_room(user.id, int(partner_id))
        leave_room(room)


@socketio.on("send_message")
def on_send_message(data):
    """
    data = {token, receiver_id, content, item_id (optional)}
    Saves the message to DB, emits to both users' rooms.
    """
    token       = data.get("token", "")
    user        = get_user_from_token(token)
    receiver_id = data.get("receiver_id")
    content     = data.get("content", "").strip()
    item_id     = data.get("item_id")

    if not user or not receiver_id or not content:
        return

    msg = Message(
        sender_id=user.id,
        receiver_id=int(receiver_id),
        content=content,
        item_id=item_id,
    )
    db.session.add(msg)
    db.session.commit()

    room   = _chat_room(user.id, int(receiver_id))
    payload = msg.to_dict()

    # Emit to the shared chat room and to recipient's personal room
    emit("new_message", payload, room=room)
    emit("new_message", payload, room=f"user_{receiver_id}")


def _chat_room(a: int, b: int) -> str:
    """Deterministic room name for two user IDs."""
    lo, hi = sorted([a, b])
    return f"chat_{lo}_{hi}"
