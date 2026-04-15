/**
 * Plant Catalog - Load and render plant cards
 */

let plants = [];
let articles = {};
let filteredPlants = [];

// Initialize catalog
async function initCatalog() {
    try {
        // Load plants data
        const response = await fetch('data/plants.json');
        plants = await response.json();
        filteredPlants = [...plants];

        console.log(`Loaded ${plants.length} plants`);

        // Initial render
        renderCatalog();
        populateFilters();

        // Initialize search AFTER data is loaded
        initSearch();
    } catch (error) {
        console.error('Error loading catalog:', error);
        document.getElementById('no-results').classList.remove('hidden');
    }
}

/**
 * Render plant cards in the grid
 */
function renderCatalog(plantsToRender = filteredPlants) {
    const grid = document.getElementById('plants-grid');
    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');

    grid.innerHTML = '';

    if (plantsToRender.length === 0) {
        noResults.classList.remove('hidden');
        resultsCount.textContent = '0';
        return;
    }

    noResults.classList.add('hidden');
    resultsCount.textContent = plantsToRender.length;

    plantsToRender.forEach(plant => {
        const card = createPlantCard(plant);
        grid.appendChild(card);
    });
}

/**
 * Create a plant card element
 */
function createPlantCard(plant) {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.innerHTML = `
        <div class="plant-card-content">
            <div class="plant-name">${escapeHtml(plant.name_ru)}</div>
            <div class="plant-latin">${escapeHtml(plant.name_lat)}</div>

            <div class="plant-meta">
                ${plant.family ? `<div class="plant-meta-item"><span class="plant-meta-label">Семейство:</span> <span>${escapeHtml(plant.family)}</span></div>` : ''}
                ${plant.zone ? `<div class="plant-meta-item"><span class="plant-meta-label">Зона:</span> <span>${escapeHtml(plant.zone)}</span></div>` : ''}
                ${plant.location ? `<div class="plant-meta-item"><span class="plant-meta-label">Место:</span> <span>${escapeHtml(plant.location)}</span></div>` : ''}
            </div>

            <div class="plant-actions">
                ${plant.has_article ? `
                    <button class="btn-small btn-primary" onclick="viewPlantDetails('${plant.article_slug}')">
                        Подробнее
                    </button>
                ` : ''}
                <button class="btn-small btn-secondary" onclick="togglePlantInfo(this, '${plant.id}')">
                    Описание
                </button>
            </div>

            <div class="plant-info hidden mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                ${plant.conditions ? `<p><strong>Условия:</strong> ${escapeHtml(plant.conditions)}</p>` : ''}
                ${plant.notes ? `<p><strong>Заметки:</strong> ${escapeHtml(plant.notes)}</p>` : ''}
                ${plant.habitat ? `<p><strong>Естественный ареал:</strong> ${escapeHtml(plant.habitat)}</p>` : ''}
            </div>
        </div>
    `;

    return card;
}

/**
 * Toggle additional plant information
 */
function togglePlantInfo(button, plantId) {
    const parent = button.closest('.plant-card-content');
    const info = parent.querySelector('.plant-info');

    if (info.classList.contains('hidden')) {
        info.classList.remove('hidden');
        button.textContent = 'Скрыть';
    } else {
        info.classList.add('hidden');
        button.textContent = 'Описание';
    }
}

/**
 * View full article for a plant
 */
async function viewPlantDetails(articleSlug) {
    try {
        // Load article data
        const response = await fetch(`data/articles/${articleSlug}/article.json`);
        const article = await response.json();

        // Create modal
        const modal = createArticleModal(article, articleSlug);
        document.body.appendChild(modal);

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error loading article:', error);
        alert('Не удалось загрузить статью');
    }
}

/**
 * Render paragraph based on type
 */
function renderParagraph(para) {
    if (typeof para === 'string') {
        // Legacy support for old string format
        return `<p style="margin-bottom: 1rem; line-height: 1.6; color: #333;">${escapeHtml(para)}</p>`;
    }

    const text = escapeHtml(para.text || '');
    const type = para.type || 'body';

    switch (type) {
        case 'heading':
            return `<h2 style="margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: bold; color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 0.5rem;">${text}</h2>`;

        case 'latin_name':
            return `<p style="margin-bottom: 0.5rem; font-style: italic; color: #6b7280; font-size: 0.95rem;">${text}</p>`;

        case 'caption':
            return `<p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #9ca3af; font-style: italic; padding: 0.5rem; background-color: #f9fafb; border-left: 2px solid #d1d5db; padding-left: 0.75rem;">${text}</p>`;

        case 'image':
            return `
                <figure style="margin: 1.5rem 0; text-align: center;">
                    <img src="data/articles/${para.articleSlug || ''}/img/${para.src}"
                         alt="${escapeHtml(para.caption)}"
                         style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <figcaption style="margin-top: 0.5rem; font-size: 0.85rem; color: #6b7280; font-style: italic;">${escapeHtml(para.caption)}</figcaption>
                </figure>
            `;

        case 'body':
        default:
            return `<p style="margin-bottom: 1rem; line-height: 1.7; color: #374151;">${text}</p>`;
    }
}

/**
 * Create article detail modal
 */
function createArticleModal(article, articleSlug) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Add articleSlug to image paragraphs for proper URL construction
    const paragraphsWithSlug = article.paragraphs.map(para => {
        if (para.type === 'image') {
            return { ...para, articleSlug };
        }
        return para;
    });

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2>${escapeHtml(article.title)}</h2>
                    <p>${article.paragraphs.length} элементов, ${article.images ? article.images.length : 0} изображений</p>
                </div>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${paragraphsWithSlug.map(para => renderParagraph(para)).join('')}
            </div>
        </div>
    `;

    return modal;
}

/**
 * Populate filter dropdowns
 */
function populateFilters() {
    const zones = new Set();
    const conditions = new Set();

    plants.forEach(plant => {
        if (plant.zone) zones.add(plant.zone);
        if (plant.conditions) conditions.add(plant.conditions.substring(0, 50)); // First 50 chars
    });

    // Populate zone filter
    const zoneFilter = document.getElementById('zone-filter');
    Array.from(zones).sort().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        zoneFilter.appendChild(option);
    });

    // Populate conditions filter
    const conditionsFilter = document.getElementById('conditions-filter');
    Array.from(conditions).sort().forEach(condition => {
        const option = document.createElement('option');
        option.value = condition;
        option.textContent = condition;
        conditionsFilter.appendChild(option);
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCatalog);
