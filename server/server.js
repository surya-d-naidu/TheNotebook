const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI('AIzaSyChOyO2xOTXgGEZdLKH6DHpW136tLUxvMQ');

const tempDir = path.join(__dirname, 'temp_images');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Ensure the notebooks directory exists
fs.ensureDirSync('./notebooks');

// Analyze image with AI
app.post('/api/analyze-image', async (req, res) => {
    if (!req.body.image) {
        return res.status(400).json({ error: 'No image data provided' });
    }

    try {
        console.log('Received image data');

        // Remove the data URL prefix and create a buffer
        const base64Image = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Image, 'base64');

        // Save the image temporarily
        const tempFilePath = path.join(tempDir, `temp_image_${Date.now()}.png`);
        fs.writeFileSync(tempFilePath, imageBuffer);

        console.log('Temporary image saved at:', tempFilePath);

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/png'
                }
            }
        ];

        console.log('Preparing to send request to Gemini AI');
        const prompt = "Analyze this image and solve any mathematical problems present. Provide a detailed explanation of the solution.";

        const result = await model.generateContent([prompt, ...imageParts]);
        console.log('Received response from Gemini AI');

        const response = await result.response;
        const analysisText = response.text();

        console.log('Analysis text:', analysisText.substring(0, 100) + '...'); // Log first 100 characters

        // Delete the temporary image after analysis
        //fs.unlinkSync(tempFilePath);

        res.json({ result: analysisText });
    } catch (error) {
        console.error('Error in /api/analyze-image:', error);
        
        let errorMessage = 'Error analyzing image';
        if (error.message.includes('PERMISSION_DENIED')) {
            errorMessage = 'API key does not have permission to use this model. Please check your API key and permissions.';
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            errorMessage = 'API quota exceeded. Please try again later or upgrade your API plan.';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message
        });
    }
});

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