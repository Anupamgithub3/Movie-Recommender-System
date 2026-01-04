const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend"))); // Serve frontend files using absolute path

// Proxy route to ML backend for movies
app.get("/api/recommend", async (req, res) => {
    try {
        const movie = req.query.movie;
        console.log(`[MOVIES] Request for: ${movie}`);
        if (!movie) return res.status(400).json({ error: "Movie name is required" });

        const mlBackend = process.env.ML_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await axios.get(`${mlBackend}/recommend?movie=${encodeURIComponent(movie)}`);
        console.log(`[MOVIES] Backend responded for: ${movie}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error calling ML backend (movies):", error.message);
        res.status(500).json({ error: "ML service unavailable" });
    }
});

// Proxy route to ML backend for series
app.get("/api/recommend_series", async (req, res) => {
    try {
        const series = req.query.series;
        console.log(`[SERIES] Request for: ${series}`);
        if (!series) return res.status(400).json({ error: "Series name is required" });

        const mlBackend = process.env.ML_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await axios.get(`${mlBackend}/recommend_series?series=${encodeURIComponent(series)}`);
        console.log(`[SERIES] Backend responded for: ${series}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error calling ML backend (series):", error.message);
        res.status(500).json({ error: "ML service unavailable" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Node server running on http://localhost:${PORT}`);
});
