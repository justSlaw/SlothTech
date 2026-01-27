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

    // Gatunki
    document.getElementById('addGenreBtn').addEventListener('click', () => {
        document.getElementById('addGenreModal').style.display = 'flex';
        loadGenres();
    });

    document.getElementById('saveGenreBtn').addEventListener('click', () => {
        const genre = document.getElementById('genreName').value.trim();
        if (!genre) return alert('Podaj nazwę gatunku');

        fetch('/genres', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ genre })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    alert('Gatunek dodany!');
                    document.getElementById('genreName').value = '';
                    loadGenres();
                } else {
                    alert('Błąd: ' + (data.error || ''));
                }
            });
    });

// Platformy
    document.getElementById('addPlatformBtn').addEventListener('click', () => {
        document.getElementById('addPlatformModal').style.display = 'flex';
        loadPlatforms();
    });

    document.getElementById('savePlatformBtn').addEventListener('click', () => {
        const platform = document.getElementById('platformName').value.trim();
        const type = document.getElementById('platformType').value.trim();
        if (!platform) return alert('Podaj nazwę platformy');

        fetch('/platforms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, type })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    alert('Platforma dodana!');
                    document.getElementById('platformName').value = '';
                    document.getElementById('platformType').value = '';
                    loadPlatforms();
                } else {
                    alert('Błąd: ' + (data.error || ''));
                }
            });
    });

});

function updateStats() {
    fetch('/api/items')
        .then(response => response.json())
        .then(items => {

            const moviesCount = items.filter(item => item.type === 'movie').length;
            const seriesCount = items.filter(item => item.type === 'series').length;

            document.getElementById('moviesCount').textContent = moviesCount;
            document.getElementById('seriesCount').textContent = seriesCount;
            document.getElementById('reviewsCount').textContent = '—';
        })
}

function loadRecentContent() {
    fetch('/api/items')
        .then(response => response.json())
        .then(items => {

            const allContent = items
                .sort((a,b)=>b.id-a.id)

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
        })
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

function closeGenreModal() {
    document.getElementById('addGenreModal').style.display = 'none';
}

function closePlatformModal() {
    document.getElementById('addPlatformModal').style.display = 'none';
}


// Funkcje do edycji/usuwania
function editItem(id, type) {
    // Przekieruj do strony edycji
    window.location.href = `admin-edit.html?id=${id}&type=${type}`;
}

function deleteItem(id, type) {
    if (!confirm('Czy na pewno chcesz usunąć ten element?')) {
        return;
    }
    fetch(`/deleteItem?id=${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {

                // Po usunięciu z bazy – odśwież UI z API
                loadRecentContent();
                updateStats();

                alert('Element został usunięty!');
            } else {
                alert('Nie udało się usunąć elementu');
            }
        })
}

function loadGenres() {
    fetch('/genres')
        .then(r => r.json())
        .then(genres => {
            const container = document.getElementById('genreList');
            container.innerHTML = '';
            genres.forEach(g => {
                const div = document.createElement('div');
                div.textContent = g.genre;
                container.appendChild(div);
            });
        });
}

function loadPlatforms() {
    fetch('/platforms')
        .then(r => r.json())
        .then(platforms => {
            const container = document.getElementById('platformList');
            container.innerHTML = '';
            platforms.forEach(p => {
                const div = document.createElement('div');
                div.textContent = p.platform + (p.type ? ` (${p.type})` : '');
                container.appendChild(div);
            });
        });
}
