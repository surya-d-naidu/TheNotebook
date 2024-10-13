// src/components/CreateNotebook.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateNotebook = () => {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleCreate = async () => {
        await axios.post('http://localhost:5000/api/notebooks', { name });
        alert('Notebook created successfully!');
        setName('');
        navigate('/');
    };

    return (
        <div className="create-notebook">
            <h1>Create New Notebook</h1>
            <input
                type="text"
                placeholder="Notebook Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button onClick={handleCreate}>Create Notebook</button>
        </div>
    );
};

export default CreateNotebook;