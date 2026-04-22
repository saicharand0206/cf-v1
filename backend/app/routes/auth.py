"""
app/routes/auth.py  —  Register / Login / Logout / Profile
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from app import db, bcrypt
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name       = data.get("name", "").strip()
    email      = data.get("email", "").strip().lower()
    college_id = data.get("college_id", "").strip() or None
    password   = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 409

    if college_id and User.query.filter_by(college_id=college_id).first():
        return jsonify({"error": "College ID already registered."}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(name=name, email=email, college_id=college_id, password=hashed)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    login_id = data.get("login", "").strip().lower()   # email OR college_id
    password = data.get("password", "")

    user = User.query.filter_by(email=login_id).first()
    if not user:
        user = User.query.filter_by(college_id=login_id).first()

    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    data    = request.get_json()

    user.name   = data.get("name", user.name)
    user.avatar_url = data.get("avatar_url", user.avatar_url)
    db.session.commit()
    return jsonify(user.to_dict()), 200
