//to jest na sztywno
// const movies = [
//     { id:1, title:"Incepcja", originalTitle:"Inception", year:2010, duration:"148 min", genres:["Sci-Fi","Thriller","Akcja"], director:"Christopher Nolan", cast:["Leonardo DiCaprio","Marion Cotillard","Tom Hardy","Elliot Page"], type:"movie", rating:8.8, platforms:[{name:"Netflix", type:"Subskrypcja"},{name:"HBO Max", type:"Subskrypcja"}], description:"Dom Cobb jest najlepszym ze złodziei specjalizujących się w wykradaniu sekretów ze snów..." },
//     { id:2, title:"Interstellar", originalTitle:"Interstellar", year:2014, duration:"169 min", genres:["Sci-Fi","Drama","Adventure"], director:"Christopher Nolan", cast:["Matthew McConaughey","Anne Hathaway","Jessica Chastain"], type:"movie", rating:8.6, platforms:[{name:"HBO Max", type:"Subskrypcja"},{name:"Apple TV", type:"Subskrypcja"}], description:"Grupa astronautów podróżuje przez kosmos, aby znaleźć nowy dom dla ludzkości." }
// ];
//
// const series = [
//     { id:101, title:"Breaking Bad", originalTitle:"Breaking Bad", year:2008, duration:"62 odcinki", genres:["Crime","Drama","Thriller"], director:"Vince Gilligan", cast:["Bryan Cranston","Aaron Paul","Anna Gunn"], type:"series", rating:9.5, platforms:[{name:"Netflix", type:"Subskrypcja"}], description:"Nauczyciel chemii zostaje producentem narkotyków." }
// ];

// ===== ULUBIONE - FUNKCJE POMOCNICZE =====
function getFavToken() {
    let token = localStorage.getItem("fav_token");
    if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem("fav_token", token);
    }
    return token;
}

function toggleFavorite(itemId) {
    fetch("/api/favorites", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            token: favToken,
            item_id: itemId
        })
    })
    .then(r => r.json())
    .then(data => {
        console.log("FAVORITE:", data.status);
    });
}

const favToken = getFavToken();

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
// ULUBIONE - dodatkowe elementy DOM
const favBtnFull = document.getElementById("favBtnFull");
const openFavorites = document.getElementById("openFavorites");
const favoritesSection = document.getElementById("favoritesSection");
const favoritesEl = document.getElementById("favorites");
const homeLinks = document.querySelectorAll(".nav-links a");

let movies = [];
let series = [];
let allItems = [];
let userReviewRating = 0;
let currentFavorites = []; // ULUBIONE - lista ID ulubionych filmów

// ===== POBIERANIE FILMÓW I SERIALI =====
fetch("/api/items")
    .then(res => res.json())
    .then(items => {
        movies = items.filter(i => i.type === "movie");
        series = items.filter(i => i.type === "series");
        allItems = items;
        
        // ULUBIONE - pobierz listę ulubionych przed renderowaniem
        fetch(`/api/favorites?token=${favToken}`)
            .then(res => res.json())
            .then(itemIds => {
                currentFavorites = itemIds.map(id => parseInt(id));
                render(movies, moviesEl);
                render(series, seriesEl);
                
                // ULUBIONE - sprawdź link udostępniony
                checkSharedFavorites();
            });
        
        // ULUBIONE - listener na przycisk "Moje ulubione"
        if (openFavorites) {
            openFavorites.addEventListener("click", () => {
                if (allItems.length === 0) {
                    console.log("Czekamy na załadowanie filmów i seriali...");
                    return;
                }

                fetch(`/api/favorites?token=${favToken}`)
                    .then(res => res.json())
                    .then(itemIds => {
                        const favIds = itemIds.map(id => parseInt(id));
                        const favItems = allItems.filter(i => favIds.includes(i.id));

                        // Ukrywamy wszystkie sekcje poza ulubionymi
                        document.querySelector(".hero").style.display = "none";
                        document.getElementById("movies").parentElement.style.display = "none";
                        document.getElementById("series").parentElement.style.display = "none";

                        // Pokazujemy ulubione
                        favoritesSection.style.display = "block";

                        // Renderujemy ulubione
                        if (favItems.length > 0) {
                            render(favItems, favoritesEl);
                        } else {
                            favoritesEl.innerHTML = "<p>Nie masz jeszcze ulubionych filmów ani seriali.</p>";
                        }
                        
                        // Dodaj przycisk udostępniania
                        addShareButton();
                    });
            });
        }
        
        // ULUBIONE - listener na powrót do strony głównej
        if (homeLinks[0]) {
            homeLinks[0].addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelector(".hero").style.display = "block";
                document.getElementById("movies").parentElement.style.display = "block";
                document.getElementById("series").parentElement.style.display = "block";
                if (favoritesSection) favoritesSection.style.display = "none";
            });
        }
    });

// ===== RENDEROWANIE KART =====
function render(items, container) {
    container.innerHTML = "";
    items.forEach(item => {
        const poster = item.poster ? item.poster : `/public/img/${item.id}.jpg`;
        const isFavorite = currentFavorites.includes(item.id);
        const heartIcon = isFavorite ? "❤️" : "🤍";
        
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.id = item.id;
        card.style.position = "relative";
        
        card.innerHTML = `
            <button class="fav-btn-card ${isFavorite ? 'active' : ''}" data-id="${item.id}" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                font-size: 20px;
                cursor: pointer;
                z-index: 10;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                ${heartIcon}
            </button>
            <img class="poster ${item.type}" src="${poster}" alt="${item.title}" onerror="this.src='/public/img/placeholder.svg';">
            <div class="card-info">
                <h3>${item.title}</h3>
                <span class="rating">⭐ ${item.rating}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // ULUBIONE - dodaj listenery do serduszek
    container.querySelectorAll('.fav-btn-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = parseInt(btn.dataset.id);
            toggleFavorite(itemId);
            
            const index = currentFavorites.indexOf(itemId);
            if (index > -1) {
                currentFavorites.splice(index, 1);
                btn.textContent = "🤍";
                btn.classList.remove('active');
            } else {
                currentFavorites.push(itemId);
                btn.textContent = "❤️";
                btn.classList.add('active');
            }
            
            updateAllHearts();
            
            if (favoritesSection && favoritesSection.style.display === "block") {
                setTimeout(() => {
                    fetch(`/api/favorites?token=${favToken}`)
                        .then(res => res.json())
                        .then(itemIds => {
                            const favIds = itemIds.map(id => parseInt(id));
                            const favItems = allItems.filter(i => favIds.includes(i.id));
                            
                            if (favItems.length > 0) {
                                render(favItems, favoritesEl);
                            } else {
                                favoritesEl.innerHTML = "<p>Nie masz jeszcze ulubionych filmów ani seriali.</p>";
                            }
                        });
                }, 100);
            }
        });
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
    fetch(`/api/reviews?stats=1&item_id=${itemId}`)
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
                const response = await fetch(`/api/reviews?action=like`, {
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
                        const statsResponse = await fetch(`/api/reviews?stats=1&item_id=${itemId}`);
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
        const reviewsResponse = await fetch(`/api/reviews?item_id=${itemId}`);
        const reviews = await reviewsResponse.json();
        
        const statsResponse = await fetch(`/api/reviews?stats=1&item_id=${itemId}`);
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
    
    // ULUBIONE - sprawdź czy film jest w ulubionych
    if (favBtnFull) {
        fetch(`/api/favorites?token=${favToken}`)
        .then(res => res.json())
        .then(favIds => {
            if (favIds.includes(item.id)) {
                favBtnFull.classList.add("active");
                favBtnFull.textContent = "Usuń z ulubionych";
            } else {
                favBtnFull.classList.remove("active");
                favBtnFull.textContent = "Dodaj do ulubionych";
            }
        });
    }
    
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
        const response = await fetch("/api/reviews", {
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
        const poster = item.poster ? item.poster : `/public/img/${item.id}.jpg`;
        const isFavorite = currentFavorites.includes(item.id);
        const heartIcon = isFavorite ? "❤️" : "🤍";
        
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.id = item.id;
        card.style.position = "relative";
        
        card.innerHTML = `
            <button class="fav-btn-card ${isFavorite ? 'active' : ''}" data-id="${item.id}" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                font-size: 20px;
                cursor: pointer;
                z-index: 10;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                ${heartIcon}
            </button>
            <img class="poster ${item.type}" src="${posterSrc}" alt="${item.title}" onerror="this.onerror=null; this.src='/public/img/placeholder.svg';" />
            <div class="card-info">
                <h3>${item.title}</h3>
                <span class="rating">⭐ ${item.rating}</span>
            </div>
        `;
        
        searchResults.appendChild(card);
    });
    
    // ULUBIONE - dodaj listenery do serduszek w wynikach wyszukiwania
    searchResults.querySelectorAll('.fav-btn-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = parseInt(btn.dataset.id);
            toggleFavorite(itemId);
            
            const index = currentFavorites.indexOf(itemId);
            if (index > -1) {
                currentFavorites.splice(index, 1);
                btn.textContent = "🤍";
                btn.classList.remove('active');
            } else {
                currentFavorites.push(itemId);
                btn.textContent = "❤️";
                btn.classList.add('active');
            }
            
            updateAllHearts();
        });
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
    const container = document.getElementById("genreFilters");
    if (!container) return;
    
    container.innerHTML = "";
    const genres = getUniqueGenres();
    
    genres.forEach(genre => {
        const wrapper = document.createElement("label");
        wrapper.className = "filter-checkbox";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = genre;
        checkbox.className = "genre-checkbox";
        checkbox.addEventListener("change", performAdvancedSearch);
        
        const span = document.createElement("span");
        span.textContent = genre;
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(span);
        container.appendChild(wrapper);
    });
    
    // Ukryj kontener domyślnie
    container.style.display = "none";
}



function getUniquePlatforms() {
    const platformsSet = new Set();
    allItems.forEach(item => {
        if (Array.isArray(item.platforms)) {
            item.platforms.forEach(platform => {
                const platformName = typeof platform === 'object' ? platform.name : platform;
                platformsSet.add(platformName);
            });
        }
    });
    return Array.from(platformsSet).sort();
}

function createPlatformFilters() {
    const container = document.getElementById("platformFilters");
    if (!container) return;
    
    container.innerHTML = "";
    const platforms = getUniquePlatforms();
    
    platforms.forEach(platform => {
        const wrapper = document.createElement("label");
        wrapper.className = "filter-checkbox";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = platform;
        checkbox.className = "platform-checkbox";
        checkbox.
addEventListener("change", performAdvancedSearch);
        
        const span = document.createElement("span");
        span.textContent = platform;
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(span);
        container.appendChild(wrapper);
    });
    
    // Ukryj kontener domyślnie
    container.style.display = "none";
}

function styleSearchFilters() {
    // Obsługa interaktywności dla nagłówków filtrów
    const filterSections = document.querySelectorAll(".filter-section");
    filterSections.forEach(section => {
        const h3 = section.querySelector("h3");
        if (h3) {
            // Dodaj strzałkę jeśli jeszcze jej nie ma
            if (!h3.querySelector("span")) {
                const arrow = document.createElement("span");
                arrow.textContent = "▼";
                h3.appendChild(arrow);
            }
            
            const arrow = h3.querySelector("span");
            
            // Event listener na kliknięcie
            h3.addEventListener("click", function() {
                const section = this.closest(".filter-section");
                const options = section.querySelector(".filter-options");
                const isHidden = options.style.display === "none";
                
                options.style.display = isHidden ? "flex" : "none";
                
                // Rotuj strzałkę
                if (arrow) {
                    arrow.style.transform = isHidden ? "rotate(0deg)" : "rotate(-180deg)";
                }
            });
        }
    });
}

function performAdvancedSearch() {
    const q = overlaySearchInput.value.toLowerCase();
    
    // Pobierz zaznaczone filtry
    const selectedGenres = Array.from(
        document.querySelectorAll(".genre-checkbox:checked")
    ).map(cb => cb.value);
    
    const selectedPlatforms = Array.from(
        document.querySelectorAll(".platform-checkbox:checked")
    ).map(cb => cb.value);
    
    const filtered = allItems.filter(item => {
        // Match title, director, and cast with search text
        const titleMatch = !q || item.title.toLowerCase().includes(q);
        const directorMatch = !q || (item.director && item.director.toLowerCase().includes(q));
        const actorMatch = !q || (Array.isArray(item.cast) && item.cast.some(actor => 
            actor.toLowerCase().includes(q)
        ));
        const textMatch = titleMatch || directorMatch || actorMatch;
        
        // Match genres (checkbox filter)
        const genreMatch = selectedGenres.length === 0 || 
            (Array.isArray(item.genres) && selectedGenres.some(g => item.genres.includes(g)));
        
        // Match platform (checkbox filter)
        const platformMatch = selectedPlatforms.length === 0 || 
            (Array.isArray(item.platforms) && item.platforms.some(platform => {
                const platformName = typeof platform === 'object' ? platform.name : platform;
                return selectedPlatforms.includes(platformName);
            }));
        
        return textMatch && genreMatch && platformMatch;
    });
    
    renderSearchResults(filtered);
}

document.getElementById("openSearch").onclick = () => {
    searchOverlay.style.display = "flex";
    overlaySearchInput.value = "";
    
    // Initialize filters if not already done
    const genreFilters = document.getElementById("genreFilters");
    if (genreFilters && !genreFilters.hasChildNodes()) {
        createGenreFilters();
        createPlatformFilters();
    }
    
    // Styluj filtry wyszukiwania
    styleSearchFilters();
    
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

// ===== ULUBIONE - FUNKCJE DODATKOWE =====

// ULUBIONE - Funkcja do aktualizacji wszystkich serduszek
function updateAllHearts() {
    document.querySelectorAll('.fav-btn-card').forEach(btn => {
        const itemId = parseInt(btn.dataset.id);
        const isFavorite = currentFavorites.includes(itemId);
        
        if (isFavorite) {
            btn.textContent = "❤️";
            btn.classList.add('active');
        } else {
            btn.textContent = "🤍";
            btn.classList.remove('active');
        }
    });
}

// ===== ULUBIONE - LISTENER NA PRZYCISK W FULL OVERLAY =====
if (favBtnFull) {
    favBtnFull.addEventListener("click", () => {
        const itemId = parseInt(fullOverlay.dataset.itemId);
        if (!itemId) return;

        toggleFavorite(itemId);

        if (favBtnFull.classList.contains("active")) {
            favBtnFull.classList.remove("active");
            favBtnFull.textContent = "Dodaj do ulubionych";
            const index = currentFavorites.indexOf(itemId);
            if (index > -1) {
                currentFavorites.splice(index, 1);
            }
        } else {
            favBtnFull.classList.add("active");
            favBtnFull.textContent = "Usuń z ulubionych";
            if (!currentFavorites.includes(itemId)) {
                currentFavorites.push(itemId);
            }
        }
        
        updateAllHearts();
    });
}

// ===== ULUBIONE - FUNKCJE UDOSTĘPNIANIA =====
function checkSharedFavorites() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedToken = urlParams.get('favorites');
    
    if (sharedToken && sharedToken !== favToken && allItems.length > 0) {
        document.querySelector(".hero").style.display = "none";
        document.getElementById("movies").parentElement.style.display = "none";
        document.getElementById("series").parentElement.style.display = "none";
        
        fetch(`/api/favorites?token=${sharedToken}`)
            .then(res => res.json())
            .then(itemIds => {
                const favIds = itemIds.map(id => parseInt(id));
                const favItems = allItems.filter(i => favIds.includes(i.id));
                
                if (favoritesSection) {
                    favoritesSection.style.display = "block";
                    
                    const header = favoritesSection.querySelector("h2");
                    header.textContent = "🎬 Ulubione użytkownika";
                    header.style.color = "#3b82f6";
                    
                    let infoP = favoritesSection.querySelector(".shared-info");
                    if (!infoP) {
                        infoP = document.createElement("p");
                        infoP.className = "shared-info";
                        infoP.style.cssText = "color: #94a3b8; margin-bottom: 2rem; text-align: center;";
                        infoP.textContent = "Ktoś podzielił się z Tobą swoją listą ulubionych!";
                        favoritesSection.insertBefore(infoP, favoritesEl);
                    }
                    
                    if (favItems.length > 0) {
                        render(favItems, favoritesEl);
                    } else {
                        favoritesEl.innerHTML = "<p style='text-align:center; color:#94a3b8; padding:2rem;'>Ten użytkownik nie ma jeszcze żadnych ulubionych.</p>";
                    }
                    
                    document.querySelectorAll(".nav-links a").forEach(link => link.classList.remove("active"));
                    if (openFavorites) openFavorites.classList.add("active");
                }
            });
    }
}

function addShareButton() {
    if (document.getElementById("shareFavoritesBtn")) return;
    
    const shareBtn = document.createElement("button");
    shareBtn.id = "shareFavoritesBtn";
    shareBtn.textContent = "🔗 Udostępnij moje ulubione";
    shareBtn.style.cssText = `
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        margin-bottom: 2rem;
    `;
    
    shareBtn.onclick = () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?favorites=${favToken}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('✅ Link skopiowany!\n\nWyślij go znajomym, aby zobaczyli Twoje ulubione.');
        }).catch(() => {
            prompt('Skopiuj ten link:', shareUrl);
        });
    };
    
    if (favoritesSection) {
        favoritesSection.insertBefore(shareBtn, favoritesEl);
    }
}

// ===== INICJALIZACJA =====
document.addEventListener('DOMContentLoaded', () => {
    addLikeDislikeListeners();
});