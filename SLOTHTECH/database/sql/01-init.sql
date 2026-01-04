CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT,
    year INTEGER,
    duration TEXT,
    genres TEXT,
    director TEXT,
    cast TEXT,
    type TEXT CHECK(type IN ('movie','series')),
    rating REAL,
    platforms TEXT,
    description TEXT
);
