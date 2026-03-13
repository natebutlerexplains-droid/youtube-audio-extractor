// Elements
const urlInput = document.getElementById('urlInput');
const extractBtn = document.getElementById('extractBtn');
const statusDiv = document.getElementById('status');
const waveformSection = document.getElementById('waveformSection');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const trimBtn = document.getElementById('trimBtn');
const playBtn = document.getElementById('playBtn');

// WaveSurfer instance
let wavesurfer = null;

// Show status messages
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
}

// Initialize WaveSurfer
function initWaveSurfer() {
    if (wavesurfer) {
        wavesurfer.destroy();
    }

    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#ff3b3b',
        progressColor: '#ff8080',
        cursorColor: '#ffffff',
        barWidth: 2,
        barGap: 1,
        height: 100,
        normalize: true,
    });

    wavesurfer.on('ready', () => {
        const duration = wavesurfer.getDuration();
        endTimeInput.value = Math.floor(duration);
        showStatus('Audio loaded! Press Play to preview, then set trim points and download.', 'success');
    });

    // Update play button text when audio finishes
    wavesurfer.on('finish', () => {
        playBtn.textContent = '▶ Play';
    });
}

// Play/Pause button click
playBtn.addEventListener('click', () => {
    if (!wavesurfer) return;

    wavesurfer.playPause();

    if (wavesurfer.isPlaying()) {
        playBtn.textContent = '⏸ Pause';
    } else {
        playBtn.textContent = '▶ Play';
    }
});

// Extract button click
extractBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    if (!url) {
        showStatus('Please paste a YouTube URL first.', 'error');
        return;
    }

    // Reset play button
    playBtn.textContent = '▶ Play';

    // Disable button while working
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';
    waveformSection.classList.add('hidden');
    showStatus('Extracting audio from YouTube... this may take 20-30 seconds.', 'info');

    try {
        const response = await fetch('/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Extraction failed');
        }

        // Load waveform
        showStatus('Loading waveform...', 'info');
        initWaveSurfer();
        wavesurfer.load('/audio/audio.wav');
        waveformSection.classList.remove('hidden');

    } catch (err) {
        showStatus(`Error: ${err.message}`, 'error');
    } finally {
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Audio';
    }
});

// Trim button click
trimBtn.addEventListener('click', async () => {
    const start = parseFloat(startTimeInput.value);
    const end = parseFloat(endTimeInput.value);

    if (isNaN(start) || isNaN(end) || start >= end) {
        showStatus('Please enter valid start and end times.', 'error');
        return;
    }

    // Stop playback before trimming
    if (wavesurfer && wavesurfer.isPlaying()) {
        wavesurfer.stop();
        playBtn.textContent = '▶ Play';
    }

    trimBtn.disabled = true;
    trimBtn.textContent = 'Trimming...';
    showStatus('Trimming audio...', 'info');

    try {
        const response = await fetch('/trim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Trim failed');
        }

        // Trigger download
        showStatus('Trim complete! Your download is starting...', 'success');
        window.location.href = '/download';

    } catch (err) {
        showStatus(`Error: ${err.message}`, 'error');
    } finally {
        trimBtn.disabled = false;
        trimBtn.textContent = 'Trim & Download';
    }
});