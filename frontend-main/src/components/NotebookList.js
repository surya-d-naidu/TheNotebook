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

    return (
        <div className="notebook-list">
            <h1>Existing Notebooks</h1>
            <ul>
    {notebooks.map((notebook, index) => (
        <li key={index}>
            <Link to={`/edit/${notebook}`}>{notebook}</Link>
        </li>
    ))}
</ul>
            <Link to="/create">Create New Notebook</Link>
        </div>
    );
};

export default NotebookList;

