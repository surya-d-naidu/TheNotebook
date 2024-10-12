// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotebookList from './components/NotebookList';
import CreateNotebook from './components/CreateNotebook';
import EditNotebook from './components/EditNotebook';
import './App.css'; // Create a CSS file for styling

const App = () => {
    return (
        <Router>
            <Routes>
    <Route path="/" element={<NotebookList />} />
    <Route path="/create" element={<CreateNotebook />} />
    <Route path="/edit/:notebookName" element={<EditNotebook />} />
</Routes>
        </Router>
    );
};

export default App;
