// admin.js
document.addEventListener('DOMContentLoaded', function() {
    // Symulacja logowania (w prawdziwej aplikacji byłaby autentykacja)
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!adminLoggedIn && !window.location.href.includes('login.html')) {
        window.location.href = 'admin-login.html';
    }
    
    // Statystyki
    updateStats();
    
    // Ostatnio dodane
    loadRecentContent();
    
    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Szybkie akcje
    document.getElementById('addMovieBtn').addEventListener('click', () => {
        showAddForm('movie');
    });
    
    document.getElementById('addSeriesBtn').addEventListener('click', () => {
        showAddForm('series');
    });
});

function updateStats() {
    // Pobierz dane z localStorage lub API
    const movies = JSON.parse(localStorage.getItem('movies')) || [];
    const series = JSON.parse(localStorage.getItem('series')) || [];
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    
    document.getElementById('moviesCount').textContent = movies.length;
    document.getElementById('seriesCount').textContent = series.length;
    document.getElementById('reviewsCount').textContent = reviews.length;
}

function loadRecentContent() {
    const movies = JSON.parse(localStorage.getItem('movies')) || [];
    const series = JSON.parse(localStorage.getItem('series')) || [];
    
    const allContent = [...movies, ...series]
        .sort((a, b) => b.id - a.id) // Sortuj od najnowszych
        .slice(0, 6); // Tylko 6 najnowszych
    
    const container = document.getElementById('recentContent');
    container.innerHTML = '';
    
    allContent.forEach(item => {
        const div = document.createElement('div');
        div.className = 'content-item';
        div.innerHTML = `
            <h4>${item.title}</h4>
            <p>${item.type === 'movie' ? '🎬 Film' : '📺 Serial'} • ${item.year}</p>
            <p>⭐ ${item.rating}/10</p>
            <div class="item-actions">
                <button onclick="editItem(${item.id}, '${item.type}')">✏️ Edytuj</button>
                <button onclick="deleteItem(${item.id}, '${item.type}')">🗑️ Usuń</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin-login.html';
}

function showAddForm(type) {
    const modal = document.getElementById('addMovieModal');
    modal.style.display = 'flex';
    
    // Ustaw domyślny typ
    document.getElementById('addType').value = type;
}

function closeModal() {
    document.getElementById('addMovieModal').style.display = 'none';
}

// Funkcje do edycji/usuwania
function editItem(id, type) {
    // Przekieruj do strony edycji
    window.location.href = `admin-edit.html?id=${id}&type=${type}`;
}

function deleteItem(id, type) {
    if (confirm('Czy na pewno chcesz usunąć ten element?')) {
        if (type === 'movie') {
            let movies = JSON.parse(localStorage.getItem('movies')) || [];
            movies = movies.filter(m => m.id !== id);
            localStorage.setItem('movies', JSON.stringify(movies));
        } else {
            let series = JSON.parse(localStorage.getItem('series')) || [];
            series = series.filter(s => s.id !== id);
            localStorage.setItem('series', JSON.stringify(series));
        }
        
        loadRecentContent();
        updateStats();
        alert('Element usunięty!');
    }
}