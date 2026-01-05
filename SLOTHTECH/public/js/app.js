//to jest na sztywno
// const movies = [
//     { id:1, title:"Incepcja", originalTitle:"Inception", year:2010, duration:"148 min", genres:["Sci-Fi","Thriller","Akcja"], director:"Christopher Nolan", cast:["Leonardo DiCaprio","Marion Cotillard","Tom Hardy","Elliot Page"], type:"movie", rating:8.8, platforms:[{name:"Netflix", type:"Subskrypcja"},{name:"HBO Max", type:"Subskrypcja"}], description:"Dom Cobb jest najlepszym ze złodziei specjalizujących się w wykradaniu sekretów ze snów..." },
//     { id:2, title:"Interstellar", originalTitle:"Interstellar", year:2014, duration:"169 min", genres:["Sci-Fi","Drama","Adventure"], director:"Christopher Nolan", cast:["Matthew McConaughey","Anne Hathaway","Jessica Chastain"], type:"movie", rating:8.6, platforms:[{name:"HBO Max", type:"Subskrypcja"},{name:"Apple TV", type:"Subskrypcja"}], description:"Grupa astronautów podróżuje przez kosmos, aby znaleźć nowy dom dla ludzkości." }
// ];
//
// const series = [
//     { id:101, title:"Breaking Bad", originalTitle:"Breaking Bad", year:2008, duration:"62 odcinki", genres:["Crime","Drama","Thriller"], director:"Vince Gilligan", cast:["Bryan Cranston","Aaron Paul","Anna Gunn"], type:"series", rating:9.5, platforms:[{name:"Netflix", type:"Subskrypcja"}], description:"Nauczyciel chemii zostaje producentem narkotyków." }
// ];

const moviesEl = document.getElementById("movies");
const seriesEl = document.getElementById("series");
const fullOverlay = document.getElementById("fullOverlay");
const reviewInput = document.getElementById("reviewInput");
const reviewsList = document.getElementById("reviewsList");
const submitReview = document.getElementById("submitReview");
const searchOverlay = document.getElementById("searchOverlay");
const overlaySearchInput = document.getElementById("overlaySearchInput");
const searchResults = document.getElementById("searchResults");
//const allItems = [...movies, ...series];

//to do bazy danych z api
let movies =[];
let series = [];
let allItems = [];

let userReviewRating = 0;
//fetch z bazy danych
fetch("/api/items.php")
    .then(res => res.json())
    .then(items => {
        // podział na filmy i seriale
        movies = items.filter(item => item.type === "movie");
        series = items.filter(item => item.type === "series");
        allItems = items;

        // render
        render(movies, moviesEl);
        render(series, seriesEl);
    })
    .catch(err => {
        console.error("Błąd pobierania danych:", err);
    });

// renderowanie kart filmów/seriali
function render(items, container){
    container.innerHTML = "";
    items.forEach(item => {
        container.innerHTML += `<article class="card" data-id="${item.id}">
            <div class="poster ${item.type}"></div>
            <div class="card-info">
                <h3>${item.title}</h3>
                <span class="rating">⭐ ${item.rating}</span>
            </div>
        </article>`;
    });
}
//to można odpalić kiedy robimy na sztywno
//render(movies, moviesEl);
//render(series, seriesEl);

// funkcja renderująca gwiazdki
function renderStars(container, rating = 0, interactive = false) {
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        
        // Ustaw klasę selected jeśli i <= rating
        if (i <= rating) {
            star.classList.add("selected");
        }
        
        if (interactive) {
            star.addEventListener("mouseover", () => {
                // Tymczasowe podświetlenie
                const stars = container.querySelectorAll("span");
                stars.forEach((s, idx) => {
                    s.classList.toggle("selected", idx < i);
                });
            });
            
            star.addEventListener("mouseout", () => {
                // Przywróć oryginalny rating
                const stars = container.querySelectorAll("span");
                stars.forEach((s, idx) => {
                    s.classList.toggle("selected", idx < userReviewRating);
                });
            });
            
            star.addEventListener("click", () => {
                userReviewRating = i;
                // Po kliknięciu ustaw wszystkie gwiazdki do i jako selected
                const stars = container.querySelectorAll("span");
                stars.forEach((s, idx) => {
                    s.classList.toggle("selected", idx < i);
                });
                console.log("Ocena ustawiona na:", userReviewRating); // do debugowania
            });
        }
        
        container.appendChild(star);
    }
}

// dodawanie recenzji - POPRAWIONA WERSJA
submitReview.addEventListener("click", () => {
    const text = reviewInput.value.trim();
    if (userReviewRating === 0 && !text) {
        alert("Proszę wystawić ocenę lub napisać recenzję!");
        return;
    }

    const reviewDiv = document.createElement("div");
    reviewDiv.classList.add("review-item");
    
    // Gwiazdki w recenzji
    const starsDiv = document.createElement("div");
    starsDiv.classList.add("review-stars");
    
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        if (i <= userReviewRating) {
            star.classList.add("selected");
            star.style.color = "gold"; // DODAJ TO BEZPOŚREDNIO!
        }
        starsDiv.appendChild(star);
    }
    
    // Tekst oceny
    const ratingText = document.createElement("span");
    ratingText.textContent = ` ${userReviewRating}/10`;
    ratingText.style.marginLeft = "10px";
    ratingText.style.color = "gold";
    ratingText.style.fontWeight = "bold";
    
    reviewDiv.appendChild(starsDiv);
    reviewDiv.appendChild(ratingText);
    
    // Tekst recenzji
    if (text) {
        const textDiv = document.createElement("div");
        textDiv.textContent = text;
        textDiv.style.marginTop = "8px";
        textDiv.style.color = "#e5e7eb";
        reviewDiv.appendChild(textDiv);
    }
    
    // Data dodania
    const dateDiv = document.createElement("div");
    const now = new Date();
    dateDiv.textContent = now.toLocaleString('pl-PL');
    dateDiv.style.fontSize = "0.8rem";
    dateDiv.style.color = "#94a3b8";
    dateDiv.style.marginTop = "4px";
    reviewDiv.appendChild(dateDiv);
    
    reviewsList.prepend(reviewDiv); // dodaj na górze listy

    // Reset formularza
    reviewInput.value = "";
    userReviewRating = 0;
    
    // Zresetuj gwiazdki w formularzu
    const reviewStarsContainer = document.getElementById("reviewStars");
    reviewStarsContainer.innerHTML = "";
    renderStars(reviewStarsContainer, 0, true);
    
    console.log("Recenzja dodana z oceną:", userReviewRating);
});

// kliknięcie na kartę filmu/serialu
document.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if(!card) return;

    const id = card.dataset.id;
    const item = allItems.find(i=>i.id==id);

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
    if(item.genres) item.genres.forEach(g=>{
        const span = document.createElement("span");
        span.textContent = g;
        genresEl.appendChild(span);
    });

    //small fix, źle łapało arraya z platformami
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
    fullOverlay.style.display="flex";
    renderStars(document.getElementById("fullRatingStars"), Math.round(item.rating));
    renderStars(document.getElementById("reviewStars"), 0, true);
});

// zamykanie overlay
document.getElementById("closeFullOverlay").onclick = ()=>fullOverlay.style.display="none";
window.addEventListener("click", e => { if(e.target===fullOverlay) fullOverlay.style.display="none"; });



// SEARCH
function renderSearchResults(items){
    searchResults.innerHTML="";
    items.forEach(item=>{
        searchResults.innerHTML+=`<article class="card" data-id="${item.id}">
            <div class="poster ${item.type}"></div>
            <div class="card-info">
                <h3>${item.title}</h3>
                <span class="rating">⭐ ${item.rating}</span>
            </div>
        </article>`;
    });
}

document.getElementById("openSearch").onclick = ()=>{
    searchOverlay.style.display="flex";
    overlaySearchInput.value="";
    renderSearchResults(allItems);
    overlaySearchInput.focus();
};

document.getElementById("closeSearch").onclick = ()=>searchOverlay.style.display="none";

overlaySearchInput.addEventListener("input", ()=>{
    const q = overlaySearchInput.value.toLowerCase();
    const filtered = allItems.filter(item=>item.title.toLowerCase().includes(q));
    renderSearchResults(filtered);
});
