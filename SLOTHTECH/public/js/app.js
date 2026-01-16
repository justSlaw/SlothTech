//to jest na sztywno
// const movies = [
//     { id:1, title:"Incepcja", originalTitle:"Inception", year:2010, duration:"148 min", genres:["Sci-Fi","Thriller","Akcja"], director:"Christopher Nolan", cast:["Leonardo DiCaprio","Marion Cotillard","Tom Hardy","Elliot Page"], type:"movie", rating:8.8, platforms:[{name:"Netflix", type:"Subskrypcja"},{name:"HBO Max", type:"Subskrypcja"}], description:"Dom Cobb jest najlepszym ze złodziei specjalizujących się w wykradaniu sekretów ze snów..." },
//     { id:2, title:"Interstellar", originalTitle:"Interstellar", year:2014, duration:"169 min", genres:["Sci-Fi","Drama","Adventure"], director:"Christopher Nolan", cast:["Matthew McConaughey","Anne Hathaway","Jessica Chastain"], type:"movie", rating:8.6, platforms:[{name:"HBO Max", type:"Subskrypcja"},{name:"Apple TV", type:"Subskrypcja"}], description:"Grupa astronautów podróżuje przez kosmos, aby znaleźć nowy dom dla ludzkości." }
// ];
//
// const series = [
//     { id:101, title:"Breaking Bad", originalTitle:"Breaking Bad", year:2008, duration:"62 odcinki", genres:["Crime","Drama","Thriller"], director:"Vince Gilligan", cast:["Bryan Cranston","Aaron Paul","Anna Gunn"], type:"series", rating:9.5, platforms:[{name:"Netflix", type:"Subskrypcja"}], description:"Nauczyciel chemii zostaje producentem narkotyków." }
// ];
// ===== ELEMENTY DOM =====
const moviesEl = document.getElementById("movies");
const seriesEl = document.getElementById("series");
const fullOverlay = document.getElementById("fullOverlay");
const reviewInput = document.getElementById("reviewInput");
const reviewsList = document.getElementById("reviewsList");
const submitReview = document.getElementById("submitReview");
const searchResults = document.getElementById("searchResults");
const overlaySearchInput = document.getElementById("overlaySearchInput");
const searchOverlay = document.getElementById("searchOverlay");

let movies = [];
let series = [];
let allItems = [];
let userReviewRating = 0;

// ===== POBIERANIE FILMÓW I SERIALI =====
fetch("/api/items.php")
    .then(res => res.json())
    .then(items => {
        movies = items.filter(i => i.type === "movie");
        series = items.filter(i => i.type === "series");
        allItems = items;
        render(movies, moviesEl);
        render(series, seriesEl);
    });

// ===== RENDEROWANIE KART =====
function render(items, container) {
    container.innerHTML = "";
    items.forEach(item => {
        const poster = `/public/img/${item.id}.jpg`;
        container.innerHTML += `
            <article class="card" data-id="${item.id}">
                <img class="poster ${item.type}" src="${poster}" alt="${item.title}" onerror="this.src='/public/img/placeholder.svg';">
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <span class="rating">⭐ ${item.rating}</span>
                </div>
            </article>
        `;
    });
}

// ===== RENDEROWANIE GWIAZDEK =====
function renderStars(container, rating = 0, interactive = false) {
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        star.style.color = i <= rating ? "gold" : "lightgray";
        star.style.cursor = interactive ? "pointer" : "default";
        star.style.fontSize = interactive ? "1.5rem" : "1rem";
        star.style.marginRight = "2px";

        if (interactive) {
            star.addEventListener("mouseover", () => {
                const stars = container.querySelectorAll("span");
                stars.forEach((s, idx) => {
                    s.style.color = idx < i ? "gold" : "lightgray";
                });
            });

            star.addEventListener("mouseout", () => {
                const stars = container.querySelectorAll("span");
                stars.forEach((s, idx) => {
                    s.style.color = idx < userReviewRating ? "gold" : "lightgray";
                });
            });

            star.addEventListener("click", () => {
                userReviewRating = i;
                const stars = container.querySelectorAll("span");
                stars.forEach((s, idx) => {
                    s.style.color = idx < userReviewRating ? "gold" : "lightgray";
                });
                console.log("Ocena ustawiona na:", userReviewRating);
            });
        }
        container.appendChild(star);
    }
}

// ===== FUNKCJA DO ŁADOWANIA STATYSTYK =====
function loadStats(itemId) {
    fetch(`/api/reviews.php?stats=1&item_id=${itemId}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('averageRating').textContent = data.average || '0.0';
            document.getElementById('reviewsCount').textContent = data.count || '0';
            return data.likesData || [];
        })
        .catch(error => {
            console.error("Błąd ładowania statystyk:", error);
        });
}

// ===== FUNKCJA DO DODAWANIA LIKE/DISLIKE =====
function addLikeDislikeListeners() {
    document.addEventListener('click', async (e) => {
        const button = e.target;
        if (button.classList.contains('like-btn') || button.classList.contains('dislike-btn')) {
            const reviewId = button.dataset.reviewId;
            if (!reviewId) {
                console.error("Brak reviewId w przycisku");
                return;
            }
            
            const type = button.classList.contains('like-btn') ? 'like' : 'dislike';
            const isLike = type === 'like';
            const otherButton = isLike 
                ? button.parentElement.querySelector('.dislike-btn') 
                : button.parentElement.querySelector('.like-btn');
            
            console.log("Kliknięto:", type, "reviewId:", reviewId);
            
            try {
                const response = await fetch(`/api/reviews.php?action=like`, {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({review_id: reviewId, type: type})
                });
                
                if (!response.ok) throw new Error("HTTP error " + response.status);
                
                const data = await response.json();
                if (data.success) {
                    console.log("Like/dislike zapisany");
                    
                    // Sprawdź czy przycisk był już aktywny
                    const wasActive = button.classList.contains(isLike ? 'liked' : 'disliked');
                    
                    // Resetuj wszystkie klasy
                    button.classList.remove('liked', 'disliked');
                    if (otherButton) otherButton.classList.remove('liked', 'disliked');
                    
                    // Jeśli nie był aktywny - ustaw nowy stan
                    if (!wasActive) {
                        button.classList.add(isLike ? 'liked' : 'disliked');
                    }
                    
                    // Pobierz aktualne dane z serwera
                    const itemId = fullOverlay.dataset.itemId;
                    if (itemId) {
                        const statsResponse = await fetch(`/api/reviews.php?stats=1&item_id=${itemId}`);
                        const statsData = await statsResponse.json();
                        
                        if (statsData.likesData) {
                            // Znajdź przyciski dla tej recenzji
                            const reviewButtons = document.querySelectorAll(`[data-review-id="${reviewId}"]`);
                            reviewButtons.forEach(btn => {
                                const likeData = statsData.likesData.find(r => r.id == reviewId);
                                if (likeData) {
                                    if (btn.classList.contains('like-btn')) {
                                        btn.textContent = `👍 ${likeData.likes || 0}`;
                                        if (likeData.user_liked) {
                                            btn.classList.add('liked');
                                        } else {
                                            btn.classList.remove('liked');
                                        }
                                    } else if (btn.classList.contains('dislike-btn')) {
                                        btn.textContent = `👎 ${likeData.dislikes || 0}`;
                                        if (likeData.user_disliked) {
                                            btn.classList.add('disliked');
                                        } else {
                                            btn.classList.remove('disliked');
                                        }
                                    }
                                }
                            });
                            
                            // Aktualizuj ogólne statystyki
                            document.getElementById('averageRating').textContent = statsData.average || '0.0';
                            document.getElementById('reviewsCount').textContent = statsData.count || '0';
                        }
                    }
                } else {
                    alert(data.error || "Błąd przy zapisywaniu reakcji");
                }
            } catch (error) {
                console.error("Błąd przy like/dislike:", error);
                alert("Wystąpił błąd");
            }
        }
    });
}

// ===== FUNKCJA DO ŁADOWANIA RECENZJI Z LIKE/DISLIKE =====
async function loadReviewsWithLikes(itemId) {
    try {
        const reviewsResponse = await fetch(`/api/reviews.php?item_id=${itemId}`);
        const reviews = await reviewsResponse.json();
        
        const statsResponse = await fetch(`/api/reviews.php?stats=1&item_id=${itemId}`);
        const statsData = await statsResponse.json();
        
        const likesMap = {};
        if (statsData.likesData) {
            statsData.likesData.forEach(r => {
                likesMap[r.id] = {
                    likes: r.likes || 0,
                    dislikes: r.dislikes || 0,
                    user_liked: r.user_liked || 0,
                    user_disliked: r.user_disliked || 0
                };
            });
        }
        
        return { reviews, likesMap };
    } catch (error) {
        console.error("Błąd ładowania recenzji:", error);
        return { reviews: [], likesMap: {} };
    }
}

// ===== KLIKNIĘCIE NA FILM / SERIAL =====
document.addEventListener("click", async (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    
    const id = parseInt(card.dataset.id);
    const item = allItems.find(i => i.id === id);
    
    fullOverlay.style.display = "flex";
    fullOverlay.dataset.itemId = id;
    
    // Załaduj statystyki
    loadStats(id);
    
    // czyszczenie recenzji
    reviewsList.innerHTML = "";
    userReviewRating = 0;
    reviewInput.value = "";
    renderStars(document.getElementById("reviewStars"), 0, true);
    
    // Załaduj szczegóły filmu/serialu
    document.getElementById("fullTitle").textContent = item.title;
    document.getElementById("fullOriginalTitle").textContent = item.originalTitle || "";
    document.getElementById("fullRatingValue").textContent = item.rating;
    document.getElementById("fullYear").textContent = item.year;
    document.getElementById("fullDuration").textContent = item.duration || "";
    document.getElementById("fullDescription").textContent = item.description;
    document.getElementById("fullDirector").textContent = item.director || "";
    document.getElementById("fullCast").textContent = item.cast ? item.cast.join(", ") : "";
    
    const genresEl = document.getElementById("fullGenres");
    genresEl.innerHTML = "";
    if (item.genres) {
        item.genres.forEach(g => {
            const span = document.createElement("span");
            span.textContent = g;
            genresEl.appendChild(span);
        });
    }
    
    const platformsEl = document.getElementById("fullPlatforms");
    platformsEl.innerHTML = "";
    if (Array.isArray(item.platforms)) {
        item.platforms.forEach(p => {
            const div = document.createElement("div");
            div.textContent = `${p.name} - ${p.type}`;
            platformsEl.appendChild(div);
        });
    } else {
        platformsEl.textContent = "Brak informacji o platformach";
    }
    
    renderStars(document.getElementById("fullRatingStars"), Math.round(item.rating));
    
    // Załaduj recenzje z like/dislike
    const { reviews, likesMap } = await loadReviewsWithLikes(id);
    
    reviews.forEach((r) => {
        const div = document.createElement("div");
        div.classList.add("review-item");
        
        // gwiazdki oceny
        const starsDiv = document.createElement("div");
        starsDiv.classList.add("review-stars");
        starsDiv.dataset.rating = r.rating;
        for (let i = 1; i <= 10; i++) {
            const star = document.createElement("span");
            star.textContent = "★";
            star.style.color = i <= r.rating ? "gold" : "lightgray";
            starsDiv.appendChild(star);
        }
        
        // treść recenzji
        const textDiv = document.createElement("div");
        textDiv.classList.add("review-text");
        textDiv.textContent = r.text || "";
        
        // data
        const dateDiv = document.createElement("div");
        dateDiv.classList.add("review-date");
        dateDiv.textContent = r.date;
        
        // like/dislike buttons z aktualnymi licznikami
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'review-actions';
        
        const likeBtn = document.createElement('button');
        const likeCount = likesMap[r.id]?.likes || 0;
        likeBtn.textContent = `👍 ${likeCount}`;
        likeBtn.className = 'like-btn';
        if (likesMap[r.id]?.user_liked) {
            likeBtn.classList.add('liked');
        }
        likeBtn.dataset.reviewId = r.id;
        
        const dislikeBtn = document.createElement('button');
        const dislikeCount = likesMap[r.id]?.dislikes || 0;
        dislikeBtn.textContent = `👎 ${dislikeCount}`;
        dislikeBtn.className = 'dislike-btn';
        if (likesMap[r.id]?.user_disliked) {
            dislikeBtn.classList.add('disliked');
        }
        dislikeBtn.dataset.reviewId = r.id;
        
        actionsDiv.appendChild(likeBtn);
        actionsDiv.appendChild(dislikeBtn);
        
        // dodaj wszystkie elementy
        div.appendChild(starsDiv);
        div.appendChild(textDiv);
        div.appendChild(dateDiv);
        div.appendChild(actionsDiv);
        
        reviewsList.appendChild(div);
    });
});

// ===== DODAWANIE RECENZJI =====
submitReview.addEventListener("click", async () => {
    const text = reviewInput.value.trim();
    const itemId = parseInt(fullOverlay.dataset.itemId);
    
    if (!itemId || (userReviewRating === 0 && !text)) {
        alert("Wystaw ocenę lub napisz recenzję!");
        return;
    }
    
    try {
        const response = await fetch("/api/reviews.php", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({item_id: itemId, rating: userReviewRating, text})
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Utwórz nowy element recenzji
            const div = document.createElement("div");
            div.classList.add("review-item");
            
            // gwiazdki w recenzji
            const starsDiv = document.createElement("div");
            starsDiv.classList.add("review-stars");
            starsDiv.dataset.rating = userReviewRating;
            for (let i = 1; i <= 10; i++) {
                const star = document.createElement("span");
                star.textContent = "★";
                star.style.color = i <= userReviewRating ? "gold" : "lightgray";
                starsDiv.appendChild(star);
            }
            
            const textDiv = document.createElement("div");
            textDiv.classList.add("review-text");
            textDiv.textContent = text;
            
            const dateDiv = document.createElement("div");
            dateDiv.classList.add("review-date");
            dateDiv.textContent = new Date().toLocaleString('pl-PL');
            
            // like/dislike buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'review-actions';
            
            const likeBtn = document.createElement('button');
            likeBtn.textContent = '👍 0';
            likeBtn.className = 'like-btn';
            likeBtn.dataset.reviewId = data.reviewId;
            
            const dislikeBtn = document.createElement('button');
            dislikeBtn.textContent = '👎 0';
            dislikeBtn.className = 'dislike-btn';
            dislikeBtn.dataset.reviewId = data.reviewId;
            
            actionsDiv.appendChild(likeBtn);
            actionsDiv.appendChild(dislikeBtn);
            
            // dodaj wszystkie elementy
            div.appendChild(starsDiv);
            div.appendChild(textDiv);
            div.appendChild(dateDiv);
            div.appendChild(actionsDiv);
            
            reviewsList.prepend(div);
            
            // Resetuj formularz
            userReviewRating = 0;
            reviewInput.value = "";
            renderStars(document.getElementById("reviewStars"), 0, true);
            
            // odśwież statystyki
            loadStats(itemId);
        } else {
            alert(data.error || "Błąd przy zapisywaniu recenzji");
        }
    } catch (error) {
        console.error("Błąd dodawania recenzji:", error);
        alert("Wystąpił błąd podczas dodawania recenzji");
    }
});

// ===== ZAMYKANIE OVERLAY =====
document.getElementById("closeFullOverlay").onclick = () => fullOverlay.style.display = "none";

window.addEventListener("click", e => {
    if(e.target === fullOverlay) fullOverlay.style.display = "none";
});

// ===== SEARCH =====
function renderSearchResults(items) {
    searchResults.innerHTML = "";
    items.forEach(item => {
        const posterSrc = `/public/img/${item.id}.jpg`;
        searchResults.innerHTML += `
            <article class="card" data-id="${item.id}">
                <img class="poster ${item.type}" src="${posterSrc}" alt="${item.title}" onerror="this.onerror=null; this.src='/public/img/placeholder.svg';" />
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <span class="rating">⭐ ${item.rating}</span>
                </div>
            </article>
        `;
    });
}

// Get unique genres from all items
function getUniqueGenres() {
    const genresSet = new Set();
    allItems.forEach(item => {
        if (Array.isArray(item.genres)) {
            item.genres.forEach(g => genresSet.add(g));
        }
    });
    return Array.from(genresSet).sort();
}

function createGenreFilters() {
    const searchHeader = document.querySelector(".search-header");
    const filterDiv = document.createElement("div");
    filterDiv.id = "genreFilters";
    filterDiv.className = "genre-filters";
    
    const label = document.createElement("p");
    label.textContent = "Filtry:";
    label.style.marginTop = "1rem";
    label.style.marginBottom = "0.5rem";
    label.style.color = "#cbd5e1";
    label.style.fontSize = "0.9rem";
    filterDiv.appendChild(label);
    
    const genres = getUniqueGenres();
    genres.forEach(genre => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = genre;
        checkbox.id = `genre-${genre}`;
        checkbox.addEventListener("change", performAdvancedSearch);
        
        const genreLabel = document.createElement("label");
        genreLabel.htmlFor = `genre-${genre}`;
        genreLabel.textContent = genre;
        genreLabel.style.marginRight = "1rem";
        genreLabel.style.marginBottom = "0.5rem";
        genreLabel.style.display = "inline-block";
        genreLabel.style.color = "#e2e8f0";
        genreLabel.style.cursor = "pointer";
        
        filterDiv.appendChild(checkbox);
        filterDiv.appendChild(genreLabel);
    });
    
    searchHeader.appendChild(filterDiv);
}

function performAdvancedSearch() {
    const q = overlaySearchInput.value.toLowerCase();
    const selectedGenres = Array.from(
        document.querySelectorAll("#genreFilters input[type='checkbox']:checked")
    ).map(cb => cb.value);
    
    const filtered = allItems.filter(item => {
        // Match title
        const titleMatch = item.title.toLowerCase().includes(q);
        // Match genres
        const genreMatch = selectedGenres.length === 0 || 
            (Array.isArray(item.genres) && selectedGenres.some(g => item.genres.includes(g)));
        return titleMatch && genreMatch;
    });
    
    renderSearchResults(filtered);
}

document.getElementById("openSearch").onclick = () => {
    searchOverlay.style.display = "flex";
    overlaySearchInput.value = "";
    
    // Initialize genre filters if not already done
    if (!document.getElementById("genreFilters")) {
        createGenreFilters();
    }
    
    renderSearchResults(allItems);
    overlaySearchInput.focus();
};

document.getElementById("closeSearch").onclick = () => searchOverlay.style.display = "none";

overlaySearchInput.addEventListener("input", performAdvancedSearch);

//Change Site Theme
const buttons = document.querySelectorAll(".theme-switcher button");
buttons.forEach(button => {
    button.addEventListener("click", () => {
        document.body.className = button.dataset.theme;
    });
});

// ===== INICJALIZACJA =====
document.addEventListener('DOMContentLoaded', () => {
    addLikeDislikeListeners();
});