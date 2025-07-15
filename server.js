const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

// This endpoint generates a configuration script on the fly.
app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    // WARNING: This exposes the API key to the client-side.
    const apiKey = process.env.API_KEY || '';
    res.send(`window.GEMINI_API_KEY = "${apiKey}";`);
});

// Custom middleware to correctly serve .ts/.tsx files
// This is crucial to prevent the SPA fallback from intercepting these requests.
app.use((req, res, next) => {
    if (req.path.endsWith('.ts') || req.path.endsWith('.tsx')) {
        const filePath = path.join(__dirname, req.path);
        // Check if file exists before attempting to serve
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (!err) {
                // File exists, serve it with the correct Content-Type
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                res.sendFile(filePath);
            } else {
                // File does not exist, pass to the next middleware
                next();
            }
        });
    } else {
        // Not a .ts or .tsx file, pass to the next middleware
        next();
    }
});


// Serve other static files from the root directory
app.use(express.static(path.join(__dirname)));

// For any other route, serve index.html as a fallback.
// This should be the last middleware.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
