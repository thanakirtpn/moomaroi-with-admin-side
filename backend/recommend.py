from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import numpy as np

app = FastAPI()

# โหลดโมเดล
model = SentenceTransformer('all-MiniLM-L6-v2')

# รูปแบบข้อมูล input
class RecommendInput(BaseModel):
    user_input: str
    menu_data: list
    table_id: str | None = None  # เพิ่ม table_id เป็น optional

# รายการ stop words
STOP_WORDS = {"i", "want", "to", "a", "an", "the", "food", "meal", "please", "with", "and", "or", "for"}

@app.post("/recommend")
async def recommend(input: RecommendInput):
    # Debug: ล็อกข้อมูลที่ได้รับ
    print(f"📥 Received request: user_input={input.user_input}, table_id={input.table_id}, menu_data_length={len(input.menu_data)}")

    # เตรียมข้อมูล
    user_input = input.user_input.lower().strip()
    menu_data = input.menu_data
    table_id = input.table_id
    top_k = 3

    # ตรวจสอบ user_input
    if not user_input:
        print("❌ No user_input provided")
        return {
            "recommendations": [],
            "message": "Please provide input"
        }

    # อนุญาต menu_data ว่าง
    if not menu_data:
        print("⚠️ No menu_data provided")
        return {
            "recommendations": [],
            "message": f"No menu data available for table {table_id or 'unknown'}"
        }

    # แยกคำใน user_input และลบ stop words
    input_words = [word for word in user_input.split() if word not in STOP_WORDS]
    cleaned_input = " ".join(input_words)

    # ขั้นตอนที่ 1: หาเมนูที่ตรงเป๊ะ
    exact_matches = []
    for item in menu_data:
        name = item.get("name_eng", "").lower()
        tags = item.get("tags", "").lower()
        category = item.get("category", "").lower()
        if any(word in name or word in tags or word in category for word in input_words):
            exact_matches.append(item)

    if exact_matches:
        recommendations = [
            {
                "name": item["name_eng"],
                "description": item["short_description"],
                "price": f"{item['price_starts_at']}"
            }
            for item in exact_matches[:top_k]
        ]
        print(f"✅ Found {len(recommendations)} exact matches")
        return {
            "recommendations": recommendations,
            "message": f"Here are the matching dishes for table {table_id or 'unknown'}"
        }

    # ขั้นตอนที่ 2: หาเมนูที่ใกล้เคียง
    category_list = []
    suggestion_type = "dishes"
    if any(word in cleaned_input for word in ["coffee", "tea", "drink", "water"]):
        category_list = ["drinks", "beverage"]
        suggestion_type = "drinks"
    elif any(word in cleaned_input for word in ["cake", "chocolate", "ice cream", "dessert", "sweet", "brownie", "pudding"]):
        category_list = ["dessert"]
        suggestion_type = "desserts"
    elif any(word in cleaned_input for word in ["spicy", "chili", "herbs", "thai"]):
        category_list = ["main dish", "spicy basil", "curry & soup", "rice dishes"]
        suggestion_type = "spicy dishes"
    elif any(word in cleaned_input for word in ["vegetables", "big"]):
        category_list = ["vegetable dishes", "main dish", "rice dishes", "curry & soup"]
        suggestion_type = "vegetable dishes"
    elif any(word in cleaned_input for word in ["rice", "fried rice"]):
        category_list = ["rice", "main dish"]
        suggestion_type = "rice dishes"
    elif any(word in cleaned_input for word in ["noodle", "pasta"]):
        category_list = ["noodle", "pasta"]
        suggestion_type = "noodles"
    elif any(word in cleaned_input for word in ["soup", "curry"]):
        category_list = ["soup", "curry"]
        suggestion_type = "soups"
    elif any(word in cleaned_input for word in ["japanese", "sushi", "yakiniku", "ramen"]):
        category_list = ["japanese dishes"]
        suggestion_type = "japanese dishes"

    filtered_menu = []
    if suggestion_type == "vegetable dishes":
        filtered_menu = [
            item for item in menu_data
            if item.get("category", "").lower() == "vegetable dishes"
        ]
        if not filtered_menu:
            filtered_menu = [
                item for item in menu_data
                if any(cat.lower() in item.get("category", "").lower() for cat in category_list)
                and "vegetables" in item.get("tags", "").lower()
            ]
    elif suggestion_type == "japanese dishes":
        filtered_menu = [
            item for item in menu_data
            if any(tag in item.get("tags", "").lower() for tag in ["japanese", "sushi", "yakiniku", "ramen"])
            or item.get("category", "").lower() == "japanese dishes"
        ]
    else:
        filtered_menu = [
            item for item in menu_data
            if any(cat.lower() in item.get("category", "").lower() for cat in category_list)
        ]

    if filtered_menu:
        menu_texts = [
            f"{item.get('name_eng', '')} {item.get('tags', '')} {item.get('full_description', '')}"
            for item in filtered_menu
        ]
        try:
            menu_embeddings = model.encode(menu_texts, convert_to_tensor=True)
            user_embedding = model.encode(cleaned_input, convert_to_tensor=True)
            similarities = util.cos_sim(user_embedding, menu_embeddings)[0].cpu().numpy()
            threshold = 0.3
            valid_indices = np.where(similarities >= threshold)[0]

            if len(valid_indices) > 0:
                top_indices = np.argsort(similarities[valid_indices])[::-1][:top_k]
                top_indices = valid_indices[top_indices]
                recommendations = [
                    {
                        "name": filtered_menu[idx]["name_eng"],
                        "description": filtered_menu[idx]["short_description"],
                        "price": f"{filtered_menu[idx]['price_starts_at']}"
                    }
                    for idx in top_indices
                ]
                print(f"✅ Found {len(recommendations)} similar matches")
                return {
                    "recommendations": recommendations,
                    "message": f"No exact matches for {suggestion_type}, but these might suit your taste for table {table_id or 'unknown'}"
                }
        except Exception as e:
            print(f"❌ Error processing embeddings: {str(e)}")
            return {
                "recommendations": [],
                "message": f"Error processing recommendations: {str(e)}"
            }

    # ขั้นตอนที่ 3: Fallback
    fallback_menu = []
    if suggestion_type == "drinks":
        fallback_menu = [
            item for item in menu_data
            if item.get("category", "").lower() in ["drinks", "beverage"]
        ]
    elif suggestion_type == "desserts":
        fallback_menu = [
            item for item in menu_data
            if item.get("category", "").lower() == "dessert"
        ]
    elif suggestion_type == "spicy dishes":
        fallback_menu = [
            item for item in menu_data
            if any(tag in item.get("tags", "").lower() for tag in ["spicy", "chili", "herbs", "basil", "thai"])
        ]
    elif suggestion_type == "vegetable dishes":
        fallback_menu = [
            item for item in menu_data
            if item.get("category", "").lower() == "vegetable dishes"
        ]
        if not fallback_menu:
            fallback_menu = [
                item for item in menu_data
                if "vegetables" in item.get("tags", "").lower()
                and item.get("category", "").lower() in ["main dish", "rice dishes", "curry & soup"]
            ]
    elif suggestion_type == "japanese dishes":
        fallback_menu = [
            item for item in menu_data
            if any(tag in item.get("tags", "").lower() for tag in ["japanese", "sushi", "yakiniku", "ramen"])
            or item.get("category", "").lower() == "japanese dishes"
        ]

    if fallback_menu:
        recommendations = [
            {
                "name": item["name_eng"],
                "description": item["short_description"],
                "price": f"{item['price_starts_at']}"
            }
            for item in fallback_menu[:top_k]
        ]
        print(f"✅ Fallback to {len(recommendations)} dishes")
        return {
            "recommendations": recommendations,
            "message": f"No exact matches for {suggestion_type}, but these might suit your taste for table {table_id or 'unknown'}"
        }

    print("⚠️ No recommendations found")
    return {
        "recommendations": [],
        "message": f"Sorry, we couldn't find any dishes for table {table_id or 'unknown'}"
    }

@app.get("/test")
async def test():
    return {"message": "Server is running"}