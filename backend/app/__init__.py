"""
app/__init__.py  —  Flask application factory
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from datetime import timedelta
import os

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet")


def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    # Allow JWT from headers AND cookies
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        hours=app.config.get("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24)
    )

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Blueprints
    from app.routes.auth import auth_bp
    from app.routes.items import items_bp
    from app.routes.admin import admin_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(items_bp, url_prefix="/api/items")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    # Static file serving for uploaded images
    from flask import send_from_directory

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Register Socket.IO handlers
    from app import sockets  # noqa: F401

    with app.app_context():
        db.create_all()

    return app
