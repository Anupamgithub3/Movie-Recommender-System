console.log("SCRIPT LOADED ✔");

const API_KEY = "2e5d7052aa9a39bd6ce0f32fffee5dcd";

async function getRecommendation() {
    const movie = document.getElementById("movieInput").value;

    if (!movie) {
        alert("Please enter a movie name!");
        return;
    }

    // Call your backend API
    const response = await fetch(`http://localhost:5000/api/recommend?movie=${movie}`);
    const data = await response.json();

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    if (data.error) {
        resultList.innerHTML = `<li>${data.error}</li>`;
        return;
    }

    // For each recommended movie, get poster from TMDB
    for (let recMovie of data.recommendations) {
        const posterUrl = await fetchPoster(recMovie);

        const li = document.createElement("li");
        li.innerHTML = `
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:15px;">
                <img src="${posterUrl}" 
                     style="width:100px;border-radius:10px;">
                <span style="font-size:18px;">${recMovie}</span>
            </div>
        `;
        resultList.appendChild(li);
    }
}

// Fetch poster using TMDB API
async function fetchPoster(movieName) {
    // Clean up movie name for TMDB search
    const cleanName = movieName.replace(/\./g, "").trim();

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&include_adult=false&query=${encodeURIComponent(cleanName)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log("TMDB Result for:", cleanName, data); // DEBUG

        // If no results, fallback: try original name  
        if ((!data.results || data.results.length === 0) && cleanName !== movieName) {
            const url2 = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&include_adult=false&query=${encodeURIComponent(movieName)}`;
            const res2 = await fetch(url2);
            const data2 = await res2.json();

            if (data2.results && data2.results.length > 0) {
                const posterPath2 = data2.results[0].poster_path;
                if (posterPath2) {
                    return `https://image.tmdb.org/t/p/w500${posterPath2}`;
                }
            }
        }

        if (data.results && data.results.length > 0) {
            const posterPath = data.results[0].poster_path;
            if (posterPath) {
                return `https://image.tmdb.org/t/p/w500${posterPath}`;
            }
        }

    } catch (err) {
        console.error("Poster fetch error:", err);
    }

    return "https://via.placeholder.com/100x150?text=No+Image";
}
