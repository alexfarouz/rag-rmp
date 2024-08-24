'use client'
import { useEffect, useState } from 'react';
import { Box, Button, Grid, TextField, Typography, Stack } from "@mui/material";
import Chat from './Chat'; // Import the Chat component
import UniSearch from './UniSearch';
import Filters from './Filters';

export default function Dashboard() {
  
  return (
    <Box sx={{ padding: 2 }}>
      <Grid container >
        {/* Left Side */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>

            {/* School Selection Section */}
            <Box border="1px solid #ddd" borderRadius={2} p={2}>
              <Typography variant="h6" gutterBottom>Select Your University and Department</Typography>
              <UniSearch />
            </Box>

            {/* Submit Professor Rating URL Section */}
            <Box border="1px solid #ddd" borderRadius={2} p={2}>
              <Typography variant="h6" gutterBottom>Submit Professor Rating URL</Typography>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="Enter Rate My Professor URL" variant="outlined" />
                <Button variant="contained">Submit Link</Button>
              </Stack>
            </Box>

            {/* Import and Use Filters Component */}
            <Filters />

            {/* Add Professor Rating Section */}
            <Box border="1px solid #ddd" borderRadius={2} p={2}>
              <Typography variant="h6" gutterBottom>Add Professor Rating</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Professor Name" variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Subject" variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Teaching Style" variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Difficulty Level" variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Grading Fairness" variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Availability Outside Class" variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Overall Rating (1-5)" variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Write your review here..." multiline rows={4} variant="outlined" />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                sx={{
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    textTransform: 'none',
                    '&:hover': {
                    backgroundColor: '#333',
                    },
                }}
                className="mt-3"
                >
                    Submit Rating
                </Button>
            </Box>
          </Stack>
        </Grid>

        {/* Right Side - Import the Chat component here */}
        <Grid item xs={12} md={5}>
          <Chat />
        </Grid>
      </Grid>
    </Box>
  );
}
