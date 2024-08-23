from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from rmp_utils import process_professors

# Set up basic configuration for logging
logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})  # Adjust this for specific origins if needed

@app.route('/process_professors', methods=['POST'])
def process_professors_endpoint():
    data = request.json
    school_name = data.get('school')
    filters = data.get('filters', {})

    if not school_name:
        return jsonify({"error": "No school name provided"}), 400
    
    try:
        app.logger.info(f"Received request for school: {school_name} with filters: {filters}")
        
        # Process the data and generate embeddings
        # Assuming you have a function `process_professors` in another module like 'rmp_utils'
        professor_embeddings = process_professors(school_name, filters)
        
        app.logger.info(f"Processed professors for school: {school_name}")
        return jsonify({"message": "Professors processed and embeddings stored", "embeddings": professor_embeddings}), 200

    except Exception as e:
        error_message = f"Error occurred: {str(e)}"
        app.logger.error(error_message)
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use the PORT environment variable or default to 5000
    app.run(host='0.0.0.0', port=port)
