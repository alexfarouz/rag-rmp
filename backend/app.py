from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from rmp_utils import scrape_professors_by_department
from upload import upload_to_pinecone

# Set up basic configuration for logging
logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Adjust this for specific origins if needed

@app.route('/process_professors', methods=['POST'])
def process_professors_endpoint():
    data = request.json
    school_name = data.get('school')
    department = data.get('department')

    if not school_name or not department:
        return jsonify({"error": "Missing information required"}), 400
    
    try:
        app.logger.info(f"Received request for school: {school_name} with filters: {department}")
        professors = scrape_professors_by_department(school_name, department) # Scrape professors from RMP
        
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
