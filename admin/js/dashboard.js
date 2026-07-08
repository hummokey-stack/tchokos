import { supabase } from '/client/js/supabaseClient.js'
import { checkAuth, setupLogout } from './auth.js'

let currentAdmin = null
let currentAdminProfile = null

// Initialization
async function initDashboard() {
  const session = await checkAuth()
  if (!session) return

  currentAdmin = session.user
  currentAdminProfile = session.profile

  // Display user info
  document.getElementById('admin-name').textContent = currentAdminProfile.name
  document.getElementById('admin-role').textContent = translateRole(currentAdminProfile.role)

  setupLogout()
  setupTabNavigation()
  
  // Load initial data
  await loadOverviewStats()
  await loadOrders()
  await loadProducts()
  await loadStock()

  // Setup modals & form submission listeners
  setupProductModal()
  setupStockModal()
  setupVariantModal()
  setupPromoModal()

  // Super Admin Specific features
  if (currentAdminProfile.role === 'super_admin') {
    const item = document.getElementById('menu-admins-item')
    if (item) item.style.display = 'block'
    await loadAdmins()
    setupAdminModal()
  }

  // Toggling Sub-tabs
  setupSubTabs()
}

function translateRole(role) {
  const roles = {
    super_admin: 'Super Admin',
    admin_produit: 'Admin Produits',
    admin_commandes: 'Admin Commandes',
    admin_stock: 'Admin Stocks',
    moderateur: 'Modérateur'
  }
  return roles[role] || role
}

// ---------------- TAB NAVIGATION ----------------
function setupTabNavigation() {
  const menuLinks = document.querySelectorAll('.admin-menu-link')
  const tabs = document.querySelectorAll('.tab-content')

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const targetTab = link.dataset.tab

      menuLinks.forEach(l => l.classList.remove('active'))
      link.classList.add('active')

      tabs.forEach(tab => {
        tab.classList.remove('active')
        if (tab.id === `tab-${targetTab}`) {
          tab.classList.add('active')
        }
      })

      // Load specific tab data if needed
      if (targetTab === 'sync') {
        loadSyncQueue()
      } else if (targetTab === 'admins' && currentAdminProfile.role === 'super_admin') {
        loadAdmins()
      }
    })
  })
}

// Setup sub-tabs toggling (products vs promos, stock states vs movements)
function setupSubTabs() {
  // Stock sub-tabs
  const btnList = document.getElementById('btn-show-stock-list')
  const btnMoves = document.getElementById('btn-show-stock-moves')
  const containerList = document.getElementById('stock-list-container')
  const containerMoves = document.getElementById('stock-moves-container')

  if (btnList && btnMoves) {
    btnList.addEventListener('click', () => {
      btnList.classList.add('active')
      btnMoves.classList.remove('active')
      containerList.style.display = 'block'
      containerMoves.style.display = 'none'
    })

    btnMoves.addEventListener('click', async () => {
      btnMoves.classList.add('active')
      btnList.classList.remove('active')
      containerList.style.display = 'none'
      containerMoves.style.display = 'block'
      await loadStockMovements()
    })
  }

  // Product sub-tabs
  const btnProd = document.getElementById('btn-show-products-list')
  const btnPromo = document.getElementById('btn-show-promotions-list')
  const containerProd = document.getElementById('products-list-container')
  const containerPromo = document.getElementById('promotions-list-container')

  if (btnProd && btnPromo) {
    btnProd.addEventListener('click', () => {
      btnProd.classList.add('active')
      btnPromo.classList.remove('active')
      containerProd.style.display = 'block'
      containerPromo.style.display = 'none'
    })

    btnPromo.addEventListener('click', async () => {
      btnPromo.classList.add('active')
      btnProd.classList.remove('active')
      containerProd.style.display = 'none'
      containerPromo.style.display = 'block'
      await loadPromotions()
    })
  }
}

// ---------------- DATA LOADING ----------------

async function loadOverviewStats() {
  try {
    // 1. Fetch Orders
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('total, status')

    if (ordersErr) throw ordersErr

    let totalSales = 0
    let orderCount = orders ? orders.length : 0

    if (orders) {
      orders.forEach(o => {
        if (o.status !== 'cancelled') {
          totalSales += Number(o.total)
        }
      })
    }

    document.getElementById('stats-sales').textContent = `${totalSales.toLocaleString('fr-FR')} FCFA`
    document.getElementById('stats-orders').textContent = orderCount

    // 2. Fetch Low Stock Alert (Qty <= 5)
    const { count: lowStockCount, error: stockErr } = await supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .lte('stock_qty', 5)

    if (stockErr) throw stockErr
    document.getElementById('stats-low-stock').textContent = lowStockCount || 0

  } catch (err) {
    console.error('Erreur chargement stats overview:', err)
  }
}

async function loadOrders() {
  const recentTable = document.getElementById('recent-orders-table')
  const allTable = document.getElementById('all-orders-table')

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!orders || orders.length === 0) {
      const emptyRow = `<tr><td colspan="9" style="text-align: center; color: var(--admin-text-light);">Aucune commande enregistrée.</td></tr>`
      recentTable.innerHTML = emptyRow
      allTable.innerHTML = emptyRow
      return
    }

    // Populate Recent (limit to 5)
    recentTable.innerHTML = orders.slice(0, 5).map(o => `
      <tr>
        <td><strong>${o.order_number}</strong></td>
        <td>${o.customer_name}</td>
        <td><span style="text-transform: capitalize;">${o.order_type}</span></td>
        <td><strong>${Number(o.total).toLocaleString('fr-FR')} FCFA</strong></td>
        <td><span class="admin-badge badge-${o.status}">${translateStatus(o.status)}</span></td>
        <td><span class="admin-badge badge-${o.payment_status === 'paid' ? 'delivered' : 'cancelled'}">${translatePayment(o.payment_status)}</span></td>
        <td>${new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
      </tr>
    `).join('')

    // Populate All Orders Management Table
    allTable.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.order_number}</strong></td>
        <td>${o.customer_name}</td>
        <td>${o.customer_phone}</td>
        <td><span style="text-transform: capitalize;">${o.order_type}</span></td>
        <td>${o.fulfillment === 'livraison' ? 'Livraison' : 'Magasin'}</td>
        <td><strong>${Number(o.total).toLocaleString('fr-FR')} FCFA</strong></td>
        <td>
          <select class="form-input update-order-status" data-id="${o.id}" style="padding: 6px 12px; width: auto; font-size: 0.85rem;">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>En attente</option>
            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmée</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Livrée</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
          </select>
        </td>
        <td>
          <select class="form-input update-order-payment" data-id="${o.id}" style="padding: 6px 12px; width: auto; font-size: 0.85rem;">
            <option value="unpaid" ${o.payment_status === 'unpaid' ? 'selected' : ''}>Impayée</option>
            <option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>Payée</option>
            <option value="refunded" ${o.payment_status === 'refunded' ? 'selected' : ''}>Remboursée</option>
          </select>
        </td>
        <td>
          <button class="admin-btn admin-btn-secondary view-items-btn" data-id="${o.id}" style="padding: 6px 12px; font-size: 0.8rem;">
            Détails
          </button>
        </td>
      </tr>
    `).join('')

    setupOrderChangeListeners()

  } catch (err) {
    console.error('Erreur chargement commandes:', err)
  }
}

function translateStatus(status) {
  const mapping = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  }
  return mapping[status] || status
}

function translatePayment(status) {
  const mapping = {
    unpaid: 'Impayée',
    paid: 'Payée',
    refunded: 'Remboursée'
  }
  return mapping[status] || status
}

function setupOrderChangeListeners() {
  document.querySelectorAll('.update-order-status').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.id
      const newStatus = e.target.value
      
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId)

        if (error) throw error
        await loadOverviewStats()
        await loadOrders()
      } catch (err) {
        alert(`Erreur lors du changement de statut: ${err.message}`)
      }
    })
  })

  document.querySelectorAll('.update-order-payment').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.id
      const newPayment = e.target.value

      try {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: newPayment })
          .eq('id', orderId)

        if (error) throw error
        await loadOverviewStats()
        await loadOrders()
      } catch (err) {
        alert(`Erreur lors du changement de paiement: ${err.message}`)
      }
    })
  })

  document.querySelectorAll('.view-items-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.id
      try {
        const { data: items, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)

        if (error) throw error

        const list = items.map(i => `• ${i.product_name} (SKU: ${i.sku}) - Qty: ${i.quantity} @ ${Number(i.unit_price).toLocaleString('fr-FR')} FCFA`).join('\n')
        alert(`Articles de la commande :\n\n${list}`)
      } catch (err) {
        alert(`Impossible de récupérer les détails : ${err.message}`)
      }
    })
  })
}

async function loadProducts() {
  const table = document.getElementById('all-products-table')
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name, family)')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!products || products.length === 0) {
      table.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--admin-text-light);">Aucun produit en catalogue.</td></tr>`
      return
    }

    table.innerHTML = products.map(p => `
      <tr>
        <td><strong>${p.reference}</strong></td>
        <td>${p.name}</td>
        <td>${p.categories?.name || 'Général'}</td>
        <td><span style="text-transform: capitalize; font-size: 0.85rem;">${p.categories?.family || '---'}</span></td>
        <td>${Number(p.price_retail).toLocaleString('fr-FR')} FCFA</td>
        <td>${Number(p.price_wholesale).toLocaleString('fr-FR')} FCFA</td>
        <td><span class="admin-badge badge-${p.status === 'published' ? 'delivered' : 'cancelled'}">${p.status === 'published' ? 'Publié' : 'Brouillon'}</span></td>
        <td>
          <button class="admin-btn admin-btn-secondary delete-product-btn" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem; color: var(--admin-danger); border-color: #fca5a5;">
            Supprimer
          </button>
        </td>
      </tr>
    `).join('')

    // Setup delete listeners
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Voulez-vous vraiment supprimer ce produit et toutes ses variantes de stock ?')) {
          try {
            const { error } = await supabase.from('products').delete().eq('id', btn.dataset.id)
            if (error) throw error
            await loadOverviewStats()
            await loadProducts()
            await loadStock()
          } catch (err) {
            alert(`Erreur suppression: ${err.message}`)
          }
        }
      })
    })

  } catch (err) {
    console.error('Erreur chargement produits:', err)
  }
}

async function loadStock() {
  const table = document.getElementById('all-stock-table')
  try {
    const { data: stocks, error } = await supabase
      .from('product_variants')
      .select('*, products(name)')
      .order('sku', { ascending: true })

    if (error) throw error

    if (!stocks || stocks.length === 0) {
      table.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-light);">Aucune variante de stock enregistrée.</td></tr>`
      return
    }

    table.innerHTML = stocks.map(s => `
      <tr>
        <td><strong>${s.sku}</strong></td>
        <td>${s.products?.name || '---'}</td>
        <td>${s.size || 'Unique'}</td>
        <td>${s.color || 'Unique'}</td>
        <td>
          <strong style="color: ${s.stock_qty <= 5 ? 'var(--admin-danger)' : 'inherit'}">${s.stock_qty}</strong>
        </td>
        <td>
          <button class="admin-btn admin-btn-secondary adjust-stock-btn" 
                  data-id="${s.id}" 
                  data-sku="${s.sku}" 
                  data-qty="${s.stock_qty}" 
                  style="padding: 6px 12px; font-size: 0.8rem;">
            Ajuster
          </button>
        </td>
      </tr>
    `).join('')

    setupStockAdjustListeners()

  } catch (err) {
    console.error('Erreur chargement stocks:', err)
  }
}

// ---------------- PRODUCT MODAL ----------------
function setupProductModal() {
  const modal = document.getElementById('product-modal')
  const openBtn = document.getElementById('open-product-modal-btn')
  const closeBtn = document.getElementById('close-product-modal')
  const cancelBtn = document.getElementById('cancel-product-btn')
  const form = document.getElementById('product-form')
  const catSelect = document.getElementById('prod-category')

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      // Load categories
      try {
        const { data: categories } = await supabase.from('categories').select('*')
        catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name} (${c.family})</option>`).join('')
      } catch (err) {
        console.error(err)
      }
      modal.classList.add('active')
    })
  }

  const closeModal = () => {
    modal.classList.remove('active')
    form.reset()
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal)
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      const pData = {
        reference: document.getElementById('prod-reference').value,
        name: document.getElementById('prod-name').value,
        slug: document.getElementById('prod-slug').value,
        category_id: catSelect.value,
        description: document.getElementById('prod-description').value,
        price_retail: parseFloat(document.getElementById('prod-price-retail').value),
        price_wholesale: parseFloat(document.getElementById('prod-price-wholesale').value),
        main_image_url: document.getElementById('prod-image').value || null,
        status: document.getElementById('prod-status').value,
        is_new: document.getElementById('prod-is-new').checked,
        is_featured: document.getElementById('prod-is-featured').checked
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .insert([pData])
          .select()
          .single()

        if (error) throw error

        // Auto create a default variant for stock tracking
        const { error: varError } = await supabase
          .from('product_variants')
          .insert([{
            product_id: data.id,
            sku: `SKU-${pData.reference}-TU-GEN`,
            size: 'TU',
            color: 'Général',
            stock_qty: 0
          }])

        if (varError) throw varError

        closeModal()
        await loadOverviewStats()
        await loadProducts()
        await loadStock()
      } catch (err) {
        alert(`Erreur lors de l'enregistrement du produit: ${err.message}`)
      }
    })
  }
}

// ---------------- STOCK ADJUST MODAL ----------------
function setupStockAdjustListeners() {
  const modal = document.getElementById('stock-modal')
  const variantIdInput = document.getElementById('stock-variant-id')
  const skuSpan = document.getElementById('stock-variant-sku')
  const currentQtySpan = document.getElementById('stock-current-qty')

  document.querySelectorAll('.adjust-stock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      variantIdInput.value = btn.dataset.id
      skuSpan.textContent = btn.dataset.sku
      currentQtySpan.textContent = btn.dataset.qty
      modal.classList.add('active')
    })
  })
}

function setupStockModal() {
  const modal = document.getElementById('stock-modal')
  const closeBtn = document.getElementById('close-stock-modal')
  const cancelBtn = document.getElementById('cancel-stock-btn')
  const form = document.getElementById('stock-form')

  const closeModal = () => {
    modal.classList.remove('active')
    form.reset()
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal)
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      const variantId = document.getElementById('stock-variant-id').value
      const adjustQty = parseInt(document.getElementById('stock-adjust-qty').value)
      const reason = document.getElementById('stock-adjust-reason').value
      const currentQty = parseInt(document.getElementById('stock-current-qty').textContent)

      const targetQty = currentQty + adjustQty

      if (targetQty < 0) {
        alert('Erreur : Le stock restant ne peut pas être inférieur à 0.')
        return
      }

      try {
        // 1. Update Variant Stock Quantity
        const { error: updateErr } = await supabase
          .from('product_variants')
          .update({ stock_qty: targetQty })
          .eq('id', variantId)

        if (updateErr) throw updateErr

        // 2. Insert Stock Movement History Row
        const { error: moveErr } = await supabase
          .from('stock_movements')
          .insert([{
            variant_id: variantId,
            movement_type: adjustQty > 0 ? 'in' : 'out',
            quantity: adjustQty,
            reason: reason
          }])

        if (moveErr) throw moveErr

        // 3. Queue event for Stock Adjustment (Outbox Pattern)
        await supabase.from('external_sync_queue').insert([{
          event_type: 'stock_adjusted',
          payload: {
            variant_id: variantId,
            adjustment: adjustQty,
            new_stock: targetQty,
            reason: reason
          }
        }])

        closeModal()
        await loadOverviewStats()
        await loadStock()
      } catch (err) {
        alert(`Erreur lors de l'ajustement du stock: ${err.message}`)
      }
    })
  }
}

// ---------------- STOCK MOVEMENTS LOG (Phase 2) ----------------
async function loadStockMovements() {
  const table = document.getElementById('all-moves-table')
  if (!table) return
  try {
    const { data: moves, error } = await supabase
      .from('stock_movements')
      .select('*, product_variants(sku)')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!moves || moves.length === 0) {
      table.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--admin-text-light);">Aucun mouvement de stock enregistré.</td></tr>`
      return
    }

    table.innerHTML = moves.map(m => `
      <tr>
        <td>${new Date(m.created_at).toLocaleString('fr-FR')}</td>
        <td><strong>${m.product_variants?.sku || '---'}</strong></td>
        <td><span class="admin-badge badge-${m.movement_type === 'in' ? 'delivered' : 'cancelled'}">${m.movement_type === 'in' ? 'Entrée' : 'Sortie'}</span></td>
        <td><strong style="color: ${m.quantity > 0 ? 'var(--admin-success)' : 'var(--admin-danger)'}">${m.quantity > 0 ? '+' : ''}${m.quantity}</strong></td>
        <td>${m.reason}</td>
      </tr>
    `).join('')
  } catch (err) {
    console.error(err)
  }
}

// ---------------- CREATE VARIANT MODAL (Phase 2) ----------------
function setupVariantModal() {
  const modal = document.getElementById('variant-modal')
  const openBtn = document.getElementById('open-variant-modal-btn')
  const closeBtn = document.getElementById('close-variant-modal')
  const cancelBtn = document.getElementById('cancel-variant-btn')
  const form = document.getElementById('variant-form')
  const productSelect = document.getElementById('var-product-id')

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      try {
        const { data: products } = await supabase.from('products').select('id, name')
        productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')
      } catch (err) {
        console.error(err)
      }
      modal.classList.add('active')
    })
  }

  const closeModal = () => {
    modal.classList.remove('active')
    form.reset()
  }
  if (closeBtn) closeBtn.addEventListener('click', closeModal)
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const varData = {
        product_id: productSelect.value,
        sku: document.getElementById('var-sku').value,
        size: document.getElementById('var-size').value || null,
        color: document.getElementById('var-color').value || null,
        stock_qty: parseInt(document.getElementById('var-stock').value)
      }

      try {
        const { data, error } = await supabase
          .from('product_variants')
          .insert([varData])
          .select()
          .single()

        if (error) throw error

        if (varData.stock_qty > 0) {
          await supabase.from('stock_movements').insert([{
            variant_id: data.id,
            movement_type: 'in',
            quantity: varData.stock_qty,
            reason: 'Stock initial variante'
          }])
        }

        closeModal()
        await loadStock()
      } catch (err) {
        alert(`Erreur création variante: ${err.message}`)
      }
    })
  }
}

// ---------------- PROMOTIONS PANEL (Phase 2) ----------------
async function loadPromotions() {
  const table = document.getElementById('all-promotions-table')
  if (!table) return
  try {
    const { data: promos, error } = await supabase
      .from('promotions')
      .select('*')
      .order('starts_at', { ascending: false })

    if (error) throw error

    if (!promos || promos.length === 0) {
      table.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-light);">Aucune promotion enregistrée.</td></tr>`
      return
    }

    table.innerHTML = promos.map(p => `
      <tr>
        <td><strong>${p.title}</strong></td>
        <td>${p.discount_type === 'percentage' ? 'Pourcentage' : 'Fixe'}</td>
        <td><strong>${p.discount_value} ${p.discount_type === 'percentage' ? '%' : 'FCFA'}</strong></td>
        <td>${new Date(p.starts_at).toLocaleString('fr-FR')}</td>
        <td>${new Date(p.ends_at).toLocaleString('fr-FR')}</td>
        <td>
          <button class="admin-btn admin-btn-secondary delete-promo-btn" data-id="${p.id}" style="color: var(--admin-danger); border-color: #fca5a5; padding: 6px 12px; font-size: 0.8rem;">
            Supprimer
          </button>
        </td>
      </tr>
    `).join('')

    setupPromoDeleteListeners()
  } catch (err) {
    console.error(err)
  }
}

function setupPromoModal() {
  const modal = document.getElementById('promo-modal')
  const openBtn = document.getElementById('open-promo-modal-btn')
  const closeBtn = document.getElementById('close-promo-modal')
  const cancelBtn = document.getElementById('cancel-promo-btn')
  const form = document.getElementById('promo-form')

  if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('active'))

  const closeModal = () => {
    modal.classList.remove('active')
    form.reset()
  }
  if (closeBtn) closeBtn.addEventListener('click', closeModal)
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const pData = {
        title: document.getElementById('promo-title').value,
        discount_type: document.getElementById('promo-type').value,
        discount_value: parseFloat(document.getElementById('promo-value').value),
        starts_at: new Date(document.getElementById('promo-starts').value).toISOString(),
        ends_at: new Date(document.getElementById('promo-ends').value).toISOString()
      }

      try {
        const { error } = await supabase.from('promotions').insert([pData])
        if (error) throw error
        closeModal()
        await loadPromotions()
      } catch (err) {
        alert(`Erreur création promotion: ${err.message}`)
      }
    })
  }
}

function setupPromoDeleteListeners() {
  document.querySelectorAll('.delete-promo-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Supprimer cette promotion ?')) {
        try {
          const { error } = await supabase.from('promotions').delete().eq('id', btn.dataset.id)
          if (error) throw error
          await loadPromotions()
        } catch (err) {
          alert(err.message)
        }
      }
    })
  })
}

// ---------------- ADMIN ACCOUNTS MANAGER (Super Admin, Phase 2) ----------------
async function loadAdmins() {
  const table = document.getElementById('all-admins-table')
  if (!table) return
  try {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    table.innerHTML = admins.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.id}</td>
        <td><span class="admin-badge badge-confirmed">${translateRole(a.role)}</span></td>
        <td>${new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
        <td>
          ${a.id !== currentAdmin.id ? `
            <button class="admin-btn admin-btn-secondary delete-admin-btn" data-id="${a.id}" style="color: var(--admin-danger); border-color: #fca5a5; padding: 6px 12px; font-size: 0.8rem;">
              Retirer
            </button>
          ` : '---'}
        </td>
      </tr>
    `).join('')

    setupAdminDeleteListeners()
  } catch (err) {
    console.error(err)
  }
}

function setupAdminModal() {
  const modal = document.getElementById('admin-modal')
  const openBtn = document.getElementById('open-admin-modal-btn')
  const closeBtn = document.getElementById('close-admin-modal')
  const cancelBtn = document.getElementById('cancel-admin-btn')
  const form = document.getElementById('admin-invite-form')

  if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('active'))
  
  const closeModal = () => {
    modal.classList.remove('active')
    form.reset()
  }
  if (closeBtn) closeBtn.addEventListener('click', closeModal)
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const name = document.getElementById('admin-new-name').value
      const email = document.getElementById('admin-new-email').value
      const password = document.getElementById('admin-new-password').value
      const role = document.getElementById('admin-new-role').value

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              role: role
            }
          }
        })
        if (error) throw error

        closeModal()
        await loadAdmins()
      } catch (err) {
        alert(`Erreur création compte: ${err.message}`)
      }
    })
  }
}

function setupAdminDeleteListeners() {
  document.querySelectorAll('.delete-admin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Voulez-vous vraiment retirer cet administrateur ?')) {
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', btn.dataset.id)
          if (error) throw error
          await loadAdmins()
        } catch (err) {
          alert(err.message)
        }
      }
    })
  })
}

// ---------------- EXTERNAL SYNC OUTBOX QUEUE (Phase 3) ----------------
async function loadSyncQueue() {
  const table = document.getElementById('all-sync-table')
  if (!table) return
  try {
    const { data: queue, error } = await supabase
      .from('external_sync_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!queue || queue.length === 0) {
      table.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-light);">Aucun événement dans la file de synchronisation.</td></tr>`
      return
    }

    table.innerHTML = queue.map(q => `
      <tr>
        <td>${new Date(q.created_at).toLocaleString('fr-FR')}</td>
        <td><strong>${q.event_type}</strong></td>
        <td>${q.attempts}</td>
        <td><span class="admin-badge badge-${q.status === 'success' ? 'delivered' : (q.status === 'failed' ? 'cancelled' : 'pending')}">${q.status}</span></td>
        <td><button class="admin-btn admin-btn-secondary view-payload-btn" data-id="${q.id}" style="padding: 4px 8px; font-size: 0.8rem;">Voir</button></td>
        <td style="color: var(--admin-danger); font-size: 0.85rem;">${q.last_error || '---'}</td>
      </tr>
    `).join('')

    setupSyncListeners(queue)
  } catch (err) {
    console.error(err)
  }
}

function setupSyncListeners(queue) {
  // View payload
  document.querySelectorAll('.view-payload-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = queue.find(q => q.id === btn.dataset.id)
      if (item) {
        alert(`Payload JSON :\n\n${JSON.stringify(item.payload, null, 2)}`)
      }
    })
  })

  // Worker simulation trigger
  const workerBtn = document.getElementById('run-sync-worker-btn')
  if (workerBtn) {
    const newBtn = workerBtn.cloneNode(true)
    workerBtn.parentNode.replaceChild(newBtn, workerBtn)

    newBtn.addEventListener('click', async () => {
      newBtn.disabled = true
      newBtn.textContent = 'Synchronisation en cours...'

      try {
        const { data: pendingTasks } = await supabase
          .from('external_sync_queue')
          .select('*')
          .in('status', ['pending', 'failed'])

        if (!pendingTasks || pendingTasks.length === 0) {
          alert('File de synchronisation vide (aucun événement en attente).')
          newBtn.disabled = false
          newBtn.textContent = 'Lancer le Worker (Synchro)'
          return
        }

        let successes = 0
        let failures = 0

        for (const task of pendingTasks) {
          // 85% success chance simulation for adapter health checks
          const isSimulatedSuccess = Math.random() > 0.15
          const nextAttempts = task.attempts + 1

          if (isSimulatedSuccess) {
            await supabase
              .from('external_sync_queue')
              .update({
                status: 'success',
                attempts: nextAttempts,
                last_error: null,
                processed_at: new Date().toISOString()
              })
              .eq('id', task.id)
            successes++
          } else {
            await supabase
              .from('external_sync_queue')
              .update({
                status: 'failed',
                attempts: nextAttempts,
                last_error: 'Erreur adaptateur : Connexion avec le service de comptabilité externe interrompue (Simulation).'
              })
              .eq('id', task.id)
            failures++
          }
        }

        alert(`Résultat de la synchronisation :\n\nSuccès : ${successes}\nÉchecs : ${failures}`)
        await loadSyncQueue()
      } catch (err) {
        alert(`Erreur d'exécution: ${err.message}`)
      } finally {
        newBtn.disabled = false
        newBtn.textContent = 'Lancer le Worker (Synchro)'
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', initDashboard)
