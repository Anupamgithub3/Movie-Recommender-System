import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import MovieRow from "./components/MovieRow";
import MovieModal from "./components/MovieModal";
import Profile from "./components/Profile";
import Footer from "./components/Footer";

const TMDB_API_KEY = "2e5d7052aa9a39bd6ce0f32fffee5dcd";

function App() {
  const [movie, setMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [activeSection, setActiveSection] = useState('Home');
  const [featured, setFeatured] = useState([]);
  const [genres, setGenres] = useState({});
  const [genreRows, setGenreRows] = useState({});
  const [seriesRows, setSeriesRows] = useState({});
  const [popularSeries, setPopularSeries] = useState([]);
  const [spotlight, setSpotlight] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Detail page state for search results
  const [detailItem, setDetailItem] = useState(null);
  const [detailRecommendations, setDetailRecommendations] = useState([]);

  // User and Lists state
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  // Helper to fetch using discover endpoints
  const fetchDiscover = async (params, type = 'movie') => {
    const qs = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
    try {
      const res = await fetch(`https://api.themoviedb.org/3/discover/${type}?${qs.toString()}`);
      const data = await res.json();
      if (data && data.results) {
        return data.results.map(m => ({
          id: m.id,
          title: m.title || m.name,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
          overview: m.overview || 'No description available.',
          year: (m.release_date || m.first_air_date || '').split('-')[0],
          rating: m.vote_average || 'N/A',
          genre_ids: m.genre_ids || [],
          type: type === 'movie' ? 'movie' : 'tv'
        }));
      }
    } catch (err) {
      console.error('Discover fetch error', err);
    }
    return [];
  };

  useEffect(() => {
    const loadSections = async () => {
      setSectionsLoading(true);

      // get genres maps
      try {
        const [mRes, tRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`),
          fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}`)
        ]);
        const mData = await mRes.json();
        const tData = await tRes.json();

        const mMap = {};
        if (mData && mData.genres) mData.genres.forEach(g => mMap[g.name.toLowerCase()] = g.id);

        const tMap = {};
        if (tData && tData.genres) {
          tData.genres.forEach(g => {
            tMap[g.name.toLowerCase()] = g.id;
            // Substituted mappings for TV genres that differ from Movies
            if (g.name === "Action & Adventure") {
              tMap["action"] = g.id;
            }
            if (g.name === "Mystery") {
              tMap["horror"] = g.id;
            }
          });
        }
        setGenres({ ...mMap, ...tMap }); // For the modal's genre chips

        // Top 10 by rating (exclude low vote counts)
        const featuredList = await fetchDiscover({ sort_by: 'vote_average.desc', 'vote_count.gte': '500', page: 1 });
        setFeatured(featuredList.slice(0, 10));

        // genre rows (movies)
        const wanted = ['comedy', 'action', 'drama', 'horror', 'crime'];
        const rows = {};
        for (const name of wanted) {
          const id = mMap[name];
          if (id) {
            const list = await fetchDiscover({ with_genres: id, sort_by: 'popularity.desc', page: 1 });
            rows[name] = list.slice(0, 12);
          } else {
            rows[name] = [];
          }
        }

        setGenreRows(rows);

        // fetch series rows
        const sRows = {};
        for (const name of wanted) {
          const id = tMap[name];
          if (id) {
            const list = await fetchDiscover({ with_genres: id, sort_by: 'popularity.desc', page: 1 }, 'tv');
            sRows[name] = list.slice(0, 12);
          } else {
            sRows[name] = [];
          }
        }
        setSeriesRows(sRows);

        // fetch dedicated popular series
        const popSeries = await fetchDiscover({ sort_by: 'popularity.desc', page: 1 }, 'tv');
        setPopularSeries(popSeries.slice(0, 20));

        // spotlight - random mix
        const randomPage = Math.floor(Math.random() * 20) + 1;
        const mSpot = await fetchDiscover({ page: randomPage, sort_by: 'popularity.desc' }, 'movie');
        const tSpot = await fetchDiscover({ page: randomPage, sort_by: 'popularity.desc' }, 'tv');
        setSpotlight([...mSpot, ...tSpot].sort(() => 0.5 - Math.random()).slice(0, 12));
      } catch (err) {
        console.error('Section load error', err);
      }

      setSectionsLoading(false);
    };

    loadSections();

    // Auth initialization
    const savedUser = localStorage.getItem('cineSense_currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Load user data from main users storage to get latest lists
      const storedUsers = JSON.parse(localStorage.getItem('cineSense_users') || '{}');
      if (storedUsers[parsedUser.username]) {
        setFavorites(storedUsers[parsedUser.username].favorites || []);
        setWatchlist(storedUsers[parsedUser.username].watchlist || []);
        setHistory(storedUsers[parsedUser.username].history || []);
      }
    }
  }, []);

  // Update lists in LocalStorage whenever they change
  useEffect(() => {
    if (user) {
      const storedUsers = JSON.parse(localStorage.getItem('cineSense_users') || '{}');
      if (storedUsers[user.username]) {
        storedUsers[user.username].favorites = favorites;
        storedUsers[user.username].watchlist = watchlist;
        storedUsers[user.username].history = history;
        localStorage.setItem('cineSense_users', JSON.stringify(storedUsers));
      }
    }
  }, [favorites, watchlist, history, user]);

  const toggleFavorite = (movie) => {
    if (!user) { setActiveSection('Profile'); return; }
    setFavorites(prev => {
      const exists = prev.find(m => m.title === movie.title);
      if (exists) return prev.filter(m => m.title !== movie.title);
      return [...prev, movie];
    });
  };

  const toggleWatchlist = (movie) => {
    if (!user) { setActiveSection('Profile'); return; }
    setWatchlist(prev => {
      const exists = prev.find(m => m.title === movie.title);
      if (exists) return prev.filter(m => m.title !== movie.title);
      return [...prev, movie];
    });
  };

  const removeFromHistory = (movie) => {
    setHistory(prev => prev.filter(m => m.title !== movie.title));
  };

  const addToHistory = (movie) => {
    if (!user) return;
    setHistory(prev => {
      const filtered = prev.filter(m => m.title !== movie.title);
      return [movie, ...filtered].slice(0, 12); // Keep last 12
    });
  };

  // keep existing search-based recommendations
  const handleSearch = async () => {
    if (!movie) return;
    console.log("Triggering search for:", movie);

    setLoading(true);
    setError("");
    setDetailItem(null);
    setDetailRecommendations([]);

    try {
      // Decide by activeSection only (no popularity comparison)
      if (activeSection === 'Series') {
        // Series search path — use the webseries ML dataset as the source of truth
        console.log("Searching webseries dataset for:", movie);
        const apiBase = process.env.REACT_APP_API_URL || 'https://movie-recommender-system-f6j8.onrender.com';
        const response = await fetch(`${apiBase}/api/recommend_series?series=${encodeURIComponent(movie)}`);
        const data = await response.json();

        // If ML backend doesn't find the series in our CSV, fall back to TMDB search/tv
        if (data.error) {
          const tvRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie)}`);
          const tvData = await tvRes.json();
          const tvTop = tvData.results && tvData.results[0];

          if (!tvTop) {
            setError('No TV series found for that query');
            setLoading(false);
            return;
          }

          const fallbackMain = tvTop;
          console.log("ML backend missing — falling back to TMDB similar for:", fallbackMain.name);

          // Fallback to TMDB similar if not in our CSV
          const simRes = await fetch(`https://api.themoviedb.org/3/tv/${fallbackMain.id}/similar?api_key=${TMDB_API_KEY}`);
          const simData = await simRes.json();
          const simList = (simData.results || []).map(m => ({
            title: m.name,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
            overview: m.overview || 'No description available.',
            year: m.first_air_date ? m.first_air_date.split('-')[0] : '',
            rating: m.vote_average || 'N/A',
            genre_ids: m.genre_ids || [],
          }));

          setDetailItem({ type: 'tv', title: fallbackMain.name, poster: fallbackMain.poster_path ? `https://image.tmdb.org/t/p/w500${fallbackMain.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', overview: fallbackMain.overview || 'No description available.', year: fallbackMain.first_air_date ? fallbackMain.first_air_date.split('-')[0] : '', rating: fallbackMain.vote_average || 'N/A' });
          setDetailRecommendations(simList);
          setActiveSection('Details');
          setLoading(false);
          return;
        }

        // Found in our series CSV (ML backend results)
        const seriesWithDetails = await Promise.all(
          data.recommendations.map(async (title) => {
            const r = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
            const d = await r.json();
            const m = d.results && d.results[0];
            return {
              title,
              poster: m && m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
              overview: m && m.overview ? m.overview : 'No description available.',
              year: m && m.first_air_date ? m.first_air_date.split('-')[0] : '',
              rating: m && m.vote_average ? m.vote_average : 'N/A',
              genre_ids: m ? m.genre_ids : [],
            };
          })
        );

        // Fetch best-effort details for the searched title from TMDB
        const searchedTitle = data.searched || movie;
        const mainRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchedTitle)}`);
        const mainData = await mainRes.json();
        const searchedMain = mainData.results && mainData.results[0];

        setDetailItem({ type: 'tv', title: searchedTitle, poster: searchedMain && searchedMain.poster_path ? `https://image.tmdb.org/t/p/w500${searchedMain.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', overview: searchedMain && searchedMain.overview ? searchedMain.overview : 'No description available.', year: searchedMain && searchedMain.first_air_date ? searchedMain.first_air_date.split('-')[0] : '', rating: searchedMain && searchedMain.vote_average ? searchedMain.vote_average : 'N/A' });
        setDetailRecommendations(seriesWithDetails);
        setActiveSection('Details');

      } else if (activeSection === 'Movies' || activeSection === 'Home') {
        // Movie search path
        const mRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie)}`);
        const mData = await mRes.json();
        const mTop = mData.results && mData.results[0];

        if (!mTop) {
          setError('No movies found for that query');
          setLoading(false);
          return;
        }

        const movieMain = mTop;
        console.log("Found movie match:", movieMain.title);
        const apiBase = process.env.REACT_APP_API_URL || 'https://movie-recommender-system-f6j8.onrender.com';
        const response = await fetch(`${apiBase}/api/recommend?movie=${encodeURIComponent(movieMain.title)}`);
        const data = await response.json();

        if (data.error) {
          // Fallback to TMDB similar movies
          const simRes = await fetch(`https://api.themoviedb.org/3/movie/${movieMain.id}/similar?api_key=${TMDB_API_KEY}`);
          const simData = await simRes.json();
          const simList = (simData.results || []).map(m => ({
            title: m.title,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
            overview: m.overview || 'No description available.',
            year: m.release_date ? m.release_date.split('-')[0] : '',
            rating: m.vote_average || 'N/A',
            genre_ids: m.genre_ids || [],
          }));

          setDetailItem({ type: 'movie', title: movieMain.title, poster: movieMain.poster_path ? `https://image.tmdb.org/t/p/w500${movieMain.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', overview: movieMain.overview || 'No description available.', year: movieMain.release_date ? movieMain.release_date.split('-')[0] : '', rating: movieMain.vote_average || 'N/A' });
          setDetailRecommendations(simList);
          setActiveSection('Details');
          setLoading(false);
          return;
        }

        const moviesWithDetails = await Promise.all(
          data.recommendations.map(async (title) => {
            const r = await fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
            );
            const d = await r.json();
            const m = d.results && d.results[0];
            return {
              title,
              poster: m && m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
              overview: m && m.overview ? m.overview : 'No description available.',
              year: m && m.release_date ? m.release_date.split('-')[0] : '',
              rating: m && m.vote_average ? m.vote_average : 'N/A',
              genre_ids: m ? m.genre_ids : [],
            };
          })
        );

        setDetailItem({ type: 'movie', title: movieMain.title, poster: movieMain.poster_path ? `https://image.tmdb.org/t/p/w500${movieMain.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', overview: movieMain.overview || 'No description available.', year: movieMain.release_date ? movieMain.release_date.split('-')[0] : '', rating: movieMain.vote_average || 'N/A' });
        setDetailRecommendations(moviesWithDetails);
        setActiveSection('Details');

      } else {
        // Re-display last search results when not in Movies/Home/Series (option B)
        if (detailItem && detailRecommendations && detailRecommendations.length > 0) {
          setActiveSection('Details');
          setLoading(false);
          return;
        } else {
          // No previous results — fallback to Movie search behavior
          const mRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie)}`);
          const mData = await mRes.json();
          const mTop = mData.results && mData.results[0];

          if (!mTop) {
            setError('No movies found for that query');
            setLoading(false);
            return;
          }

          const movieMain = mTop;
          console.log("Found movie match:", movieMain.title);
          const apiBase = process.env.REACT_APP_API_URL || 'https://movie-recommender-system-f6j8.onrender.com';
          const response = await fetch(`${apiBase}/api/recommend?movie=${encodeURIComponent(movieMain.title)}`);
          const data = await response.json();

          if (data.error) {
            // Fallback to TMDB similar movies
            const simRes = await fetch(`https://api.themoviedb.org/3/movie/${movieMain.id}/similar?api_key=${TMDB_API_KEY}`);
            const simData = await simRes.json();
            const simList = (simData.results || []).map(m => ({
              title: m.title,
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
              overview: m.overview || 'No description available.',
              year: m.release_date ? m.release_date.split('-')[0] : '',
              rating: m.vote_average || 'N/A',
              genre_ids: m.genre_ids || [],
            }));

            setDetailItem({ type: 'movie', title: movieMain.title, poster: movieMain.poster_path ? `https://image.tmdb.org/t/p/w500${movieMain.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', overview: movieMain.overview || 'No description available.', year: movieMain.release_date ? movieMain.release_date.split('-')[0] : '', rating: movieMain.vote_average || 'N/A' });
            setDetailRecommendations(simList);
            setActiveSection('Details');
            setLoading(false);
            return;
          }

          const moviesWithDetails = await Promise.all(
            data.recommendations.map(async (title) => {
              const r = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
              );
              const d = await r.json();
              const m = d.results && d.results[0];
              return {
                title,
                poster: m && m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
                overview: m && m.overview ? m.overview : 'No description available.',
                year: m && m.release_date ? m.release_date.split('-')[0] : '',
                rating: m && m.vote_average ? m.vote_average : 'N/A',
                genre_ids: m ? m.genre_ids : [],
              };
            })
          );

          setDetailItem({ type: 'movie', title: movieMain.title, poster: movieMain.poster_path ? `https://image.tmdb.org/t/p/w500${movieMain.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', overview: movieMain.overview || 'No description available.', year: movieMain.release_date ? movieMain.release_date.split('-')[0] : '', rating: movieMain.vote_average || 'N/A' });
          setDetailRecommendations(moviesWithDetails);
          setActiveSection('Details');
          return;
        }
      }
    } catch (err) {
      console.error('Search flow error detail:', err);
      setError(`Failed to perform search: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#141414", minHeight: "100vh" }}>
      <Navbar user={user} movie={movie} setMovie={setMovie} onSearch={handleSearch} activeSection={activeSection} setActiveSection={setActiveSection} />

      <div style={styles.container}>
        {loading && <p style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>Searching...</p>}
        {error && <p style={{ color: '#e50914', textAlign: 'center', padding: '20px' }}>{error}</p>}
        {sectionsLoading && !loading && <p style={{ color: '#fff' }}>Loading content...</p>}

        {activeSection === 'Home' && !sectionsLoading && (
          <>
            {/* Spotlight section */}
            <MovieRow title="Spotlight" movies={spotlight} onSelect={setSelectedMovie} size="large" />

            {/* Genre sections */}
            {Object.keys(genreRows).map((g) => (
              <MovieRow key={g} title={g.charAt(0).toUpperCase() + g.slice(1)} movies={genreRows[g]} onSelect={setSelectedMovie} />
            ))}

            {/* Hero / Top 10 by rating */}
            <MovieRow title="Top 10" movies={featured} onSelect={setSelectedMovie} />

            <Footer />
          </>
        )}

        {activeSection === 'Movies' && (
          <>
            <h2 style={{ color: '#fff' }}>All Movies</h2>
            {sectionsLoading ? <p style={{ color: '#fff' }}>Loading...</p> : (
              Object.keys(genreRows).map((g) => (
                <MovieRow key={g} title={g.charAt(0).toUpperCase() + g.slice(1)} movies={genreRows[g]} onSelect={setSelectedMovie} />
              ))
            )}
          </>
        )}

        {activeSection === 'Series' && (
          <>
            <h2 style={{ color: '#fff' }}>All Series</h2>
            {sectionsLoading ? <p style={{ color: '#fff' }}>Loading...</p> : (
              <>
                <MovieRow title="Popular Series" movies={popularSeries} onSelect={setSelectedMovie} />
                {Object.keys(seriesRows).map((g) => (
                  <MovieRow key={g} title={g.charAt(0).toUpperCase() + g.slice(1) + " Series"} movies={seriesRows[g]} onSelect={setSelectedMovie} />
                ))}
              </>
            )}
          </>
        )}

        {activeSection === 'Profile' && (
          <Profile
            user={user}
            setUser={setUser}
            favorites={favorites}
            watchlist={watchlist}
            history={history}
            onSelectMovie={setSelectedMovie}
            onRemoveFavorite={toggleFavorite}
            onRemoveWatchlist={toggleWatchlist}
            onRemoveHistory={removeFromHistory}
          />
        )}

        {/* Details page shown after a search */}
        {activeSection === 'Details' && detailItem && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <img src={detailItem.poster} alt={detailItem.title} style={{ width: '320px', borderRadius: '8px' }} />

              <div style={{ color: '#fff', maxWidth: '720px' }}>
                <h1 style={{ marginTop: 0 }}>{detailItem.title} <span style={{ fontSize: '14px', color: '#bbb' }}>({detailItem.year})</span></h1>
                <p style={{ color: '#ddd' }}>{detailItem.overview}</p>
                <p style={{ color: '#bbb' }}>Rating: {detailItem.rating}</p>
                <div style={{ marginTop: '8px' }}>
                  <button onClick={() => { setActiveSection('Home'); setDetailItem(null); setDetailRecommendations([]); }} style={{ padding: '8px 12px', background: '#e50914', color: '#fff', border: 'none', borderRadius: 6 }}>Back to Home</button>
                </div>
              </div>
            </div>

            <h3 style={{ color: '#fff', marginTop: '20px' }}>{detailItem.type === 'tv' ? 'Similar Shows' : 'Recommendations'}</h3>
            <MovieRow movies={detailRecommendations} onSelect={setSelectedMovie} title={detailItem.type === 'tv' ? 'Similar Shows' : 'Recommendations'} />
          </div>
        )}

      </div>

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        favorites={favorites}
        watchlist={watchlist}
        onToggleFavorite={toggleFavorite}
        onToggleWatchlist={toggleWatchlist}
        onAddToHistory={addToHistory}
        genresMap={genres}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
  },
};

export default App;