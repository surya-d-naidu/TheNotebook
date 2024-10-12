// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const ENCRYPTION_KEY = '12345678901234567890123456789012'; // Use a secure key

// Function to encrypt and decrypt files
const encrypt = (text, password) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (hash, password) => {
    const [iv, encryptedText] = hash.split(':');
    const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);
    return decrypted.toString();
};

app.get('/', (req, res) => {
    res.send('Welcome to the Notebook API!');
});

// Create a new notebook
app.post('/api/notebooks', async (req, res) => {
    const { name, password } = req.body;
    const filePath = `./notebooks/${name}.intb`;
    const initialData = JSON.stringify({ layers: [], password: password ? encrypt('', password) : null });

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

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});

// Get a list of existing notebooks
app.get('/api/notebooks', async (req, res) => {
    try {
        const files = await fs.readdir('./notebooks');
        const notebooks = files
            .filter(file => file.endsWith('.intb'))
            .map(file => file.replace('.intb', '')); // Remove the extension
        res.json(notebooks);
    } catch (error) {
        res.status(500).json({ error: 'Error reading notebooks' });
    }
});

app.get('/api/notebooks/:name', async (req, res) => {
    const { name } = req.params;
    const filePath = path.join(__dirname, 'notebooks', `${name}.intb`);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data)); // Assuming the data is stored in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error reading notebook' });
    }
});