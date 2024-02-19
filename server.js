import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT_NUM || 3001;
const apiToken = process.env.REPLICATE_API_TOKEN;
const imgHostKey = process.env.IMAGE_HOST_KEY;

// Enable CORS.
app.use(cors()); // Enable all routes

// Parse req.body in POST, GET, etc.
app.use(bodyParser.json({ limit: '50mb' }));

// Proxy for API call
app.get('/api/predictions/:predictionUrl', async (req, res) => {
    try {
        const { predictionUrl } = req.params;
        const apiUrl = decodeURIComponent(predictionUrl);
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Token ${apiToken}`
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Handle POST requests to /api/predictions
app.post('/api/predictions', async (req, res) => {
    try {
        const apiUrl = 'https://api.replicate.com/v1/predictions';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body) // Forward request body to external API
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Handle POST requests for image hosting
app.post('/imagehosting/upload', async (req, res) => {
    try {
        const imgSource = req.body.source;
        console.log(`imgSource.length: ${imgSource.length}`);
        const fd = new FormData();
        fd.append("image", imgSource);
        fd.append("name", "temp_image");
        //console.log('imgSource:');
        //console.log(imgSource);
        //const hostUrl = `https://freeimage.host/api/1/upload?key=${imgHostKey}&source=${imgSource}`;
        const hostUrl = `https://api.imgbb.com/1/upload?expiration=600&key=${imgHostKey}`;
        const response = await fetch(hostUrl, {
            method: 'POST',
            body: fd
        });
        //body: JSON.stringify({ image: imgSource })
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve your Vite project's static files. Comment out to run app on a different port
app.use(express.static('dist'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});