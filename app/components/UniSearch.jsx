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
  const [department, setDepartment] = useState('');

  // Load universities from the JSON file
  useEffect(() => {
    setUniversities(universitiesData); // Load data from the JSON file
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Preserve spaces and uppercase letters as the user types
    setShowDropdown(true);
  };

  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value); // Update the department state
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
        // Save university to Firebase
        await setDoc(doc(db, 'users', user.id), { 
          university: selectedUniversity,
          department: department
        }, { merge: true });
        
        // Send request to the backend to process the professors
        const response = await fetch('http://localhost:5000/process_professors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            school: selectedUniversity,
            department: department
          }),
        });

        const result = await response.json();
        console.log(result)

        if (response.ok) {
          alert('University, department, and professors processed successfully!');
        } else {
          alert('Error processing professors: ' + result.error);
        }

      } catch (error) {
        console.error('Error saving university to Firestore or processing professors:', error);
        alert('Failed to save university or process professors. Please try again.');
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
      {/* New Department Input */}
      <input
        type="text"
        value={department} // Ensure the input reflects the department state
        onChange={handleDepartmentChange}
        placeholder="Enter your department"
        style={{ width: '100%', padding: '10px', marginTop: '10px', boxSizing: 'border-box' }}
      />

      <Button
        variant="contained"
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
        }}
        onClick={saveUniversityToFirebase} // Ensure the button calls the save function
      >
        Save University and Department
      </Button>
    </div>
  );
}
