
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// This endpoint generates a configuration script on the fly.
// It injects the API_KEY from the server's environment variables into the browser's window object.
app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    // WARNING: This exposes the API key to the client-side. This is a security risk.
    // For production applications, a backend proxy is the recommended approach.
    const apiKey = process.env.API_KEY || '';
    res.send(`window.GEMINI_API_KEY = "${apiKey}";`);
});

// Serve all other static files from the root directory.
// This includes index.html, the 'components', 'services' folders, etc.
app.use(express.static(path.join(__dirname, '/')));

// For any route that is not a recognized file, serve index.html.
// This is important for single-page applications that handle their own routing.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
