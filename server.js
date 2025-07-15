import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Endpoint to provide API key to the frontend
app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const apiKey = process.env.API_KEY || '';
    res.send(`window.GEMINI_API_KEY = "${apiKey}";`);
});

// Serve the static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// For any other route, serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
