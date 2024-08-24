'use client'
import { useState } from 'react';
import { Box, Grid, TextField, Typography, Button, Slider } from '@mui/material';

const Filters = () => {
    const [difficultyRange, setDifficultyRange] = useState([1,5]);
    const [course, setCourse] = useState();
    const [ratingRange, setRatingRange] = useState([1,5]);

    const handleCourseChange = (event, newValue) => {
        setCourse(newValue);
    }

    const handleDifficultyChange = (event, newValue) => {
        setDifficultyRange(newValue);
    };
    
    const handleRatingChange = (event, newValue) => {
        setRatingRange(newValue);
    }

  return (
    <Box border="1px solid #ddd" borderRadius={2} p={2}>
      <Typography variant="h6" gutterBottom>Filter Professors</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Course" variant="outlined" value={course} onChange={handleCourseChange}/>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Teaching Style" variant="outlined" />
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography gutterBottom>Difficulty Level</Typography>
          <Box sx={{ marginLeft: '10px', width: 'calc(100% - 10px)' }}>
            <Slider
              value={difficultyRange}
              onChange={handleDifficultyChange}
              valueLabelDisplay="auto"
              min={1} max={5}
              sx={{
                  color: '#000',
                  '& .MuiSlider-thumb': {
                      width: 14,
                      height: 14,
                      backgroundColor: '#fff',
                      border: '2px solid #000',
                  },
                  '& .MuiSlider-track': {
                      border: 'none',
                  },
                  '& .MuiSlider-rail': {
                      opacity: 1,
                      backgroundColor: '#ccc',
                  },
              }}
            />
            <Typography>
              Selected Range: {difficultyRange[0]} - {difficultyRange[1]}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <Box sx={{ marginLeft: '10px', width: 'calc(100% - 10px)' }}>
            <TextField fullWidth label="Availability Outside Class" variant="outlined" />
          </Box>
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography gutterBottom>Rating</Typography>
          <Box sx={{ marginLeft: '10px', width: 'calc(100% - 10px)' }}>
            <Slider
              value={ratingRange}
              onChange={handleRatingChange}
              valueLabelDisplay="auto"
              min={1}
              max={5}
              sx={{
                  color: '#000',
                  '& .MuiSlider-thumb': {
                      width: 14,
                      height: 14,
                      backgroundColor: '#fff',
                      border: '2px solid #000',
                  },
                  '& .MuiSlider-track': {
                      border: 'none',
                  },
                  '& .MuiSlider-rail': {
                      opacity: 1,
                      backgroundColor: '#ccc',
                  },
              }}
            />
            <Typography>
              Selected Range: {ratingRange[0]} - {ratingRange[1]}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      <Button variant="contained"
        sx={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '8px',
          textTransform: 'none',
          marginTop: '10px',
          '&:hover': {
            backgroundColor: '#333',
          },
        }}>
            Search Professors
        </Button>
    </Box>
  );
};

export default Filters;