# 🎓 Campus Lost & Found — Complete Setup & Deployment Guide

---

## 📁 Folder Structure

```
lost-and-found/
├── backend/
│   ├── app/
│   │   ├── __init__.py         # Flask app factory
│   │   ├── models.py           # SQLAlchemy models (User, Item, Message, Notification)
│   │   ├── ai_module.py        # MobileNetV2 AI features
│   │   ├── sockets.py          # Socket.IO real-time handlers
│   │   └── routes/
│   │       ├── auth.py         # POST /api/auth/register, /login, GET/PUT /api/auth/me
│   │       ├── items.py        # GET/POST /api/items/, GET/PUT/DELETE /api/items/:id
│   │       ├── admin.py        # /api/admin/* (admin only)
│   │       └── chat.py         # GET /api/chat/conversations, /api/chat/history/:id
│   ├── uploads/                # Local image storage
│   ├── config.py
│   ├── requirements.txt
│   └── run.py                  # Entry point
│
└── frontend/
    ├── src/
    │   ├── api/axios.js         # Axios instance with JWT interceptor
    │   ├── context/
    │   │   ├── AuthContext.jsx  # Global auth state
    │   │   └── SocketContext.jsx# Socket.IO + real-time notifications
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ItemCard.jsx
    │   │   └── ChatBox.jsx      # Real-time chat window
    │   └── pages/
    │       ├── Home.jsx         # Search, filter, paginated grid
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── PostItem.jsx     # Image upload + AI category suggestion
    │       ├── ItemDetail.jsx   # Full detail + AI matches + chat
    │       ├── Dashboard.jsx    # User posts + conversation list
    │       ├── Profile.jsx
    │       └── AdminPanel.jsx   # Stats, item management, user roles
    └── ...config files
```

---

## 🔌 API Endpoints Reference

### Auth
| Method | Endpoint           | Auth  | Description              |
|--------|--------------------|-------|--------------------------|
| POST   | /api/auth/register | ❌    | Create account           |
| POST   | /api/auth/login    | ❌    | Login → JWT token        |
| GET    | /api/auth/me       | ✅    | Get current user         |
| PUT    | /api/auth/me       | ✅    | Update profile           |

### Items
| Method | Endpoint                      | Auth    | Description                        |
|--------|-------------------------------|---------|------------------------------------|
| GET    | /api/items/                   | ❌      | List/search items (paginated)      |
| POST   | /api/items/                   | ✅      | Create item (multipart/form-data)  |
| GET    | /api/items/:id                | ❌      | Item detail + AI matches           |
| PUT    | /api/items/:id                | ✅ owner| Update item (status, fields)       |
| DELETE | /api/items/:id                | ✅ owner| Delete item                        |
| POST   | /api/items/ai/suggest-category| ❌      | AI category from image upload      |
| GET    | /api/items/notifications      | ✅      | User notifications                 |
| PUT    | /api/items/notifications/:id/read | ✅  | Mark notification read             |

### Chat
| Method | Endpoint                   | Auth | Description                    |
|--------|----------------------------|------|--------------------------------|
| GET    | /api/chat/conversations    | ✅   | List all conversations         |
| GET    | /api/chat/history/:partner | ✅   | Message history with a user    |

### Admin
| Method | Endpoint                    | Auth     | Description         |
|--------|-----------------------------|----------|---------------------|
| GET    | /api/admin/stats            | ✅ admin | System statistics   |
| GET    | /api/admin/users            | ✅ admin | All users           |
| PUT    | /api/admin/users/:id/role   | ✅ admin | Promote/demote user |
| GET    | /api/admin/items            | ✅ admin | All items           |
| DELETE | /api/admin/items/:id        | ✅ admin | Delete any item     |

### Socket.IO Events
| Event          | Direction        | Description                          |
|----------------|-----------------|--------------------------------------|
| `connect`      | client → server | Connect with `{ token }`             |
| `join_chat`    | client → server | `{ token, partner_id }`              |
| `leave_chat`   | client → server | `{ token, partner_id }`              |
| `send_message` | client → server | `{ token, receiver_id, content, item_id }` |
| `new_message`  | server → client | Full message object                  |
| `new_item`     | server → client | Full item object (broadcast)         |
| `item_updated` | server → client | Updated item (broadcast)             |
| `item_deleted` | server → client | `{ id }` (broadcast)                 |
| `notification` | server → client | `{ message }` (broadcast)            |

---

## ⚡ Local Setup — Step by Step

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or use SQLite for quick start)

---

### 1. Clone / Download the Project

```bash
# If using git
git clone https://github.com/yourname/campus-lost-found.git
cd campus-lost-found
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/lostandfound
EOF
```

#### Quick Start with SQLite (no PostgreSQL needed)
Open `config.py` and change:
```python
# Comment out the PostgreSQL line and uncomment SQLite:
SQLALCHEMY_DATABASE_URI = "sqlite:///lostandfound.db"
```

#### Create the database (PostgreSQL)
```bash
psql -U postgres -c "CREATE DATABASE lostandfound;"
```

#### Start the backend
```bash
python run.py
# Server runs at http://localhost:5000
```

The database tables are created automatically on first run.

#### Create first admin user (after starting the server)
```bash
# Register normally via frontend, then run:
python -c "
from app import create_app, db
from app.models import User
app = create_app()
with app.app_context():
    u = User.query.filter_by(email='admin@example.com').first()
    u.role = 'admin'
    db.session.commit()
    print('Admin role set!')
"
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App runs at http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the Flask backend automatically.

---

### 4. Environment Variables

Backend `.env`:
```env
SECRET_KEY=change-this-in-production
JWT_SECRET_KEY=change-this-too
DATABASE_URL=postgresql://user:pass@localhost:5432/lostandfound
```

Frontend `.env` (create `frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Deployment Guide

---

### Option A: Railway (Recommended — Free Tier Available)

#### Deploy Backend

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add a PostgreSQL plugin (free)
4. Set environment variables:
   ```
   SECRET_KEY=<random 32-char string>
   JWT_SECRET_KEY=<random 32-char string>
   DATABASE_URL=<auto-provided by Railway>
   ```
5. Add `Procfile` to backend folder:
   ```
   web: python run.py
   ```
6. Railway auto-detects Python and deploys

#### Deploy Frontend

1. New Service → Deploy from GitHub (frontend folder)
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set env var: `VITE_API_URL=https://your-backend.railway.app`

---

### Option B: Render

**Backend (Web Service)**
- Runtime: Python 3
- Build: `pip install -r requirements.txt`
- Start: `python run.py`
- Add PostgreSQL database in Render dashboard

**Frontend (Static Site)**
- Build: `npm install && npm run build`
- Output: `dist`
- Set: `VITE_API_URL=https://your-backend.onrender.com`

---

### Option C: Vercel (Frontend) + Render (Backend)

1. Push frontend to GitHub
2. Connect Vercel → import project → set output `dist`
3. Add env var: `VITE_API_URL=https://your-render-backend.onrender.com`

---

### Production Checklist

- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY` to secure random strings
- [ ] Use PostgreSQL (not SQLite) in production
- [ ] Set `debug=False` in `run.py`
- [ ] Configure CORS to only allow your frontend domain:
  ```python
  CORS(app, resources={r"/api/*": {"origins": "https://yourfrontend.com"}})
  ```
- [ ] Use Cloudinary for image storage (replace local `uploads/` folder):
  ```python
  pip install cloudinary
  # Upload to Cloudinary instead of saving locally
  ```
- [ ] Enable HTTPS (handled automatically by Railway/Render/Vercel)

---

## 🤖 AI Module Notes

The AI module uses **MobileNetV2** (pretrained on ImageNet, ~14MB download on first run).

**Features:**
- **Image embedding** (1280-dim vector) stored per item for similarity search
- **Category prediction** maps ImageNet classes → your categories (phone, wallet, bag, etc.)
- **Text matching** uses TF-IDF cosine similarity on descriptions

**First run**: TensorFlow downloads the MobileNetV2 weights (~14MB). This is automatic.

**To disable AI** (if TF is too heavy for your server):
1. In `app/routes/items.py`, wrap the AI calls in `try/except` (already done)
2. The system works perfectly without AI — it just won't show category suggestions or similar items

---

## 📱 Feature Summary

| Feature | Status |
|---------|--------|
| Register / Login (email or college ID) | ✅ |
| JWT authentication | ✅ |
| Post lost/found items with images | ✅ |
| Responsive card grid with filters | ✅ |
| Real-time notifications (Socket.IO) | ✅ |
| Real-time live chat between users | ✅ |
| AI category suggestion from image | ✅ |
| AI image similarity matching | ✅ |
| AI text description matching | ✅ |
| Status tracking (lost/found/returned) | ✅ |
| Admin panel (users, items, stats) | ✅ |
| Search + filter (keyword, category, date, location) | ✅ |
| Pagination | ✅ |
| User profile management | ✅ |
| Mobile responsive | ✅ |

---

## 🎓 Built for IcfaiTech IFHE — Semester VI Project
Stack: React + Tailwind CSS + Flask + PostgreSQL + Socket.IO + TensorFlow MobileNetV2
