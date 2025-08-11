require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint to handle garbage data submission
app.post('/predict-and-store-reward', async (req, res) => {
    try {
        // Spawn Python process
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'ml', 'ml_api.py'),
            JSON.stringify(req.body)
        ]);

        let result = '';

        // Collect data from script
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        // Handle errors
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from Python script: ${data}`);
        });

        // Send response when process completes
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ error: 'Failed to process data' });
            }
            try {
                const jsonResult = JSON.parse(result);
                res.json(jsonResult);
            } catch (err) {
                res.status(500).json({ error: 'Invalid response from ML model' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
