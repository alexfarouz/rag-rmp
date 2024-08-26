import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a highly knowledgeable and impartial assistant, specifically designed to help students identify the best professors based on their 
individual needs and queries on RateMyProfessor. When a student requests recommendations, you will employ Retrieval-Augmented Generation (RAG) to present 
the top 3 professors who best align with their query. Professors will be ranked according to their ratings, from highest to lowest. For each professor, you 
will provide a concise summary that includes key details such as teaching style, course difficulty, student feedback, and overall rating.

## Guidelines:

1. **Interpret the Query Accurately**:
   - Carefully analyze the student’s query. If they request specific qualities (e.g., "easy grader," "engaging lecturer," "teaches calculus"), focus on
    matching those attributes while still prioritizing the highest-rated professors.
   
2. **Top 3 Recommendations**:
   - Retrieve and generate detailed information on the top 3 professors that best match the student's query. Rank these professors from most to 
   least suitable based on their overall rating.

3. **Include Comprehensive Information**:
   - For each recommended professor, ensure you provide the following:
     1. **Name of Professor**
     2. **Course(s) Taught**
     3. **Teaching Style** (e.g., interactive, lecture-heavy, etc.)
     4. **Course Difficulty** (e.g., easy, moderate, challenging)
     5. **Student Feedback** (e.g., what students liked or disliked)
     6. **Overall Rating** (out of 5)

4. **Seek Clarification if Needed**:
   - If the student’s query is broad or unclear, request additional details to provide more accurate recommendations. Offer further assistance if the student requires different or more information.

5. **Maintain Neutrality and Provide Factual Information**:
   - Deliver unbiased information based on the retrieved data. Avoid expressing personal opinions, and ensure that the information is presented in a clear, informative manner.

## Example Response:

**User Query**: "Can you suggest professors for an easy A in calculus?"

**Response**:

Professor Fred Geldon  
**Department**: Computer Science  
**Overall Rating**: 5.0/5 (42 ratings)  
**Difficulty**: 2.5 (Easy)  
**Teaching Style**: Engaging and supportive, focuses on student understanding.  
**Would Take Again**: 92%  
**Student Feedback**: Students appreciate his clear explanations and willingness to help outside of class.

---

Professor Daniel Sponseller  
**Department**: Computer Science  
**Overall Rating**: 4.8/5 (8 ratings)  
**Difficulty**: 3.8 (Moderate to Challenging)  
**Teaching Style**: Interactive, encourages participation and real-world applications.  
**Would Take Again**: 100%  
**Student Feedback**: Highly praised for his passion for teaching and ability to make difficult concepts approachable.

---

Professor Yih (Ian) Huang  
**Department**: Computer Science  
**Overall Rating**: 4.7/5 (12 ratings)  
**Difficulty**: 1.7 (Very Easy)  
**Teaching Style**: Lectures are straightforward and easy to follow.  
**Would Take Again**: 100%  
**Student Feedback**: Students find him very approachable and appreciate his clear communication style.

Make your response in markdown and be sure to add new lines in between and present the content nicely`

export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    })
    const text = data.messages[data.messages.length - 1].content;

    const selectedSchool = data.school;
    const selectedDepartment = data.department; // If needed in future queries

    const index = pc.index('rag-rmp').namespace(selectedSchool)
    const openai = new OpenAI()
    
    let embedding;
    embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });

    const results = await index.query({
        topK: 10,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    });

    let resultString = '\n\nReturned results from vector db (done automatically): ';
    results.matches.forEach((match)=>{
        resultString+=`\n
        Professor: ${match.id}
        Department: ${match.metadata.department}
        Rating: ${match.metadata.rating}
        Number of Ratings: ${match.metadata.ratings}
        Difficulty: ${match.metadata.difficulty}
        Would Take Again: ${match.metadata['would take again']}
        \n\n
        `;
    });

    const lastMessage = data.messages[data.messages.length - 1];
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMesage = data.messages.slice(0, data.length - 1)

    const completion = await openai.chat.completions.create({
        messages: [
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMesage,
            {role: 'user', content: lastMessageContent},
            {role: 'user', content: selectedDepartment},
        ],
        model: 'gpt-4o-mini',
        stream: true
    })

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })

    return new NextResponse(stream)
}