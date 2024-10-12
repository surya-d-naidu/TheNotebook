// src/components/CreateNotebook.js
import React, { useState } from 'react';
import axios from 'axios';

const CreateNotebook = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const handleCreate = async () => {
        await axios.post('http://localhost:5000/api/notebooks', { name, password });
        alert('Notebook created successfully!');
        setName('');
        setPassword('');
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
            <input
                type="password"
                placeholder="Password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleCreate}>Create Notebook</button>
        </div>
    );
};

export default CreateNotebook;

