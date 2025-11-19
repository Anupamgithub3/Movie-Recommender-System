from fastapi import FastAPI
import pandas as pd
import ast
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# LOAD CSV FILES
# =====================

movies = pd.read_csv("movies.csv")
credits = pd.read_csv("credits.csv")

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
cv = CountVectorizer(max_features=5000, stop_words='english')
vectors = cv.fit_transform(new_df['tags']).toarray()

# Similarity matrix
similarity = cosine_similarity(vectors)


# =====================
# API ENDPOINT
# =====================

@app.get("/recommend")
def recommend(movie: str):
    movie = movie.title()

    if movie not in new_df['title'].values:
        return {"error": "Movie not found"}

    index = new_df[new_df['title'] == movie].index[0]
    distances = similarity[index]

    movie_list = sorted(
        list(enumerate(distances)),
        reverse=True,
        key=lambda x: x[1]
    )[1:6]

    recommendations = [new_df.iloc[i[0]].title for i in movie_list]

    return {"movie": movie, "recommendations": recommendations}
