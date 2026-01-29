document.addEventListener('DOMContentLoaded', () => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!adminLoggedIn) {
        window.location.href = 'admin-login.html';
        return;
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'admin-login.html';
    });

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id') || 0);

    const statusMsg = document.getElementById('statusMsg');
    const saveBtn = document.getElementById('saveBtn');

    if (!id) {
        statusMsg.textContent = 'Brak id w URL.';
        saveBtn.disabled = true;
        return;
    }

    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    let item = null;
    let allGenres = [];
    let allPlatforms = [];

    Promise.all([
        fetch(`/api/items?id=${encodeURIComponent(id)}`).then(r => r.json()),
        fetch('/genres').then(r => r.json()),
        fetch('/platforms').then(r => r.json()),
    ])
        .then(([itemResp, genresResp, platformsResp]) => {
            if (itemResp && itemResp.success === false) {
                throw new Error(itemResp.error || 'Nie znaleziono elementu');
            }

            item = itemResp;
            allGenres = Array.isArray(genresResp) ? genresResp : [];
            allPlatforms = Array.isArray(platformsResp) ? platformsResp : [];

            renderHeader(item);
            renderGenres(item, allGenres);
            renderPlatforms(item, allPlatforms);

            wireSearch('genreSearch', 'genresContainer');
            wireSearch('platformSearch', 'platformsContainer');
        })
        .catch(err => {
            statusMsg.textContent = `Błąd: ${err.message}`;
            saveBtn.disabled = true;
        });

    saveBtn.addEventListener('click', () => {
        if (!item) return;

        const selectedGenres = collectCheckedValues('genresContainer', 'genre');
        const selectedPlatforms = collectCheckedPlatforms('platformsContainer');
        const newDescription = document.getElementById('descriptionInput').value.trim();

        statusMsg.textContent = 'Zapisywanie…';
        saveBtn.disabled = true;

        fetch(`/api/items?id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                genres: selectedGenres,
                platforms: selectedPlatforms,
		description: newDescription
            })
        })
            .then(r => r.json())
            .then(data => {
                if (data && data.success) {
                    statusMsg.textContent = 'Zapisano zmiany.';
                    setTimeout(() => window.location.href = 'admin.html', 600);
                } else {
                    statusMsg.textContent = 'Błąd: ' + ((data && data.error) || 'nie udało się zapisać');
                    saveBtn.disabled = false;
                }
            })
            .catch(err => {
                statusMsg.textContent = `Błąd: ${err.message}`;
                saveBtn.disabled = false;
            });
    });
});

function renderHeader(item) {
    const title = item && item.title ? item.title : '(bez tytułu)';
    document.getElementById('itemTitle').textContent = title;

    const metaParts = [];
    if (item.type) metaParts.push(item.type === 'movie' ? '🎬 Film' : (item.type === 'series' ? '📺 Serial' : item.type));
    if (item.year) metaParts.push(String(item.year));
    if (item.original_title) metaParts.push(item.original_title);

    document.getElementById('itemMeta').textContent = metaParts.join(' • ');

    const descInput = document.getElementById('descriptionInput');
    if (descInput && item.description) {
        descInput.value = item.description;
    }
}

function normalizeItemGenres(item) {
    if (!item) return [];
    if (Array.isArray(item.genres)) return item.genres.filter(g => typeof g === 'string');
    return [];
}

function normalizeItemPlatforms(item) {
    const out = new Set();
    const raw = item && item.platforms;
    if (!Array.isArray(raw)) return out;

    raw.forEach(p => {
        if (typeof p === 'string') {
            const name = p.trim();
            if (!name) return;
            out.add(platformKey(name, ''));
            return;
        }
        if (p && typeof p === 'object') {
            const name = (p.name || p.platform || '').toString().trim();
            const type = (p.type || '').toString().trim();
            if (!name) return;
            out.add(platformKey(name, type));
        }
    });

    return out;
}

function renderGenres(item, allGenres) {
    const selected = new Set(normalizeItemGenres(item));
    const container = document.getElementById('genresContainer');
    container.innerHTML = '';

    allGenres
        .map(g => (g && g.genre ? g.genre : ''))
        .filter(Boolean)
        .forEach(genre => {
            const label = document.createElement('label');
            label.className = 'edit-check';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.kind = 'genre';
            input.value = genre;
            input.checked = selected.has(genre);

            const span = document.createElement('span');
            span.textContent = genre;

            label.appendChild(input);
            label.appendChild(span);
            container.appendChild(label);
        });
}

function renderPlatforms(item, allPlatforms) {
    const selectedKeys = normalizeItemPlatforms(item);
    const container = document.getElementById('platformsContainer');
    container.innerHTML = '';

    allPlatforms.forEach(p => {
        const name = (p && p.platform ? p.platform : '').toString().trim();
        const type = (p && p.type ? p.type : '').toString().trim();
        if (!name) return;

        const key = platformKey(name, type);

        const label = document.createElement('label');
        label.className = 'edit-check';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.kind = 'platform';
        input.dataset.name = name;
        input.dataset.type = type;
        input.value = key;
        input.checked = selectedKeys.has(key);

        const span = document.createElement('span');
        span.textContent = type ? `${name} (${type})` : name;

        label.appendChild(input);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function wireSearch(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);

    const apply = () => {
        const q = (input.value || '').toLowerCase().trim();
        [...container.querySelectorAll('label')].forEach(label => {
            const text = (label.textContent || '').toLowerCase();
            label.style.display = q === '' || text.includes(q) ? '' : 'none';
        });
    };

    input.addEventListener('input', apply);
}

function collectCheckedValues(containerId, kind) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll(`input[type="checkbox"][data-kind="${kind}"]`);

    const out = [];
    inputs.forEach(i => {
        if (i.checked) out.push(i.value);
    });

    return out;
}

function collectCheckedPlatforms(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('input[type="checkbox"][data-kind="platform"]');

    const out = [];
    inputs.forEach(i => {
        if (!i.checked) return;
        const name = (i.dataset.name || '').trim();
        const type = (i.dataset.type || '').trim();
        if (!name) return;
        out.push({ name, type });
    });

    return out;
}

function platformKey(name, type) {
    return `${name}||${type || ''}`;
}
