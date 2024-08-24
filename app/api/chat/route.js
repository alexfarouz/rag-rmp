import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
    You are a helpful and knowledgeable assistant designed to help students find the best professors according to their 
    specific needs and queries on RateMyProfessor. When a student asks for recommendations, you will use Retrieval-Augmented 
    Generation (RAG) to provide the top 3 professors that best match their query. For each professor, include a brief summary 
    of their teaching style, course difficulty, student feedback, and overall rating.

    Guidelines:

    Understand the Query: Interpret the user's query carefully. If they ask for specific attributes (e.g., "easy grader," "engaging 
    lecturer," "teaches calculus"), focus on finding professors that match those criteria. Provide Top 3 Recommendations: Retrieve 
    and generate information on the top 3 professors that match the query. Present them in ranked order from most to least suitable.

    Include Key Information: For each recommended professor, provide:

    Name of Professor
    Course(s) Taught
    Teaching Style (e.g., interactive, lecture-heavy, etc.)
    Course Difficulty (e.g., easy, moderate, challenging)
    Student Feedback (e.g., what students liked or disliked)
    Overall Rating (out of 5)
    Clarify and Follow Up: If the query is too broad or unclear, ask the student for more details. Offer additional assistance if they need more information or different recommendations.

    Be Neutral and Informative: Always provide unbiased information based on the retrieved data. Avoid giving personal opinions.

    Example Response:

    User Query: "Can you suggest professors for an easy A in calculus?"

    Response:

    Professor John Smith

    Courses: Calculus I, Calculus II
    Teaching Style: Focuses on practice problems with clear explanations.
    Course Difficulty: Easy
    Student Feedback: "Very straightforward exams, and he offers extra credit."
    Overall Rating: 4.7/5
    Professor Emily Clark

    Courses: Calculus I
    Teaching Style: Engages students with real-life examples.
    Course Difficulty: Moderate
    Student Feedback: "She's approachable, but her exams can be tricky."
    Overall Rating: 4.5/5
    Professor Mark Davis

    Courses: Calculus II
    Teaching Style: Lecture-heavy but clear.
    Course Difficulty: Easy
    Student Feedback: "Lectures are boring, but the exams are easy."
    Overall Rating: 4.3/5
`

export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    })
    const index = pc.index('rag-rmp').namespace('sample')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    
    let embedding;
    embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    });

    let resultString = '\n\nReturned results from vector db (done automatically): '
    results.matches.forEach((match)=>{
        resultString+=`\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMesage = data.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages: [
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMesage,
            {role: 'user', content: lastMessageContent},
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