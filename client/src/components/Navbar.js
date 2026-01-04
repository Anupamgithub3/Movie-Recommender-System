function Navbar({ movie, setMovie, onSearch, activeSection, setActiveSection, user }) {
    return (
        <>
            <style>
                {`
                @media (max-width: 768px) {
                    .navbar-responsive {
                        padding: 15px !important;
                        height: auto !important;
                        flex-direction: column !important;
                        gap: 15px !important;
                    }
                    .left-side-responsive {
                        flex-direction: column !important;
                        gap: 10px !important;
                    }
                    .search-box-responsive {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                    .search-input-responsive {
                        width: 100% !important;
                        max-width: none !important;
                    }
                }
                `}
            </style>
            <div style={styles.navbar} className="navbar-responsive">
                <div style={styles.leftSide} className="left-side-responsive">
                    <div style={styles.logo}>CineSense</div>

                    <div style={styles.navLinks}>
                        {['Home', 'Movies', 'Series', 'Profile'].map((label) => (
                            <button
                                key={label}
                                onClick={() => setActiveSection(label)}
                                style={{
                                    ...styles.link,
                                    ...(activeSection === label ? styles.activeLink : {}),
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <form
                    style={styles.searchBox}
                    className="search-box-responsive"
                    onSubmit={(e) => {
                        e.preventDefault();
                        console.log("Navbar triggered onSearch");
                        onSearch();
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search movies or shows..."
                        value={movie}
                        onChange={(e) => setMovie(e.target.value)}
                        style={styles.input}
                        className="search-input-responsive"
                    />
                    <button type="submit" style={styles.button}>
                        Search
                    </button>
                </form>
            </div>
        </>
    );
}

const styles = {
    navbar: {
        minHeight: "70px",
        backgroundColor: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 30px",
        color: "#fff",
        flexWrap: "wrap",
        gap: "10px",
    },
    leftSide: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    logo: {
        fontSize: "24px",
        fontWeight: "bold",
        letterSpacing: "1px",
    },
    navLinks: {
        display: 'flex',
        gap: '10px',
    },
    link: {
        background: 'transparent',
        border: 'none',
        color: '#ddd',
        cursor: 'pointer',
        fontSize: '15px',
        padding: '6px 10px',
    },
    activeLink: {
        color: '#fff',
        borderBottom: '2px solid #e50914',
    },
    searchBox: {
        display: "flex",
        gap: "10px",
    },
    input: {
        padding: "8px",
        fontSize: "14px",
        width: "100%",
        maxWidth: "220px",
        borderRadius: "4px",
        border: "none",
    },
    button: {
        padding: "8px 14px",
        fontSize: "14px",
        backgroundColor: "#e50914",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        borderRadius: "4px",
    },
};

export default Navbar;
