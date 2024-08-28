'use client'
import { Box, Stack, TextField } from "@mui/material";
import { Button } from "@/components/ui/button"
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";

export default function Home({ selectedSchool, selectedDepartment }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?",
    }
  ]);

  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' },
    ]);

    setMessage(''); 
    const response = fetch('/api/chat', { 
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: message }],
        school: selectedSchool,
        department: selectedDepartment
      }),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      className="pt-10"
    >
      <Stack direction="column"
        width="100%"
        maxWidth="1200px"
        height="700px"
        border="1px solid #aaa"
        className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white rounded-xl"
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
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'rgba(0, 0, 0, 0.6)' // Black with transparency
                    : 'rgba(100, 100, 100, 0.6)' // Dark gray for user messages
                }
                color="white"
                borderRadius={16}
                p={3}
                width="fit-content"
                maxWidth="75%" // Limit the width to 75% of the container
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <Input label="Message" fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <Button variant="contained" onClick={sendMessage} className="bg-black">Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
