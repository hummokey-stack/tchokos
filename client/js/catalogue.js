import { supabase } from './supabaseClient.js'

// Parse current URL and page context to determine filtering
function getPageContext() {
  const path = window.location.pathname
  if (path.endsWith('chaussures.html')) {
    return { title: 'Collection Chaussures', families: ['revendu', 'chaussure_locale'] }
  } else if (path.endsWith('sacs.html')) {
    return { title: 'Collection Sacs', families: ['sac_local'] }
  } else if (path.endsWith('produits-locaux.html')) {
    return { title: 'Fabrication Locale', families: ['chaussure_locale', 'sac_local'] }
  } else {
    return { title: 'Toute la Boutique', families: null }
  }
}

export async function initCatalogue() {
  const context = getPageContext()
  
  // Set page title in HTML if present
  const titleEl = document.getElementById('catalog-title')
  if (titleEl) titleEl.textContent = context.title

  // Elements
  const searchInput = document.getElementById('search-input')
  const categorySelect = document.getElementById('category-filter')
  const sortSelect = document.getElementById('sort-filter')
  const productsGrid = document.getElementById('products-grid')

  if (!productsGrid) return

  // Load categories into filter dropdown
  await loadCategoriesFilter(categorySelect, context.families)

  // Fetch and render initial products
  let products = await fetchProducts(context.families)
  renderProducts(products, productsGrid)

  // Setup filter listeners
  const applyFilters = () => {
    let filtered = [...products]

    // Search query filter
    if (searchInput && searchInput.value) {
      const q = searchInput.value.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.reference.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (categorySelect && categorySelect.value) {
      filtered = filtered.filter(p => p.category_id === categorySelect.value)
    }

    // Sort filter
    if (sortSelect && sortSelect.value) {
      if (sortSelect.value === 'price-asc') {
        filtered.sort((a, b) => a.price_retail - b.price_retail)
      } else if (sortSelect.value === 'price-desc') {
        filtered.sort((a, b) => b.price_retail - a.price_retail)
      } else if (sortSelect.value === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
    }

    renderProducts(filtered, productsGrid)
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters)
  if (categorySelect) categorySelect.addEventListener('change', applyFilters)
  if (sortSelect) sortSelect.addEventListener('change', applyFilters)
}

async function loadCategoriesFilter(dropdown, families) {
  if (!dropdown) return
  try {
    let query = supabase.from('categories').select('*')
    if (families) {
      query = query.in('family', families)
    }
    const { data: categories, error } = await query
    if (error) throw error

    dropdown.innerHTML = '<option value="">Toutes les catégories</option>' + 
      categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
  } catch (err) {
    console.error('Erreur chargement catégories filtres:', err)
  }
}

async function fetchProducts(families) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories (name)
      `)
      .eq('status', 'published')

    if (families) {
      query = query.in('categories.family', families)
    }

    const { data, error } = await query
    if (error) throw error

    // Post-filter since Supabase joins don't filter parent by child in simple inner joins sometimes
    if (families && data) {
      return data.filter(p => p.categories && families.includes(p.categories.family))
    }

    return data || []
  } catch (err) {
    console.error('Erreur fetch products:', err)
    return []
  }
}

function renderProducts(items, grid) {
  if (items.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px 0; color: var(--text-muted);">Aucun produit trouvé.</p>'
    return
  }

  grid.innerHTML = items.map(product => `
    <div class="double-bezel">
      <div class="double-bezel-inner">
        ${product.is_new ? '<span class="badge-tag">Nouveau</span>' : ''}
        <div class="product-img-wrapper" style="border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px;">
          <img class="product-img" src="${product.main_image_url || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60'}" alt="${product.name}">
        </div>
        <div class="product-content" style="padding: 0;">
          <span class="product-category">${product.categories?.name || 'Général'}</span>
          <h3 class="product-title" style="margin-bottom: 8px; font-size: 1.35rem; font-weight: 300;">${product.name}</h3>
          <div class="product-price-row" style="margin-bottom: 16px;">
            <span class="price">${Number(product.price_retail).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <a href="/client/produit.html?slug=${product.slug}" class="btn-pill btn-pill-primary" style="margin-top: auto; justify-content: space-between; width: 100%;">
            Voir le produit
            <span class="btn-icon-wrapper">↗</span>
          </a>
        </div>
      </div>
    </div>
  `).join('')
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalogue()
})
