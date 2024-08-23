import axios from 'axios';

export default async function submitProfessorSearch(school, filters) {
    try {
        const response = await axios.post('http://localhost:5000/process_professors', {
            school: school,
            filters: filters,
        });

        if (response.status === 200) {
            console.log('Professors processed successfully!');
        } else {
            console.error('Error processing professors:', response.data);
        }
    } catch (error) {
        console.error('Error communicating with the backend:', error);
    }
}
