"""
app/routes/items.py  —  CRUD for lost/found items + AI suggestions

FIX: All socketio.emit() and notify_all() calls are wrapped in
try/except so a Socket.IO error NEVER crashes the HTTP response.
The DB commit always completes independently of the real-time broadcast.
"""
import os, json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app import db, socketio
from app.models import Item, User, Notification
from app.ai_module import predict_category, get_image_embedding, find_similar_items, match_by_text

items_bp = Blueprint("items", __name__)

ALLOWED = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED


def save_image(file):
    filename = secure_filename(file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"{timestamp}_{filename}"
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(path)
    return f"/uploads/{filename}"


# ─── LIST & SEARCH ────────────────────────────────────────────────────────────

@items_bp.route("/", methods=["GET"])
def list_items():
    q        = request.args.get("q", "")
    category = request.args.get("category", "")
    status   = request.args.get("status", "")
    location = request.args.get("location", "")
    date_from= request.args.get("date_from", "")
    date_to  = request.args.get("date_to", "")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 12))

    query = Item.query

    if q:
        like = f"%{q}%"
        query = query.filter(
            db.or_(Item.title.ilike(like), Item.description.ilike(like))
        )
    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)
    if location:
        query = query.filter(Item.location.ilike(f"%{location}%"))
    if date_from:
        query = query.filter(Item.date_lost >= date_from)
    if date_to:
        query = query.filter(Item.date_lost <= date_to)

    query = query.order_by(Item.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items":   [i.to_dict() for i in paginated.items],
        "total":   paginated.total,
        "pages":   paginated.pages,
        "page":    page,
    }), 200


# ─── CREATE ───────────────────────────────────────────────────────────────────

@items_bp.route("/", methods=["POST"])
@jwt_required()
def create_item():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    title       = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    category    = request.form.get("category", "other")
    status      = request.form.get("status", "lost")
    date_lost   = request.form.get("date_lost")
    location    = request.form.get("location", "").strip()

    if not title:
        return jsonify({"error": "Title is required."}), 400

    image_url   = None
    image_feat  = None
    ai_category = category

    file = request.files.get("image")
    if file and allowed_file(file.filename):
        image_url = save_image(file)
        full_path = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            os.path.basename(image_url)
        )
        try:
            embedding   = get_image_embedding(full_path)
            image_feat  = json.dumps(embedding)
            ai_category = predict_category(full_path)
            if category == "other":
                category = ai_category
        except Exception as e:
            current_app.logger.warning(f"AI module error: {e}")

    date_obj = None
    if date_lost:
        try:
            date_obj = datetime.strptime(date_lost, "%Y-%m-%d").date()
        except ValueError:
            pass

    item = Item(
        user_id=user_id, title=title, description=description,
        category=category, status=status, date_lost=date_obj,
        location=location, image_url=image_url, image_feat=image_feat,
    )
    db.session.add(item)
    db.session.commit()   # ← DB write finishes here; everything below is best-effort

    # Real-time broadcast — wrapped so any error NEVER affects the HTTP response
    try:
        socketio.emit("new_item", item.to_dict(), broadcast=True)
    except Exception as e:
        current_app.logger.warning(f"Socket emit 'new_item' failed: {e}")

    try:
        notify_all(f"New {status} item posted: {title}", exclude_id=user_id)
    except Exception as e:
        current_app.logger.warning(f"notify_all failed: {e}")

    # Always 201 — the item is in the database regardless of socket status
    return jsonify({
        "item":        item.to_dict(),
        "ai_category": ai_category,
    }), 201


# ─── SINGLE ITEM ──────────────────────────────────────────────────────────────

@items_bp.route("/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = Item.query.get_or_404(item_id)
    data = item.to_dict()

    if item.description:
        text_matches = match_by_text(item.description, item_id)
        data["text_matches"] = text_matches

    if item.image_feat:
        try:
            embedding = json.loads(item.image_feat)
            similar   = find_similar_items(embedding, item_id)
            data["similar_items"] = similar
        except Exception:
            data["similar_items"] = []
    else:
        data["similar_items"] = []

    return jsonify(data), 200


@items_bp.route("/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    user_id = int(get_jwt_identity())
    item    = Item.query.get_or_404(item_id)
    user    = User.query.get(user_id)

    if item.user_id != user_id and user.role != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    data = request.get_json() or {}
    for field in ["title", "description", "category", "status", "location"]:
        if field in data:
            setattr(item, field, data[field])

    db.session.commit()   # ← DB write finishes here

    # Real-time broadcast — best-effort, never affects the response
    try:
        socketio.emit("item_updated", item.to_dict(), broadcast=True)
    except Exception as e:
        current_app.logger.warning(f"Socket emit 'item_updated' failed: {e}")

    # Always 200 — the update is persisted regardless of socket status
    return jsonify(item.to_dict()), 200


@items_bp.route("/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    user_id = int(get_jwt_identity())
    item    = Item.query.get_or_404(item_id)
    user    = User.query.get(user_id)

    if item.user_id != user_id and user.role != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    db.session.delete(item)
    db.session.commit()   # ← DB delete finishes here

    # Real-time broadcast — best-effort, never affects the response
    try:
        socketio.emit("item_deleted", {"id": item_id}, broadcast=True)
    except Exception as e:
        current_app.logger.warning(f"Socket emit 'item_deleted' failed: {e}")

    # Always 200 — the item is gone from the DB regardless of socket status
    return jsonify({"message": "Deleted."}), 200


# ─── AI SUGGESTIONS ───────────────────────────────────────────────────────────

@items_bp.route("/ai/suggest-category", methods=["POST"])
def suggest_category():
    """Returns AI-predicted category for an uploaded image (no auth needed)."""
    file = request.files.get("image")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Valid image required."}), 400

    image_url = save_image(file)
    full_path = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        os.path.basename(image_url)
    )
    try:
        cat = predict_category(full_path)
        return jsonify({"category": cat, "image_url": image_url}), 200
    except Exception as e:
        return jsonify({"category": "other", "error": str(e)}), 200


# ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

@items_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifs  = Notification.query.filter_by(user_id=user_id)\
                .order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([n.to_dict() for n in notifs]), 200


@items_bp.route("/notifications/<int:nid>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(nid):
    user_id = int(get_jwt_identity())
    notif   = Notification.query.get_or_404(nid)
    if notif.user_id != user_id:
        return jsonify({"error": "Unauthorized."}), 403
    notif.read = True
    db.session.commit()
    return jsonify(notif.to_dict()), 200


# ─── HELPER ───────────────────────────────────────────────────────────────────

def notify_all(message, exclude_id=None):
    """
    Insert a Notification row for every non-admin user, then broadcast
    via Socket.IO.  Both steps are individually guarded so neither
    can propagate an exception to the caller.
    """
    try:
        users = User.query.filter(User.role != "admin").all()
        for u in users:
            if u.id == exclude_id:
                continue
            notif = Notification(user_id=u.id, message=message)
            db.session.add(notif)
        db.session.commit()
    except Exception as e:
        current_app.logger.warning(f"notify_all DB write failed: {e}")

    try:
        socketio.emit("notification", {"message": message}, broadcast=True)
    except Exception as e:
        current_app.logger.warning(f"notify_all socket emit failed: {e}")
