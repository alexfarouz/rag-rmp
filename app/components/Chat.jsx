'use client'
import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?",
    }
  ])

  const [message, setMessage] = useState('')
  
  const sendMessage = async () => {
    setMessages((messages) => [ // Correctly updates the state using the previous state
      ...messages,
      { role: "user", content: message }, // Adds the user's message to the list
      { role: "assistant", content: '' }, // Placeholder for the assistant's response
    ]);

    setMessage('') // Sets the initial system response to empty
    const resposnse = fetch('/api/chat', { // Fetching from OpenAI API
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: "user", content: message}]), // The user message passed to api
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({done, value}){ // Process system text
        if(done){
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  return (
    
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      className="pt-10"
    >
      <Stack direction="column"
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack direction="column" spacing={2} 
          flexGrow={1} 
          overflow={"auto"} 
          maxHeight={'100%'}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color = "white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Message" fullWidth
            value={message}
            onChange={(e)=>{
              setMessage(e.target.value)
            }} 
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
