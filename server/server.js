const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Make sure downloads folder exists
const downloadsDir = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Test route
app.get('/ping', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Extract audio from YouTube URL
app.post('/extract', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'No URL provided' });
    }

    const outputPath = path.join(downloadsDir, 'audio.wav');

    // Delete old file if it exists
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    const command = `yt-dlp -x --audio-format wav --audio-quality 0 -o "${outputPath}" "${url}"`;

    console.log('Running command:', command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', error.message);
            return res.status(500).json({ error: 'Failed to extract audio', details: error.message });
        }

        console.log('Success:', stdout);
        res.json({ message: 'Audio extracted successfully', file: 'audio.wav' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});