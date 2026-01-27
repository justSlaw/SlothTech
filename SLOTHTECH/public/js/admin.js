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
    // document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });


    
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

// function showAddForm(type) {
//     const modal = document.getElementById('addMovieModal');
//     modal.style.display = 'flex';
    
//     // Ustaw domyślny typ
//     document.getElementById('addType').value = type;
// }
function showAddForm(type) {
    let modal;
    if (type === 'movie') {
        modal = document.getElementById('addMovieModal');
    } else if (type === 'series') {
        modal = document.getElementById('addSeriesModal');
    } else return;

    modal.style.display = 'flex';
}


// function closeModal() {
//     // Ukrywamy oba modale
//     const modals = [document.getElementById('addMovieModal'), document.getElementById('addSeriesModal')];
//     modals.forEach(modal => { if(modal) modal.style.display = 'none'; });
// }
function closeModal() {
    const modals = [document.getElementById('addMovieModal'), document.getElementById('addSeriesModal')];
    modals.forEach(modal => { if(modal) modal.style.display = 'none'; });
}



// function closeModal() {
//     document.getElementById('addMovieModal').style.display = 'none';
// }

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
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '8px 0';

                const label = document.createElement('span');
                label.textContent = g.genre;

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '8px';

                const editBtn = document.createElement('button');
                editBtn.textContent = '✏️';
                editBtn.title = 'Edytuj';
                editBtn.addEventListener('click', () => editGenre(g.id, g.genre));

                const delBtn = document.createElement('button');
                delBtn.textContent = '🗑️';
                delBtn.title = 'Usuń';
                delBtn.addEventListener('click', () => deleteGenre(g.id, g.genre));

                actions.appendChild(editBtn);
                actions.appendChild(delBtn);

                row.appendChild(label);
                row.appendChild(actions);
                container.appendChild(row);
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
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '8px 0';

                const label = document.createElement('span');
                label.textContent = p.platform + (p.type ? ` (${p.type})` : '');

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '8px';

                const editBtn = document.createElement('button');
                editBtn.textContent = '✏️';
                editBtn.title = 'Edytuj';
                editBtn.addEventListener('click', () => editPlatform(p.id, p.platform, p.type || ''));

                const delBtn = document.createElement('button');
                delBtn.textContent = '🗑️';
                delBtn.title = 'Usuń';
                delBtn.addEventListener('click', () => deletePlatform(p.id, p.platform, p.type || ''));

                actions.appendChild(editBtn);
                actions.appendChild(delBtn);

                row.appendChild(label);
                row.appendChild(actions);
                container.appendChild(row);
            });
        });
}

function editGenre(id, currentName) {
    const next = prompt('Nowa nazwa gatunku:', currentName);
    if (next === null) return;
    const genre = next.trim();
    if (!genre) return alert('Podaj nazwę gatunku');

    fetch(`/genres?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                loadGenres();
                alert('Zapisano zmiany');
            } else {
                alert('Błąd: ' + (data.error || ''));
            }
        });
}

function deleteGenre(id, name) {
    if (!confirm(`Usunąć gatunek "${name}"?\nZostanie też usunięty z filmów/seriali.`)) return;

    fetch(`/genres?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                loadGenres();
                alert('Usunięto gatunek');
            } else {
                alert('Błąd: ' + (data.error || ''));
            }
        });
}

function editPlatform(id, currentName, currentType) {
    const nextNameRaw = prompt('Nowa nazwa platformy:', currentName);
    if (nextNameRaw === null) return;
    const platform = nextNameRaw.trim();
    if (!platform) return alert('Podaj nazwę platformy');

    const nextTypeRaw = prompt('Nowy typ abonamentu (może być pusty):', currentType || '');
    if (nextTypeRaw === null) return;
    const type = nextTypeRaw.trim();

    fetch(`/platforms?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, type })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                loadPlatforms();
                alert('Zapisano zmiany');
            } else {
                alert('Błąd: ' + (data.error || ''));
            }
        });
}

function deletePlatform(id, name, type) {
    const label = type ? `${name} (${type})` : name;
    if (!confirm(`Usunąć platformę "${label}"?\nZostanie też usunięta z filmów/seriali.`)) return;

    fetch(`/platforms?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                loadPlatforms();
                alert('Usunięto platformę');
            } else {
                alert('Błąd: ' + (data.error || ''));
            }
        });
}

const addItemForm = document.getElementById('addItemForm');

if (addItemForm) {
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = document.getElementById('addType').value;
        const title = document.getElementById('title').value.trim();
        const year = parseInt(document.getElementById('year').value);
        const rating = parseFloat(document.getElementById('rating').value) || 0;
        const genres = document.getElementById('genres').value.split(',').map(g => g.trim()).filter(g => g);
        const director = document.getElementById('director').value.trim();
        const cast = document.getElementById('cast').value.split(',').map(c => c.trim()).filter(c => c);
        const platformsRaw = document.getElementById('platforms').value.split(',').map(p => p.trim()).filter(p => p);
        const movieDuration = addItemForm.querySelector('#movieDuration').value.trim();
        const poster = document.getElementById('moviePoster').value.trim();


        const platforms = platformsRaw.map(p => {
            const [name, type = ''] = p.split('|').map(x => x.trim());
            return { name, type };
        });

        const payload = { 
            type, title, year, rating, genres, cast, platforms, director, duration: movieDuration, poster
        };
        fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        .then(r => r.json())
        .then(data => {
            if (data.success) {
                alert('Dodano nowy element!');
                addItemForm.reset();
                closeModal();
                updateStats();
                loadRecentContent();
            } else {
                alert('Błąd: ' + (data.error || 'Nieznany błąd'));
            }
        })
        .catch(err => alert('Błąd sieci: ' + err));
    });
}
const addSeriesForm = document.getElementById('addSeriesForm');

if (addSeriesForm) {
    addSeriesForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Pobieramy pola z formularza serialu
        const type = 'series';
        const title = addSeriesForm.querySelector('#seriestitle').value.trim();
        const year = parseInt(addSeriesForm.querySelector('#seriesyear').value);
        const rating = parseFloat(addSeriesForm.querySelector('#seriesrating').value) || 0;
        const genres = addSeriesForm.querySelector('#seriesgenres').value.split(',').map(g => g.trim()).filter(g => g);
        const director = addSeriesForm.querySelector('#seriesdirector').value.trim();
        const cast = addSeriesForm.querySelector('#seriescast').value.split(',').map(c => c.trim()).filter(c => c);
        const platformsRaw = addSeriesForm.querySelector('#seriesplatforms').value.split(',').map(p => p.trim()).filter(p => p);
        const duration = addSeriesForm.querySelector('#seriesDuration').value.trim();
        const poster = document.getElementById('seriesPoster').value.trim();

        const platforms = platformsRaw.map(p => {
            const [name, type = ''] = p.split('|').map(x => x.trim());
            return { name, type };
        });
        const payload = { type, title, year, rating, genres, cast, platforms, director, duration, poster };

        fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                alert('Dodano nowy serial!');
                addSeriesForm.reset();
                closeModal();
                updateStats();
                loadRecentContent();
            } else {
                alert('Błąd: ' + (data.error || 'Nieznany błąd'));
            }
        })
        .catch(err => alert('Błąd sieci: ' + err));
    });
}

