// src/components/EditNotebook.js
import React, { useState, useEffect } from 'react';
import Canvas from './Canvas';

const EditNotebook = ({ notebookName }) => {
    return (
        <div className="edit-notebook">
            <h1>Edit Notebook: {notebookName}</h1>
            <Canvas notebookName={notebookName} />
        </div>
    );
};

export default EditNotebook;