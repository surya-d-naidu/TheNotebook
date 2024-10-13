const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ensure the notebooks directory exists
fs.ensureDirSync('./notebooks');

// Create a new notebook
app.post('/api/notebooks', async (req, res) => {
    const { name } = req.body;
    const filePath = `./notebooks/${name}.intb`;
    const initialData = JSON.stringify({ elements: [] });

    try {
        await fs.outputFile(filePath, initialData);
        res.status(201).json({ message: 'Notebook created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating notebook' });
    }
});

// Load an existing notebook
app.get('/api/notebooks/:name', async (req, res) => {
    const filePath = `./notebooks/${req.params.name}.intb`;

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const notebook = JSON.parse(data);
        res.json(notebook);
    } catch (error) {
        res.status(404).json({ error: 'Notebook not found' });
    }
});

// Save notebook data
app.post('/api/notebooks/:name', async (req, res) => {
    const filePath = `./notebooks/${req.params.name}.intb`;
    const notebookData = JSON.stringify(req.body);

    try {
        await fs.writeFile(filePath, notebookData);
        res.json({ message: 'Notebook saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error saving notebook' });
    }
});

// Get a list of existing notebooks
app.get('/api/notebooks', async (req, res) => {
    try {
        const files = await fs.readdir('./notebooks');
        const notebooks = files
            .filter(file => file.endsWith('.intb'))
            .map(file => file.replace('.intb', ''));
        res.json(notebooks);
    } catch (error) {
        res.status(500).json({ error: 'Error reading notebooks' });
    }
});

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});

// Delete a notebook
app.delete('/api/notebooks/:name', async (req, res) => {
    const filePath = `./notebooks/${req.params.name}.intb`;

    try {
        await fs.remove(filePath); // Remove the file
        res.json({ message: 'Notebook deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting notebook' });
    }
});