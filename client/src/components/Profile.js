import React, { useState } from 'react';
import MovieRow from './MovieRow';

function Profile({ user, setUser, favorites, watchlist, history, onSelectMovie, onRemoveFavorite, onRemoveWatchlist, onRemoveHistory }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    const handleAuth = (e) => {
        e.preventDefault();
        setError('');

        const storedUsers = JSON.parse(localStorage.getItem('cineSense_users') || '{}');

        if (isLogin) {
            if (storedUsers[username] && storedUsers[username].password === password) {
                const userData = { username, ...storedUsers[username] };
                setUser(userData);
                localStorage.setItem('cineSense_currentUser', JSON.stringify(userData));
            } else {
                setError('Invalid username or password');
            }
        } else {
            if (storedUsers[username]) {
                setError('Username already exists');
            } else {
                const newUser = {
                    password,
                    email,
                    firstName,
                    lastName,
                    favorites: [],
                    watchlist: [],
                    history: []
                };
                storedUsers[username] = newUser;
                localStorage.setItem('cineSense_users', JSON.stringify(storedUsers));
                setUser({ username, ...newUser });
                localStorage.setItem('cineSense_currentUser', JSON.stringify({ username, ...newUser }));
            }
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('cineSense_currentUser');
    };

    if (!user) {
        return (
            <div style={styles.authContainer}>
                <div style={styles.authCard}>
                    <h2 style={{ marginBottom: '20px' }}>{isLogin ? 'Login' : 'Sign Up'}</h2>
                    <form onSubmit={handleAuth} style={styles.form}>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            required
                        />
                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    style={styles.input}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    style={styles.input}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={styles.input}
                                    required
                                />
                            </>
                        )}
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                        {error && <p style={{ color: '#e50914', fontSize: '14px' }}>{error}</p>}
                        <button type="submit" style={styles.button}>
                            {isLogin ? 'Login' : 'Sign Up'}
                        </button>
                    </form>
                    <p style={{ marginTop: '15px', fontSize: '14px', color: '#aaa' }}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <span
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ color: '#e50914', cursor: 'pointer' }}
                        >
                            {isLogin ? 'Sign up now' : 'Login now'}
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.dashboard}>
            <div style={styles.header}>
                <div>
                    <h1 style={{ margin: 0 }}>Welcome, {user.firstName || user.username}</h1>
                    <p style={{ color: '#aaa', marginTop: '4px' }}>{user.email}</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>

            <div style={styles.sections}>
                {favorites.length > 0 ? (
                    <MovieRow title="Favorites" movies={favorites} onSelect={onSelectMovie} onRemove={onRemoveFavorite} />
                ) : (
                    <div style={styles.empty}>
                        <h3 style={styles.sectionTitle}>Favorites</h3>
                        <p>No favorites yet. Start adding some!</p>
                    </div>
                )}

                {watchlist.length > 0 ? (
                    <MovieRow title="Plan to Watch" movies={watchlist} onSelect={onSelectMovie} onRemove={onRemoveWatchlist} />
                ) : (
                    <div style={styles.empty}>
                        <h3 style={styles.sectionTitle}>Plan to Watch</h3>
                        <p>Your watchlist is empty.</p>
                    </div>
                )}

                {history.length > 0 ? (
                    <MovieRow title="Continued Watching" movies={history} onSelect={onSelectMovie} onRemove={onRemoveHistory} />
                ) : (
                    <div style={styles.empty}>
                        <h3 style={styles.sectionTitle}>Continued Watching</h3>
                        <p>No recent history.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    authContainer: {
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '50px',
    },
    authCard: {
        background: '#181818',
        padding: '40px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    input: {
        padding: '12px',
        borderRadius: '4px',
        border: 'none',
        background: '#333',
        color: '#fff',
    },
    button: {
        padding: '12px',
        borderRadius: '4px',
        border: 'none',
        background: '#e50914',
        color: '#fff',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    dashboard: {
        color: '#fff',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
    },
    logoutBtn: {
        padding: '8px 16px',
        background: 'transparent',
        border: '1px solid #e50914',
        color: '#e50914',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    sections: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    empty: {
        marginBottom: '30px',
        padding: '0 0 10px 0',
        borderBottom: '1px solid #333',
    },
    sectionTitle: {
        fontSize: '20px',
        marginBottom: '10px',
    },
};

export default Profile;
