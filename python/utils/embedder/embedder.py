import json
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Load the embedding model (BAAI/bge-small-en-v1.5)
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

# Load your original product JSON file
with open("../../../data/raw/items.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# Function to flatten each product to a clean text string
def format_product_for_embedding(product):
    name = product.get("name", "")
    desc = product.get("description", "").replace("\r", " ").replace("\n", " ")
    brand = product.get("brand", {}).get("name", "")
    
    # Get first price if available
    price_info = product.get("priceSpecification", [{}])
    if isinstance(price_info, list) and price_info:
        price = price_info[0].get("price", "")
        currency = price_info[0].get("priceCurrency", "")
    else:
        price, currency = "", ""

    return f"{name}. {desc} Brand: {brand}. Price: {price} {currency}."

# Create embeddings
embedded_products = []
for product in tqdm(products, desc="Embedding products"):
    text = format_product_for_embedding(product)
    embedding = model.encode(text).tolist()  # convert numpy to list for JSON serializing
    embedded_products.append({
        "product": product,
        "embedding": embedding
    })

# Save to a new JSON file
with open("embedded_products.json", "w", encoding="utf-8") as f:
    json.dump(embedded_products, f, indent=2)
