// src/components/NotebookList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const NotebookList = () => {
    const [notebooks, setNotebooks] = useState([]);

    useEffect(() => {
        const fetchNotebooks = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/notebooks');
                setNotebooks(response.data);
            } catch (error) {
                console.error('Error fetching notebooks:', error);
            }
        };
        fetchNotebooks();
    }, []);

    const handleDelete = async (notebook) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete "${notebook}"?`);
        if (confirmDelete) {
            try {
                await axios.delete(`http://localhost:5000/api/notebooks/${notebook}`);
                setNotebooks(prev => prev.filter(nb => nb !== notebook)); // Remove deleted notebook from state
                alert('Notebook deleted successfully!');
            } catch (error) {
                console.error('Error deleting notebook:', error);
                alert('Failed to delete notebook. Please try again.');
            }
        }
    };

    return (
        <div className="notebook-list">
            <h1>Notebooks</h1>
            <ul>
                {notebooks.map((notebook, index) => (
                    <li key={index}>
                    <Link to={`/edit/${notebook}`} className='list-obj'>{notebook}</Link>
                    <button className="delete-button" onClick={() => handleDelete(notebook)}>🗑️</button>
                </li>
                
                ))}
            </ul>
            <Link to="/create" className='createButton'>Create New Notebook</Link>
        </div>
    );
};

export default NotebookList;