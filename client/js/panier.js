export function getPanier() {
  const panier = localStorage.getItem('tchokos_panier')
  return panier ? JSON.parse(panier) : []
}

export function savePanier(panier) {
  localStorage.setItem('tchokos_panier', JSON.stringify(panier))
  mettreAJourBadge()
  // Trigger custom event to notify other scripts
  window.dispatchEvent(new CustomEvent('panier-updated'))
}

export function ajouterAuPanier(product, variant, qty = 1) {
  const panier = getPanier()
  const existingItemIndex = panier.findIndex(item => item.variant_id === variant.id)

  if (existingItemIndex > -1) {
    // Check stock limit
    const newQty = panier[existingItemIndex].quantity + qty
    if (newQty <= variant.stock_qty) {
      panier[existingItemIndex].quantity = newQty
      panier[existingItemIndex].subtotal = newQty * (variant.price_override || product.price_retail)
    } else {
      alert(`Quantité max disponible dépassée. Stock restant : ${variant.stock_qty}`)
      return false;
    }
  } else {
    // Check if stock is available
    if (variant.stock_qty >= qty) {
      panier.push({
        product_id: product.id,
        variant_id: variant.id,
        name: product.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        image: product.main_image_url,
        price: variant.price_override || product.price_retail,
        quantity: qty,
        subtotal: qty * (variant.price_override || product.price_retail),
        stock_max: variant.stock_qty
      })
    } else {
      alert(`Stock insuffisant. Stock restant : ${variant.stock_qty}`)
      return false;
    }
  }

  savePanier(panier)
  return true;
}

export function retirerDuPanier(variantId) {
  let panier = getPanier()
  panier = panier.filter(item => item.variant_id !== variantId)
  savePanier(panier)
}

export function modifierQuantite(variantId, newQty) {
  const panier = getPanier()
  const item = panier.find(item => item.variant_id === variantId)

  if (item) {
    if (newQty > item.stock_max) {
      alert(`Stock insuffisant. Stock disponible : ${item.stock_max}`)
      return false
    }
    if (newQty <= 0) {
      retirerDuPanier(variantId)
    } else {
      item.quantity = newQty
      item.subtotal = newQty * item.price
      savePanier(panier)
    }
  }
  return true
}

export function viderPanier() {
  localStorage.removeItem('tchokos_panier')
  mettreAJourBadge()
  window.dispatchEvent(new CustomEvent('panier-updated'))
}

export function calculerTotal() {
  const panier = getPanier()
  return panier.reduce((sum, item) => sum + item.subtotal, 0)
}

export function compterArticles() {
  const panier = getPanier()
  return panier.reduce((sum, item) => sum + item.quantity, 0)
}

export function mettreAJourBadge() {
  const count = compterArticles()
  const badge = document.getElementById('cart-badge')
  if (badge) {
    badge.textContent = count
    badge.style.display = count > 0 ? 'flex' : 'none'
  }
}

// Auto-run badge update on load
document.addEventListener('DOMContentLoaded', () => {
  mettreAJourBadge()
})
