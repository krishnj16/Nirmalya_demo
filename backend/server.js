require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Keep the process running despite the error
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep the process running despite the rejection
});

app.use(cors());
app.use(express.json());

// Add a basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Endpoint to handle garbage data submission
app.post('/predict-and-store-reward', async (req, res) => {
    try {
        // Input validation
        if (!req.body || !req.body.trash_type || !req.body.weight_kg) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Spawn Python process with proper error handling
        const pythonProcess = spawn(process.env.PYTHON_PATH || 'python', [
            path.join(__dirname, 'ml', 'ml_api.py'),
            JSON.stringify(req.body)
        ]);

        let result = '';
        let errorOutput = '';
        let hasResponded = false;

        // Set a timeout for the process
        const timeout = setTimeout(() => {
            if (!hasResponded) {
                hasResponded = true;
                pythonProcess.kill();
                res.status(504).json({ error: 'Processing timeout' });
            }
        }, 30000); // 30 second timeout

        // Collect data from script
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        // Handle errors
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Error from Python script: ${data}`);
        });

        // Handle process errors
        pythonProcess.on('error', (error) => {
            clearTimeout(timeout);
            if (!hasResponded) {
                hasResponded = true;
                console.error('Failed to start Python process:', error);
                res.status(500).json({ error: 'Failed to start prediction process' });
            }
        });

        // Send response when process completes
        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (!hasResponded) {
                hasResponded = true;
                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    return res.status(500).json({ 
                        error: 'Failed to process data',
                        details: errorOutput 
                    });
                }
                try {
                    const jsonResult = JSON.parse(result);
                    res.json(jsonResult);
                } catch (err) {
                    console.error('Failed to parse Python output:', err);
                    res.status(500).json({ 
                        error: 'Invalid response from ML model',
                        details: result 
                    });
                }
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Performing graceful shutdown...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Performing graceful shutdown...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server');
});
