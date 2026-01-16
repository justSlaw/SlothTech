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
            </article>`;
    });
}

// ===== RENDEROWANIE GWIAZDEK =====
function renderStars(container, rating = 0, interactive = false) {
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        star.style.color = i <= rating ? "gold" : "lightgray";

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

// ===== KLIKNIĘCIE NA FILM / SERIAL =====
document.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    const id = parseInt(card.dataset.id);
    const item = allItems.find(i => i.id === id);

    fullOverlay.style.display = "flex";
    fullOverlay.dataset.itemId = id;

    // czyszczenie recenzji
    reviewsList.innerHTML = "";
    userReviewRating = 0;
    reviewInput.value = "";
    renderStars(document.getElementById("reviewStars"), 0, true);

    // pobranie recenzji z backendu
    fetch(`/api/reviews.php?item_id=${id}`)
    .then(res => res.json())
    .then(reviews => {
        reviews.forEach(r => {
            const div = document.createElement("div");
            div.classList.add("review-item");

            const starsDiv = document.createElement("div");
            starsDiv.classList.add("review-stars");
            starsDiv.dataset.rating = r.rating; // zapisujemy ocenę
            for (let i = 1; i <= 10; i++) {
                const star = document.createElement("span");
                star.textContent = "★";
                star.style.color = i <= r.rating ? "gold" : "lightgray"; // ustaw kolor wg r.rating
                starsDiv.appendChild(star);
            }

            const textDiv = document.createElement("div");
            textDiv.classList.add("review-text");
            textDiv.textContent = r.text || "";

            const dateDiv = document.createElement("div");
            dateDiv.classList.add("review-date");
            dateDiv.textContent = r.date;

            div.appendChild(starsDiv);
            div.appendChild(textDiv);
            div.appendChild(dateDiv);
            reviewsList.appendChild(div);
        });
    });

});

// ===== DODAWANIE RECENZJI =====
submitReview.addEventListener("click", () => {
    const text = reviewInput.value.trim();
    const itemId = parseInt(fullOverlay.dataset.itemId);

    if (!itemId || (userReviewRating === 0 && !text)) {
        alert("Wystaw ocenę lub napisz recenzję!");
        return;
    }

    fetch("/api/reviews.php", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({item_id: itemId, rating: userReviewRating, text})
    })
   .then(res => res.json())
.then(data => {
    if (data.success) {
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

        div.appendChild(starsDiv);
        div.appendChild(textDiv);
        div.appendChild(dateDiv);

        reviewsList.prepend(div);

        userReviewRating = 0;
        reviewInput.value = "";
        renderStars(document.getElementById("reviewStars"), 0, true);

    } else {
      
        alert(data.error || "Błąd przy zapisywaniu recenzji");
    }
    });

});

// ===== SZCZEGÓŁY FILMU / SERIALU =====
document.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if(!card) return;

    const id = card.dataset.id;
    const item = allItems.find(i => i.id == id);

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
    if(item.genres) item.genres.forEach(g => {
        const span = document.createElement("span");
        span.textContent = g;
        genresEl.appendChild(span);
    });

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

    reviewsList.innerHTML = "";
    userReviewRating = 0;
    fullOverlay.style.display = "flex";
    fullOverlay.dataset.itemId = item.id;
    renderStars(document.getElementById("fullRatingStars"), Math.round(item.rating));
    renderStars(document.getElementById("reviewStars"), 0, true);
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
                <img class="poster ${item.type}" src="${posterSrc}" alt="${item.title}" 
                     onerror="this.onerror=null; this.src='/public/img/placeholder.svg';" />
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <span class="rating">⭐ ${item.rating}</span>
                </div>
            </article>`;
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
            (Array.isArray(item.genres) && 
             selectedGenres.some(g => item.genres.includes(g)));
        
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
