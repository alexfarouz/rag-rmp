import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button } from "@mui/material";
import { db } from '../../firebase'; // Import Firebase Firestore instance
import { doc, setDoc } from 'firebase/firestore';
import { useUser } from '@clerk/nextjs';
import universitiesData from '../../universities.json'; // Import your JSON file

export default function UniSearch() {
  const { user } = useUser(); // Use Clerk to get the current user
  const [universities, setUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');

  // Load universities from the JSON file
  useEffect(() => {
    setUniversities(universitiesData); // Load data from the JSON file
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Preserve spaces and uppercase letters as the user types
    setShowDropdown(true);
  };

  // Memoize the filtered results to avoid unnecessary recomputation
  const filteredUniversities = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    if (normalizedSearchTerm === '') return [];

    return universities
      .filter(university =>
        university.name.toLowerCase().includes(normalizedSearchTerm)
      )
      .slice(0, 10); // Limit to top 10 results for better performance
  }, [searchTerm, universities]);

  const handleUniversitySelect = (universityName) => {
    setSelectedUniversity(universityName);
    setSearchTerm(universityName); // Autofill the search bar with the selected university name
    setShowDropdown(false);
  };

  const saveUniversityToFirebase = async () => {
    if (selectedUniversity && user) {
      try {
        await setDoc(doc(db, 'users', user.id), { 
          university: selectedUniversity,
        }, { merge: true });
        alert('University saved successfully!');
      } catch (error) {
        console.error('Error saving university to Firestore:', error);
        alert('Failed to save university. Please try again.');
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={searchTerm} // Ensure the input reflects the search term state
        onChange={handleSearchChange}
        placeholder="Search and select university"
        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
      />
      {showDropdown && filteredUniversities.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            zIndex: 1000,
          }}
        >
          {filteredUniversities.map((university, index) => (
            <li
              key={index}
              onClick={() => handleUniversitySelect(university.name)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
              }}
            >
              {university.name}
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={saveUniversityToFirebase}
        disabled={!selectedUniversity}
      >
        Save University
      </Button>
    </div>
  );
}
