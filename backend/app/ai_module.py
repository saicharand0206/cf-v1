"""
app/ai_module.py  —  AI features using MobileNetV2 (pretrained, no training needed)

Features:
  1. predict_category(image_path)     → string category label
  2. get_image_embedding(image_path)  → list[float] (1280-dim vector)
  3. find_similar_items(embedding, exclude_id) → list of similar item dicts
  4. match_by_text(description, exclude_id)    → list of similar item dicts
"""

import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# ── Lazy model loading (loaded once on first call) ──────────────────────────
_model = None
_preprocess = None

CATEGORIES = ["phone", "wallet", "bag", "id_card", "keys", "book", "laptop", "other"]

# ImageNet class → our category mapping (top-level heuristics)
IMAGENET_MAP = {
    # Phones / electronics
    "cellular_telephone": "phone", "dial_telephone": "phone",
    "laptop": "laptop", "notebook": "laptop",
    "backpack": "bag", "mailbag": "bag", "purse": "bag", "handbag": "bag",
    "wallet": "wallet", "envelope": "wallet",
    "key": "keys",
    "book_jacket": "book",
}


def _load_model():
    global _model, _preprocess
    if _model is None:
        # Import here to avoid long startup if TF isn't needed
        import tensorflow as tf
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        from tensorflow.keras.models import Model

        base = MobileNetV2(weights="imagenet", include_top=True)
        # Feature extractor: output of last conv layer (global avg pool)
        _model    = Model(inputs=base.input, outputs=base.layers[-2].output)
        _preprocess = preprocess_input
    return _model, _preprocess


def _read_image(image_path: str):
    import tensorflow as tf
    img = tf.keras.utils.load_img(image_path, target_size=(224, 224))
    arr = tf.keras.utils.img_to_array(img)
    return arr


def get_image_embedding(image_path: str) -> list:
    if tf is None:
        return None

    model, preprocess = _load_model()

    arr = _read_image(image_path)
    arr = preprocess(arr)
    arr = np.expand_dims(arr, axis=0)

    embedding = model.predict(arr, verbose=0)[0]
    return embedding.tolist()





def predict_category(image_path: str) -> str:
    if tf is None:
        return None

    try:
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.applications.mobilenet_v2 import (
            preprocess_input, decode_predictions
        )
    except:
        return None

    full_model = MobileNetV2(weights="imagenet", include_top=True)

    arr = _read_image(image_path)
    arr = preprocess_input(arr)
    arr = np.expand_dims(arr, axis=0)

    preds = full_model.predict(arr, verbose=0)
    labels = decode_predictions(preds, top=5)[0]

    return "other"


def find_similar_items(embedding: list, exclude_id: int, top_k: int = 5) -> list:
    """
    Compare given embedding against all items with stored embeddings.
    Returns top_k most similar items (excluding the query item itself).
    """
    from app.models import Item  # imported here to avoid circular import

    items_with_feat = Item.query.filter(
        Item.image_feat.isnot(None),
        Item.id != exclude_id
    ).all()

    if not items_with_feat:
        return []

    query_vec = np.array(embedding).reshape(1, -1)
    scored    = []

    for item in items_with_feat:
        try:
            vec = np.array(json.loads(item.image_feat)).reshape(1, -1)
            sim = cosine_similarity(query_vec, vec)[0][0]
            scored.append((sim, item))
        except Exception:
            continue

    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {**item.to_dict(), "similarity": round(float(sim), 3)}
        for sim, item in scored[:top_k]
    ]


def match_by_text(description: str, exclude_id: int, top_k: int = 5) -> list:
    """
    TF-IDF cosine similarity between descriptions.
    Returns top_k most similar items.
    """
    from app.models import Item  # imported here to avoid circular import

    items = Item.query.filter(
        Item.description.isnot(None),
        Item.id != exclude_id
    ).all()

    if not items:
        return []

    descriptions = [description] + [i.description or "" for i in items]

    try:
        tfidf  = TfidfVectorizer(stop_words="english")
        matrix = tfidf.fit_transform(descriptions)
        sims   = cosine_similarity(matrix[0:1], matrix[1:])[0]

        indexed = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)
        results = []
        for idx, score in indexed[:top_k]:
            if score > 0.1:   # minimum relevance threshold
                results.append({
                    **items[idx].to_dict(),
                    "text_similarity": round(float(score), 3)
                })
        return results
    except Exception:
        return []
