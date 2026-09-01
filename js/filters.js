// Système de filtres avancés pour le catalogue

class CatalogFilters {
  constructor() {
    this.activeFilters = {
      category: null,
      type: null,
      priceMin: 0,
      priceMax: 50000,
      searchTerm: ''
    };
    this.init();
  }

  init() {
    this.setupFilterUI();
    this.attachEventListeners();
  }

  setupFilterUI() {
    const filterHTML = `
      <div class="filters-panel" id="filters-panel">
        <div class="filters-header">
          <h3>🔍 Affiner votre recherche</h3>
          <button class="filters-close" id="filters-close" aria-label="Fermer les filtres">✕</button>
        </div>

        <div class="filter-group">
          <label class="filter-label">📁 Catégorie</label>
          <select id="filter-category" class="filter-select">
            <option value="">Tous les types</option>
            <option value="cours_pdf">Cours PDF</option>
            <option value="td_pdf">TD/TP PDF</option>
            <option value="normes">Normes DTR</option>
            <option value="ouvrage">Ouvrages numériques</option>
            <option value="logiciels">Logiciels</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">📚 Type de ressource</label>
          <select id="filter-type" class="filter-select">
            <option value="">Tous les types</option>
            <option value="cours_pdf">Cours</option>
            <option value="exercices">Exercices</option>
            <option value="sujet">Sujets d'examen</option>
            <option value="tuto_pdf">Tutoriels</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">💰 Gamme de prix</label>
          <div class="price-range">
            <input type="range" id="filter-price-min" min="0" max="50000" value="0" class="filter-range">
            <input type="range" id="filter-price-max" min="0" max="50000" value="50000" class="filter-range">
          </div>
          <div class="price-display">
            <span id="price-min-display">0</span> DA —
            <span id="price-max-display">50000</span> DA
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">⭐ Note minimale</label>
          <div class="filter-rating">
            <input type="radio" id="rating-all" name="rating" value="0" checked>
            <label for="rating-all">Tous</label>

            <input type="radio" id="rating-3" name="rating" value="3">
            <label for="rating-3">3★ et plus</label>

            <input type="radio" id="rating-4" name="rating" value="4">
            <label for="rating-4">4★ et plus</label>

            <input type="radio" id="rating-5" name="rating" value="5">
            <label for="rating-5">5★ uniquement</label>
          </div>
        </div>

        <button id="filter-apply" class="filter-btn-apply">Appliquer les filtres</button>
        <button id="filter-reset" class="filter-btn-reset">Réinitialiser</button>
      </div>

      <style>
        .filters-panel {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid #e0e4e8;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .filters-header h3 {
          margin: 0;
          color: #1B3A6B;
          font-size: 16px;
          font-weight: 700;
        }

        .filters-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          display: none;
        }

        .filter-group {
          margin-bottom: 20px;
        }

        .filter-label {
          display: block;
          font-weight: 600;
          color: #1B3A6B;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .filter-select {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          font-family: Cairo, sans-serif;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .filter-select:hover, .filter-select:focus {
          border-color: #1B3A6B;
          outline: none;
        }

        .price-range {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
        }

        .filter-range {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #d1d5db;
          outline: none;
          -webkit-appearance: none;
        }

        .filter-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1B3A6B;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .filter-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1B3A6B;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .price-display {
          text-align: center;
          font-size: 13px;
          color: #666;
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .filter-rating {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-rating label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 400;
          color: #374151;
        }

        .filter-rating input[type="radio"] {
          cursor: pointer;
        }

        .filter-btn-apply, .filter-btn-reset {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: Cairo, sans-serif;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .filter-btn-apply {
          background: linear-gradient(135deg, #1B3A6B, #2563a8);
          color: white;
        }

        .filter-btn-apply:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27, 58, 107, 0.3);
        }

        .filter-btn-reset {
          background: #f0f0f0;
          color: #1B3A6B;
          border: 1.5px solid #d1d5db;
        }

        .filter-btn-reset:hover {
          background: #e0e4e8;
        }

        @media (max-width: 768px) {
          .filters-panel {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 999;
            border-radius: 0;
            max-height: 100vh;
            overflow-y: auto;
            margin: 0;
          }

          .filters-panel.show {
            display: block;
          }

          .filters-close {
            display: block;
          }
        }
      </style>
    `;

    const container = document.querySelector('#products-grid, .products-container, main');
    if (container) {
      const filterDiv = document.createElement('div');
      filterDiv.innerHTML = filterHTML;
      container.insertBefore(filterDiv.firstElementChild, container.firstChild);
    }
  }

  attachEventListeners() {
    const categorySelect = document.getElementById('filter-category');
    const typeSelect = document.getElementById('filter-type');
    const priceMin = document.getElementById('filter-price-min');
    const priceMax = document.getElementById('filter-price-max');
    const priceMinDisplay = document.getElementById('price-min-display');
    const priceMaxDisplay = document.getElementById('price-max-display');
    const applyBtn = document.getElementById('filter-apply');
    const resetBtn = document.getElementById('filter-reset');
    const closeBtn = document.getElementById('filters-close');

    if (priceMin && priceMax) {
      priceMin.addEventListener('input', () => {
        if (parseInt(priceMin.value) > parseInt(priceMax.value)) {
          priceMin.value = priceMax.value;
        }
        priceMinDisplay.textContent = parseInt(priceMin.value).toLocaleString('fr-DZ');
      });

      priceMax.addEventListener('input', () => {
        if (parseInt(priceMax.value) < parseInt(priceMin.value)) {
          priceMax.value = priceMin.value;
        }
        priceMaxDisplay.textContent = parseInt(priceMax.value).toLocaleString('fr-DZ');
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyFilters());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('filters-panel').classList.remove('show');
      });
    }
  }

  applyFilters() {
    this.activeFilters.category = document.getElementById('filter-category')?.value || null;
    this.activeFilters.type = document.getElementById('filter-type')?.value || null;
    this.activeFilters.priceMin = parseInt(document.getElementById('filter-price-min')?.value || 0);
    this.activeFilters.priceMax = parseInt(document.getElementById('filter-price-max')?.value || 50000);

    console.log('Filtres appliqués:', this.activeFilters);
    this.filterProducts();
  }

  filterProducts() {
    const cards = document.querySelectorAll('[data-product-id]');
    let visibleCount = 0;

    cards.forEach(card => {
      let shouldShow = true;

      // Filtre catégorie
      if (this.activeFilters.category) {
        const category = card.dataset.productCategory;
        if (category !== this.activeFilters.category) shouldShow = false;
      }

      // Filtre type
      if (this.activeFilters.type && shouldShow) {
        const type = card.dataset.productType;
        if (type !== this.activeFilters.type) shouldShow = false;
      }

      // Filtre prix
      if (shouldShow) {
        const price = parseFloat(card.dataset.productPrice || 0);
        if (price < this.activeFilters.priceMin || price > this.activeFilters.priceMax) {
          shouldShow = false;
        }
      }

      card.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Afficher message si aucun résultat
    if (visibleCount === 0) {
      const container = document.querySelector('#products-grid, .products-container');
      if (container && !document.getElementById('no-results-message')) {
        const msg = document.createElement('div');
        msg.id = 'no-results-message';
        msg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #666;';
        msg.innerHTML = '😕 Aucun produit ne correspond à vos filtres. Essayez d\'autres critères.';
        container.appendChild(msg);
      }
    } else {
      const msg = document.getElementById('no-results-message');
      if (msg) msg.remove();
    }
  }

  resetFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-price-min').value = 0;
    document.getElementById('filter-price-max').value = 50000;
    document.getElementById('price-min-display').textContent = '0';
    document.getElementById('price-max-display').textContent = '50000';

    this.activeFilters = {
      category: null,
      type: null,
      priceMin: 0,
      priceMax: 50000,
      searchTerm: ''
    };

    document.querySelectorAll('[data-product-id]').forEach(card => {
      card.style.display = '';
    });

    const msg = document.getElementById('no-results-message');
    if (msg) msg.remove();
  }
}

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CatalogFilters();
  });
} else {
  new CatalogFilters();
}
