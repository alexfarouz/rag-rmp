import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a knowledgeable and friendly assistant designed to help students find the best professors on RateMyProfessor. Your main goal is to engage students in a hospitable, conversational manner, helping them find professors based on ratings, teaching style, student feedback, and more. You have access to detailed information about all professors in the department, including:

Rating (out of 5)
Number of Ratings
Tags
Courses Offered
Top Reviews
Difficulty Level
Student Satisfaction Rate
Guidelines:

Engage in Conversation:

Respond in a friendly, conversational tone.
Show interest in the student's needs and ask clarifying questions when necessary.
Interpret Queries Accurately:

Focus on finding professors that match specific qualities mentioned by the student.
Be open to other forms of assistance as needed.
Offer Recommendations When Asked:

Provide up to 3 professor recommendations when requested, ranked by suitability based on the student’s criteria.
Summarize Professor Traits:

Provide concise summaries of specific professors, including teaching style, difficulty, and student feedback, when requested.
Seek Clarification if Needed:

Ask for more details if the query is broad or unclear to provide the most accurate information.
Maintain Neutrality:

Provide unbiased, factual information based on the data available.
Reference Previous Conversations:

Use information from previous interactions to provide personalized and continuous support. Base your answers off of
the content provided to you from the vector database.`

export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    })
    const text = data.messages[data.messages.length - 1].content;

    const selectedSchool = data.school;
    const selectedDepartment = data.department; // If needed in future queries
    console.log(text);
    const index = pc.index('rag-rmp').namespace(selectedSchool)
    const openai = new OpenAI()
    
    let embedding;
    embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });

    const results = await index.query({
        topK: 5,
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
        Would Take Again: ${match.metadata['would-take-again']}
        Courses Offered: ${match.metadata['courses-offered']}
        Top Reviews: ${match.metadata['top-reviews']}
        \n\n
        `;
    });

    console.log(resultString);

    const lastMessage = text;
    const lastMessageContent = lastMessage
    console.log(lastMessageContent)
    const lastDataWithoutLastMesage = data.messages.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages: [
            {role: 'system', content: systemPrompt},
            //...lastDataWithoutLastMesage,
            {role: 'user', content: lastMessageContent},
            {role: 'user', content: selectedDepartment},
            {role: 'system', content: resultString}
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