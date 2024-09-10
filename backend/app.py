from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from rmp_utils import scrape_profs
from upload import upload_to_pinecone
from pinecone import Pinecone
from dotenv import load_dotenv
import numpy as np
import asyncio

# Set up basic configuration for logging
logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "https://rec-my-professors.vercel.app"}})  # Adjust this for specific origins if needed http://localhost:3000

load_dotenv(dotenv_path="../.env.local")
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index('rag-rmp')

@app.route('/process_professors', methods=['POST'])
def process_professors_endpoint():
    data = request.json
    school_name = data.get('school')
    department = data.get('department')


    if not school_name or not department:
        return jsonify({"error": "Missing information required"}), 400

    try:

        # Create a dummy vector filled with zeros
        dummy_vector = np.zeros(index.describe_index_stats()['dimension'])
        query_response = index.query(
            namespace=school_name,
            vector=dummy_vector.tolist(),
            top_k=1,
            include_metadata=True,
            filter={
                "department": {"$eq": department}
            },
        )
        print(query_response)

        if query_response['matches']:
            app.logger.info(f"Data for {school_name} - {department} already exists. Skipping scraping.")
            return jsonify({"message": "Data already exists. Skipping scraping."}), 200

    except Exception as e:
        app.logger.error(f"Error querying Pinecone: {e}")
        return jsonify({"error": "Error querying Pinecone"}), 500

    try:
        app.logger.info(f"Received request for school: {school_name} with filters: {department}")
        professors = asyncio.run(scrape_profs(school_name, department)) # Scrape professors from RMP
        
        upload_to_pinecone(professors, school_name) # Upload Professors to Pinecone
        app.logger.info(f"Processed professors for school: {school_name}")
        return jsonify({"message": "Professors processed and embeddings stored successfully"}), 200

    except Exception as e:
        error_message = f"Error occurred: {str(e)}"
        app.logger.error(error_message)
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use the PORT environment variable or default to 5000
    app.run(host='0.0.0.0', port=port)
