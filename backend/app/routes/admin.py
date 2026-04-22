"""
app/routes/admin.py  —  Admin-only endpoints
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Item, Notification

admin_bp = Blueprint("admin", __name__)


def require_admin():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != "admin":
        return None, (jsonify({"error": "Admin access required."}), 403)
    return user, None


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    _, err = require_admin()
    if err:
        return err
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route("/users/<int:uid>/role", methods=["PUT"])
@jwt_required()
def set_role(uid):
    _, err = require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    data = request.get_json()
    user.role = data.get("role", user.role)
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/items", methods=["GET"])
@jwt_required()
def admin_items():
    _, err = require_admin()
    if err:
        return err
    items = Item.query.order_by(Item.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200


@admin_bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_item(item_id):
    _, err = require_admin()
    if err:
        return err
    item = Item.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted by admin."}), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    _, err = require_admin()
    if err:
        return err
    return jsonify({
        "total_users":   User.query.count(),
        "total_items":   Item.query.count(),
        "lost_items":    Item.query.filter_by(status="lost").count(),
        "found_items":   Item.query.filter_by(status="found").count(),
        "returned_items": Item.query.filter_by(status="returned").count(),
    }), 200
