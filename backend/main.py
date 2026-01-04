from fastapi import FastAPI
import pandas as pd
import numpy as np
import gc
import ast
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware
from difflib import get_close_matches

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Movie Recommendation API is functioning correctly"}

# =====================
# LOAD CSV FILES
# =====================

movies = pd.read_csv("movies.csv")
credits = pd.read_csv("credits.csv")
series_df = pd.read_csv("IMDB Top Webseries.csv")

movies = movies.merge(credits, on="title")


# =====================
# PREPROCESS FUNCTIONS
# =====================

def convert(obj):
    L = []
    for i in ast.literal_eval(obj):
        L.append(i['name'])
    return L


def convert3(obj):
    L = []
    counter = 0
    for i in ast.literal_eval(obj):
        if counter < 3:
            L.append(i['name'])
            counter += 1
        else:
            break
    return L


def get_director(obj):
    L = []
    for i in ast.literal_eval(obj):
        if i['job'] == 'Director':
            L.append(i['name'])
            break
    return L

def find_closest_title(user_input, titles):
    matches = get_close_matches(
        user_input,
        titles,
        n=1,
        cutoff=0.6
    )
    return matches[0] if matches else None

# Apply processing
movies['genres'] = movies['genres'].apply(convert)
movies['keywords'] = movies['keywords'].apply(convert)
movies['cast'] = movies['cast'].apply(convert3)
movies['crew'] = movies['crew'].apply(get_director)

movies['overview'] = movies['overview'].astype(str).apply(lambda x: x.split())


def clean_list(L):
    return [i.replace(" ", "") for i in L]


movies['genres'] = movies['genres'].apply(clean_list)
movies['keywords'] = movies['keywords'].apply(clean_list)
movies['cast'] = movies['cast'].apply(clean_list)
movies['crew'] = movies['crew'].apply(clean_list)

# Create tags
movies['tags'] = movies['overview'] + movies['genres'] + movies['keywords'] + movies['cast'] + movies['crew']

new_df = movies[['movie_id', 'title', 'tags']]
new_df['tags'] = new_df['tags'].apply(lambda x: " ".join(x))

# Vectorization
# Vectorization
cv = CountVectorizer(max_features=5000, stop_words='english')
vectors = cv.fit_transform(new_df['tags']) # Keep sparse, removed .toarray()

# Similarity matrix
similarity = cosine_similarity(vectors).astype(np.float16)

# Cleanup to free RAM
del new_df['tags']
del vectors
del cv
gc.collect()

# =====================
# SERIES PREPROCESSING
# =====================

series_df['Genre'] = series_df['Genre'].fillna('').apply(lambda x: x.split(','))
series_df['Summary'] = series_df['Summary'].fillna('').apply(lambda x: x.split())

def clean_series_list(L):
    return [i.replace(" ", "") for i in L]

series_df['Genre'] = series_df['Genre'].apply(clean_series_list)
series_df['tags'] = series_df['Genre'] + series_df['Summary']
series_df['tags'] = series_df['tags'].apply(lambda x: " ".join(x))

series_cv = CountVectorizer(max_features=5000, stop_words='english')
series_vectors = series_cv.fit_transform(series_df['tags']) # Keep sparse
series_similarity = cosine_similarity(series_vectors).astype(np.float16)

# Cleanup
del series_df['tags']
del series_vectors
del series_cv
gc.collect()


# =====================
# API ENDPOINT
# =====================

@app.get("/recommend")
def recommend(movie: str):
    movie_input = movie.title()
    all_titles = new_df['title'].values

    matched_title = find_closest_title(movie_input, all_titles)

    if not matched_title:
        return {"error": "Movie not found"}

    index = new_df[new_df['title'] == matched_title].index[0]

    distances = similarity[index]

    movie_list = sorted(
        list(enumerate(distances)),
        reverse=True,
        key=lambda x: x[1]
    )[:10]

    recommendations = [new_df.iloc[i[0]].title for i in movie_list]

    # Ensure searched movie appears first and only once
    final_recommendations = [matched_title]
    for title in recommendations:
        if title != matched_title:
            final_recommendations.append(title)

    return {
        "searched": matched_title,
        "recommendations": final_recommendations
    }

@app.get("/recommend_series")
def recommend_series(series: str):
    series_input = series.title()
    all_series_titles = series_df['Title'].values

    matched_title = find_closest_title(series_input, all_series_titles)

    if not matched_title:
        return {"error": "Series not found in our database"}

    index = series_df[series_df['Title'] == matched_title].index[0]
    distances = series_similarity[index]

    series_list = sorted(
        list(enumerate(distances)),
        reverse=True,
        key=lambda x: x[1]
    )[:10]

    recommendations = [series_df.iloc[i[0]].Title for i in series_list]

    final_recommendations = [matched_title]
    for title in recommendations:
        if title != matched_title:
            final_recommendations.append(title)

    return {
        "searched": matched_title,
        "recommendations": final_recommendations
    }

