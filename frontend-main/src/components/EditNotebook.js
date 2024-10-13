import React, { useState, useEffect } from 'react';
import { useParams} from 'react-router-dom';
import axios from 'axios';
import Canvas from './Canvas';

const API_BASE_URL = 'http://localhost:5000/api';

const EditNotebook = () => {
    const { notebookName } = useParams();
    //const navigate = useNavigate();
    const [notebook, setNotebook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotebook = async () => {
            if (!notebookName) {
                setError('Notebook name is required.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/notebooks/${notebookName}`);
                setNotebook(response.data);
            } catch (err) {
                setError('Failed to load notebook. Please try again.');
                console.error('Error loading notebook:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotebook();
    }, [notebookName]);

    if (isLoading) return <div>Loading notebook...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!notebook) return <div>Notebook not found.</div>;

    return (
        <div>
            <Canvas notebookName={notebookName} initialElements={notebook.elements} />
        </div>
    );
};

export default EditNotebook;