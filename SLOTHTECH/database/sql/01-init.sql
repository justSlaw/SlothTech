CREATE TABLE IF NOT EXISTS items (
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

CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT ,
    genre TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS platforms
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT,
    type TEXT,
    UNIQUE(platform, type)
);