import React, { useState } from 'react';

function PosterCard({ movie, onSelect, onRemove, size = 'small' }) {
    const [showInfo, setShowInfo] = useState(false);

    const rating = movie.rating || movie.vote_average || movie.score || 'N/A';
    const releaseYear = movie.year || (movie.release_date && movie.release_date.slice(0, 4)) || 'N/A';
    const truncatedOverview = movie.overview ? (movie.overview.length > (size === 'large' ? 180 : 120) ? movie.overview.slice(0, (size === 'large' ? 177 : 117)) + '...' : movie.overview) : 'No description available.';

    const posterWidth = size === 'large' ? 320 : 180;
    const infoLeft = size === 'large' ? '100%' : '100%';
    const wrapperWidth = `${posterWidth}px`;

    return (
        <div
            style={{ ...styles.posterWrapper, width: wrapperWidth }}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
        >
            <img
                src={movie.poster}
                alt={movie.title}
                style={showInfo ? { ...styles.poster, width: `${posterWidth}px`, transform: 'scale(1.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' } : { ...styles.poster, width: `${posterWidth}px` }}
                onClick={() => onSelect(movie)}
            />

            {onRemove && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(movie); }}
                    style={styles.removeBtn}
                    title="Remove"
                >
                    ✕
                </button>
            )}

            <div
                style={{
                    ...styles.infoPaneRow,
                    left: infoLeft,
                    opacity: showInfo ? 1 : 0,
                    transform: showInfo ? 'translateX(0)' : 'translateX(8px)',
                    pointerEvents: showInfo ? 'auto' : 'none',
                    width: size === 'large' ? '320px' : '260px'
                }}
                aria-hidden={!showInfo}
            >
                <div style={styles.infoRow}><strong>✅ Release</strong>: {releaseYear}</div>
                <div style={styles.infoRow}><strong>Rating</strong>: {rating}</div>
                <div style={styles.infoOverview}>{truncatedOverview}</div>
            </div>
        </div>
    );
}

function MovieRow({ title, movies, onSelect, onRemove, size = 'small' }) {
    return (
        <div style={styles.row}>
            <h2 style={styles.heading}>{title}</h2>

            <div style={styles.scroll}>
                {movies.map((movie, index) => (
                    <PosterCard key={index} movie={movie} onSelect={onSelect} onRemove={onRemove} size={size} />
                ))}
            </div>
        </div>
    );
}

const styles = {
    row: {
        marginBottom: "30px",
    },
    heading: {
        color: "#fff",
        marginBottom: "10px",
        fontSize: "20px",
    },
    scroll: {
        display: "flex",
        overflowX: "scroll",
        gap: "15px",
        paddingBottom: "6px",
    },
    posterWrapper: {
        position: 'relative',
        flex: '0 0 auto',
    },
    poster: {
        borderRadius: "8px",
        cursor: "pointer",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        display: 'block',
    },
    infoPaneRow: {
        position: 'absolute',
        top: 0,
        background: '#222',
        color: '#fff',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
        transition: 'all 180ms ease',
        zIndex: 50,
    },
    infoRow: {
        fontSize: "13px",
        color: "#ddd",
        marginBottom: "6px",
    },
    infoOverview: {
        marginTop: "8px",
        fontSize: "13px",
        color: "#ccc",
        lineHeight: 1.4,
    },
    removeBtn: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        zIndex: 10,
        transition: 'background 0.2s, transform 0.2s',
    },
};

export default MovieRow;
