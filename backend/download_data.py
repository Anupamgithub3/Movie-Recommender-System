import kagglehub
import shutil
import os

# Download latest version
path = kagglehub.dataset_download("tmdb/tmdb-movie-metadata")

print("Path to dataset files:", path)

# Define source and destination paths
source_movies = os.path.join(path, "tmdb_5000_movies.csv")
source_credits = os.path.join(path, "tmdb_5000_credits.csv")

dest_movies = "movies.csv"
dest_credits = "credits.csv"

# Copy and rename files
if os.path.exists(source_movies):
    shutil.copy(source_movies, dest_movies)
    print(f"Copied {source_movies} to {dest_movies}")
else:
    print(f"Error: {source_movies} not found!")

if os.path.exists(source_credits):
    shutil.copy(source_credits, dest_credits)
    print(f"Copied {source_credits} to {dest_credits}")
else:
    print(f"Error: {source_credits} not found!")

print("Download and setup complete.")
