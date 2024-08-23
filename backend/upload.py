from dotenv import load_dotenv
import os
from openai import OpenAI
from pinecone import Pinecone

load_dotenv(dotenv_path='../.env.local')

openai_api_key = os.getenv("OPENAI_API_KEY")
pinecone_api_key=os.getenv("PINECONE_API_KEY")

def upload_to_pinecone(professors, school):
    pc = Pinecone(pinecone_api_key)
    client = OpenAI()
    
    processed_data = []
    

    for prof in professors:
        response = client.embeddings.create(
            input=prof,
            model="text-embedding-3-small",
        )
        embedding=response.data[0].embedding
        processed_data.append({
            "values": embedding,
            "id": prof["name"],
            "metadata": {
                "department": prof["department"],
                "url": prof["url"],
                "rating": prof["rating"],
                "ratings": prof["ratings"],
                "would take again": prof["would take again"],
                "difficulty": prof["difficulty"]
            }
        })

    index = pc.Index('rag-rmp') # Get the index from pinecone

    stats = index.describe_index_stats() # Describe stats to get the current namespaces
    current_namespaces = stats['namespaces']

    if len(current_namespaces) >= 100:
        # Find the 10th namespace to delete
        sorted_namespaces = sorted(current_namespaces.items(), key=lambda x: x[1]['vector_count'])
        namespace_to_delete = sorted_namespaces[9][0]
        
        # Delete the 10th namespace
        index.delete_namespace(namespace=namespace_to_delete)
        print(f"Deleted namespace: {namespace_to_delete}")

    # Upsert the new vectors into the specified namespace
    index.upsert(
        vectors=processed_data,
        namespace=school,
    )

#professors = [{'name': 'Narsin Akhter', 'department': 'Computer science', 'rating': '1.0', 'ratings': '2 ratings', 'would take again': '0%', 'difficulty': '1', 'url': 'https://www.ratemyprofessors.com/professor/2570216'}]
#upload_to_pinecone(professors, "George Mason University")