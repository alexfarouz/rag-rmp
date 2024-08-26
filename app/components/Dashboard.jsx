'use client'
import { useEffect, useState } from 'react';
import { Box, Grid, TextField, Typography, Stack } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Chat from './Chat';
import UniSearch from './UniSearch';
import Filters from './Filters';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useUser } from '@clerk/nextjs';

export default function Dashboard() {

  const { user } = useUser();
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          const db = getFirestore();
          const userDoc = doc(db, "users", user.id);
          const docSnap = await getDoc(userDoc);
  
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setSelectedSchool(userData.university || '');
            setSelectedDepartment(userData.department || '');
          } else {
            console.error("No such document!");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchUserData();
  }, [user]);
  

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2}>
        {/* Left Side */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>

            {/* School Selection Section */}
            <Box border="1px solid #ddd" borderRadius={2} p={2} className="bg-[#fafcff]">
              <Typography variant="h6" gutterBottom>Select Your University and Department</Typography>
              <UniSearch />
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
        <Grid item xs={12} md={8}>
          {/* Submit Professor Rating URL Section */}
          <Box border="1px solid #ddd" borderRadius={2} p={2} className="bg-[#fafcff]">
            <Typography variant="h6" gutterBottom>Summarize Professor</Typography>
            <Stack direction="row" spacing={2}>
              <Input fullWidth placeholder="Enter Rate My Professor URL" variant="outlined" className="w-full px-3 py-2 
                border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text"/>
              <Button variant="contained" className="p-2 text-white bg-black hover:bg-[#333] text-sm">Submit Link</Button>
            </Stack>
          </Box>
          <Chat selectedSchool={selectedSchool} selectedDepartment={selectedDepartment}/>
        </Grid>
      </Grid>
    </Box>
  );
}
