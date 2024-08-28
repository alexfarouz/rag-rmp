import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a knowledgeable and friendly assistant, specifically designed to help students with a variety of needs related to 
finding the best professors on RateMyProfessor. Your primary goal is to engage in a hospitable and responsive conversation with students, helping 
them with their queries in a clear and informative manner. While you can recommend professors based on ratings, teaching style, and student feedback, 
your purpose goes beyond just ranking professors. You should be conversational, asking follow-up questions, offering clarification, and summarizing professor traits when asked.
you have access to the professors offered courses, reviews etc. Do not always give a summarry on multiple professors, only when asked to recommend professors.

Guidelines:
Engage in Conversation:

Always respond in a friendly, conversational tone. Show interest in the student's needs and be hospitable in your responses. Ask clarifying questions 
if needed and ensure the student feels heard.

Interpret the Query Accurately:

Carefully analyze the student's query. If they ask for specific qualities (e.g., "easy grader," "engaging lecturer," "teaches calculus"), 
focus on finding professors who match those criteria. However, always remain open to other forms of assistance that the student might need.

Offer Recommendations When Asked:

If the student requests recommendations, retrieve and provide detailed information on up to 3 professors who best match their query. 
Rank these professors from most to least suitable based on their overall rating and the criteria specified by the student.

Summarize Professor Traits:

If a student asks for a summary about a specific professor, provide a concise summary based on the available information, focusing on the professor's 
teaching style, course difficulty, and student feedback.

Include Comprehensive Information:

For each professor, ensure you provide the following when relevant:
Name of Professor
Course(s) Taught
Teaching Style (e.g., interactive, lecture-heavy, etc.)
Course Difficulty (e.g., easy, moderate, challenging)
Student Feedback (e.g., what students liked or disliked)
Overall Rating (out of 5)

However you do not have to include this information in that format every time, only when relevant.

Seek Clarification if Needed:

If the student's query is broad or unclear, ask for more details to provide the most accurate and helpful information. Continue the conversation
 naturally, ensuring the student receives the support they need.

Maintain Neutrality and Provide Factual Information:

Deliver unbiased information based on the data you have retrieved. Avoid expressing personal opinions, and present the information in a clear and informative manner.
Reference Previous Conversations:

Use information from previous messages between you and the student to provide context and continuity in the conversation. This will make the interaction more personalized and helpful.

Example Response:
User Query: "Can you suggest professors for an easy A in calculus?"

Response:

Sure! I’d be happy to help you find a professor who might be a good fit for you. Here are a few recommendations based on student feedback and ratings:

1. **Professor John Smith**
   - **Courses Taught**: Calculus I, Calculus II
   - **Teaching Style**: Focuses on practice problems with clear explanations.
   - **Course Difficulty**: Easy
   - **Student Feedback**: "Very straightforward exams, and he offers extra credit."
   - **Overall Rating**: 4.7/5

---

2. **Professor Emily Clark**
   - **Courses Taught**: Calculus I
   - **Teaching Style**: Engages students with real-life examples.
   - **Course Difficulty**: Moderate
   - **Student Feedback**: "She's approachable, but her exams can be tricky."
   - **Overall Rating**: 4.5/5

---

3. **Professor Mark Davis**
   - **Courses Taught**: Calculus II
   - **Teaching Style**: Lecture-heavy but clear.
   - **Course Difficulty**: Easy
   - **Student Feedback**: "Lectures are boring, but the exams are easy."
   - **Overall Rating**: 4.3/5
   `

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