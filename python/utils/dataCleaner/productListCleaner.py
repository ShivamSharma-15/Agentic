import json

def extract_product_details(input_json_file):
    """
    Extracts specific details from a JSON file containing product data.

    Args:
        input_json_file (str): The path to the input JSON file.

    Returns:
        list: A list of dictionaries, each containing the extracted product details.
    """
    extracted_data = []
    with open(input_json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for product in data:
        extracted_product = {
            "name": product.get("name"),
            "description": product.get("description"),
            "image": product.get("image")[0] if product.get("image") else None,
            "brand": product.get("brand"),
            "priceSpecification": product.get("offers", {}).get("priceSpecification"),
            "url": product.get("offers", {}).get("url")
        }
        extracted_data.append(extracted_product)

    return extracted_data

if __name__ == "__main__":
    input_file = "this.json"
    output_file = "product_details.json"

    try:
        extracted_details = extract_product_details(input_file)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted_details, f, indent=2)

        print(f"Successfully extracted details and saved to '{output_file}'")
    except FileNotFoundError:
        print(f"Error: The input file '{input_file}' was not found. Please make sure 'this.json' is in the same directory as the script.")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_file}'. Please check if the file contains valid JSON data.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")