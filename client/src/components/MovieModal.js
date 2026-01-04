import React, { useState, useEffect } from 'react';

function MovieModal({ movie, onClose, favorites = [], watchlist = [], onToggleFavorite, onToggleWatchlist, onAddToHistory, genresMap = {} }) {
    const [openInfo, setOpenInfo] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setOpenInfo(false);
        setExpanded(false);

        const touch = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
        setIsTouch(!!touch);
    }, [movie]);

    if (!movie) return null;

    const rating = movie.rating || movie.vote_average || movie.score || 'N/A';
    const releaseYear = movie.year || (movie.release_date && movie.release_date.slice(0, 4)) || 'N/A';
    const truncatedOverview = movie.overview ? (movie.overview.length > 220 ? movie.overview.slice(0, 217) + '...' : movie.overview) : 'No description available.';

    // Map genre IDs to names
    const genreNames = movie.genre_ids
        ? movie.genre_ids.map(id => Object.keys(genresMap).find(key => genresMap[key] === id)).filter(Boolean)
        : [];

    const handlePosterClick = (e) => {
        e.stopPropagation();
        if (isTouch) setOpenInfo(s => !s);
    };

    const handlePosterKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpenInfo(s => !s);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <style>
                {`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .modal-animate-overlay {
                    animation: modalFadeIn 0.3s ease-out;
                }
                .modal-animate-content {
                    animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                `}
            </style>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="modal-animate-content">
                <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">✕</button>

                <div style={styles.content}>
                    <div style={styles.posterWrapper}>
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            style={styles.poster}
                            onClick={handlePosterClick}
                            onKeyDown={handlePosterKey}
                            role="button"
                            tabIndex={0}
                            aria-expanded={openInfo}
                        />

                        {isTouch && <div style={styles.tapHint}>Tap poster for info</div>}

                        <div
                            style={{
                                ...styles.infoPane,
                                opacity: openInfo ? 1 : 0,
                                transform: openInfo ? 'translateX(0)' : 'translateX(8px)',
                                pointerEvents: openInfo ? 'auto' : 'none',
                            }}
                            role="region"
                            aria-hidden={!openInfo}
                        >
                            <div style={styles.infoRow}><strong>✅ Release</strong>: {releaseYear}</div>
                            <div style={styles.infoRow}><strong>Rating</strong>: {rating}</div>

                            <div style={styles.infoOverview}>
                                {expanded ? (movie.overview || 'No description available.') : truncatedOverview}
                            </div>

                            {movie.overview && movie.overview.length > 220 && (
                                <button
                                    style={styles.readMore}
                                    onClick={(e) => { e.stopPropagation(); setExpanded(s => !s); }}
                                    aria-expanded={expanded}
                                >
                                    {expanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={styles.details}>
                        <h2 style={styles.title}>{movie.title}</h2>

                        <div style={styles.metaRow}>
                            <span style={styles.year}>{releaseYear}</span>
                            <span style={styles.separator}>·</span>
                            <span style={styles.typeBadge}>Movie</span>
                            <span style={styles.ratingBadge}>⭐ {rating}</span>
                        </div>

                        {genreNames.length > 0 && (
                            <div style={styles.genreTags}>
                                {genreNames.slice(0, 3).map((name, i) => (
                                    <span key={i} style={styles.genreTag}>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                                ))}
                            </div>
                        )}

                        <div style={styles.actions}>
                            <button
                                onClick={() => { onAddToHistory(movie); alert('Starting movie...'); }}
                                style={styles.playBtn}
                            >
                                ▶ Play
                            </button>
                            <button
                                onClick={() => onToggleFavorite(movie)}
                                style={favorites.find(m => m.title === movie.title) ? styles.activeActionBtn : styles.actionBtn}
                            >
                                {favorites.find(m => m.title === movie.title) ? '❤️ Favorite' : '🤍 Favorite'}
                            </button>
                            <button
                                onClick={() => onToggleWatchlist(movie)}
                                style={watchlist.find(m => m.title === movie.title) ? styles.activeActionBtn : styles.actionBtn}
                            >
                                {watchlist.find(m => m.title === movie.title) ? '✅ Watchlist' : '➕ Watchlist'}
                            </button>
                        </div>

                        <p style={styles.overview}>{movie.overview || "No description available."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
    },
    modal: {
        backgroundColor: "#181818",
        padding: "32px",
        borderRadius: "16px",
        width: "780px",
        maxWidth: "90%",
        color: "#fff",
        position: "relative",
        textAlign: "left",
        boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
    },
    content: {
        display: "flex",
        gap: "32px",
        alignItems: "flex-start",
    },
    posterWrapper: {
        position: "relative",
        flex: "0 0 260px",
    },
    poster: {
        width: "260px",
        height: "auto",
        borderRadius: "12px",
        display: "block",
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
    },
    tapHint: {
        marginTop: "10px",
        fontSize: "12px",
        color: "#777",
        textAlign: "center",
    },
    infoPane: {
        position: "absolute",
        left: "105%",
        top: 0,
        width: "280px",
        background: "#222",
        color: "#fff",
        padding: "16px",
        borderRadius: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.7)",
        transition: "all 200ms ease",
        zIndex: 50,
        border: "1px solid rgba(255,255,255,0.1)",
    },
    infoRow: {
        fontSize: "14px",
        color: "#eee",
        marginBottom: "8px",
    },
    infoOverview: {
        marginTop: "12px",
        fontSize: "13px",
        color: "#bbb",
        lineHeight: 1.5,
    },
    readMore: {
        marginTop: "10px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
    },
    details: {
        flex: 1,
    },
    title: {
        fontSize: "32px",
        fontWeight: "800",
        marginBottom: "12px",
        lineHeight: "1.2",
    },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "15px",
        color: "#aaa",
        marginBottom: "18px",
    },
    year: {
        fontWeight: "600",
    },
    separator: {
        color: "#555",
    },
    typeBadge: {
        color: "#ddd",
        textTransform: "uppercase",
        fontSize: "12px",
        letterSpacing: "1px",
    },
    ratingBadge: {
        color: "#4ade80",
        fontWeight: "bold",
    },
    genreTags: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "24px",
    },
    genreTag: {
        padding: "4px 12px",
        borderRadius: "6px",
        background: "rgba(255,255,255,0.1)",
        color: "#eee",
        fontSize: "12px",
        fontWeight: "600",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    overview: {
        fontSize: "15px",
        lineHeight: "1.7",
        color: "#ccc",
        marginTop: "15px",
    },
    closeBtn: {
        position: "absolute",
        top: "20px",
        right: "24px",
        background: "rgba(255,255,255,0.05)",
        border: "none",
        color: "#fff",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        cursor: "pointer",
        transition: "background 0.2s",
        zIndex: 60,
    },
    actions: {
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
    },
    playBtn: {
        padding: '12px 28px',
        fontSize: '16px',
        fontWeight: 'bold',
        backgroundColor: '#e50914',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'transform 0.2s, background 0.2s',
    },
    actionBtn: {
        padding: '12px 18px',
        fontSize: '14px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    activeActionBtn: {
        padding: '12px 18px',
        fontSize: '14px',
        backgroundColor: 'rgba(229, 9, 20, 0.2)',
        color: '#fff',
        border: '1px solid #e50914',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }
};

export default MovieModal;
