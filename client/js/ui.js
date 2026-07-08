import { mettreAJourBadge } from './panier.js'

export function initHeaderFooter() {
  const headerHtml = `
    <div class="container flex-between nav-container">
      <a href="/" class="logo">Tchokos<span>.</span></a>
      <nav>
        <ul class="nav-links" id="nav-links">
          <li><a href="/" id="link-home">Accueil</a></li>
          <li><a href="/client/boutique.html" id="link-shop">Boutique</a></li>
          <li><a href="/client/chaussures.html" id="link-shoes">Chaussures</a></li>
          <li><a href="/client/sacs.html" id="link-bags">Sacs</a></li>
          <li><a href="/client/produits-locaux.html" id="link-local">Local</a></li>
          <li><a href="/client/services.html" id="link-services">Services</a></li>
          <li><a href="/client/promotions.html" id="link-promo">Promotions</a></li>
          <li><a href="/client/contact.html" id="link-contact">Contact</a></li>
        </ul>
      </nav>
      <div class="nav-actions">
        <a href="/client/commande.html" class="icon-btn" title="Mon Panier">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span class="badge" id="cart-badge" style="display: none;">0</span>
        </a>
        <button class="menu-toggle" id="menu-toggle" aria-label="Toggle Menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>
    </div>
  `;
  
  const footerHtml = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-about">
          <a href="/" class="logo">Tchokos<span>.</span></a>
          <p>Tchokos SARL, fabricant et revendeur de chaussures et sacs de luxe à Akwa, Douala. L'alliance de l'artisanat local et de l'élégance internationale.</p>
          <div class="social-links">
            <a href="https://www.facebook.com/tchokosgrossiste" target="_blank" class="social-icon" title="Facebook"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg></a>
            <a href="https://www.tiktok.com/@tchokos.sarl" target="_blank" class="social-icon" title="TikTok"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.032 2.5.385 3.446 1.258.91-.703 1.956-1.127 3.167-1.24v2.96c-.95.103-1.745.543-2.33 1.24-.047.88-.04 1.76-.01 2.64v7.7c0 3.32-2.58 6.03-5.83 6.03-3.26 0-5.87-2.67-5.87-5.96 0-3.3 2.65-5.97 5.92-5.96v3c-1.63.02-2.92 1.34-2.92 2.96 0 1.63 1.32 2.96 2.94 2.96 1.64 0 2.93-1.34 2.93-2.98V0z"/></svg></a>
            <a href="https://wa.me/237688094767" target="_blank" class="social-icon" title="WhatsApp" style="color: #25D366;"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 00-6.979-2.885c-5.442 0-9.87 4.37-9.874 9.8-.001 1.761.465 3.483 1.348 5.02L1.932 20.91l4.715-1.756zM20.52 17.88c-.337-.168-1.995-.985-2.309-1.1-3.15-.115-.542-.172-.746-.407-.204-.236-.885-.885-.885-.885s-.502-.56-.63-.73c-.126-.17-.183-.349-.072-.531.112-.183.479-.56.719-.838.24-.279.32-.464.48-.779.16-.315.08-.592-.04-.81-.12-.218-.946-2.28-1.298-3.125-.341-.82-.69-.71-.946-.723l-.808-.01c-.28 0-.736.105-1.12.525-.384.42-1.472 1.44-1.472 3.51 0 2.07 1.504 4.07 1.712 4.35.208.28 2.96 4.52 7.17 6.335 1.002.432 1.784.69 2.395.884 1.006.32 1.922.274 2.646.166.807-.12 1.995-.815 2.275-1.56.28-.745.28-1.385.197-1.515-.084-.13-.308-.298-.646-.466z"/></svg></a>
          </div>
        </div>
        <div class="footer-section">
          <h3 class="footer-title">Navigation</h3>
          <ul class="footer-links">
            <li><a href="/">Accueil</a></li>
            <li><a href="/client/boutique.html">Boutique</a></li>
            <li><a href="/client/services.html">Services</a></li>
            <li><a href="/client/promotions.html">Promotions</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3 class="footer-title">Informations</h3>
          <ul class="footer-links">
            <li><a href="/client/a-propos.html">À propos</a></li>
            <li><a href="/client/faq.html">FAQ</a></li>
            <li><a href="/client/mentions-legales.html">Mentions Légales</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3 class="footer-title">Contact</h3>
          <ul class="footer-links">
            <li><span style="color: #94a3b8">Akwa Douche, en face FAYA Hôtel, Douala</span></li>
            <li><a href="tel:+237688094767">+237 6 88 09 47 67</a></li>
            <li><a href="tel:+237688696508">+237 6 88 69 65 08</a></li>
            <li><a href="mailto:contact@tchokos.com">contact@tchokos.com</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Tchokos SARL. Tous droits réservés.</p>
      </div>
    </div>
  `;

  const header = document.querySelector('header')
  if (header) {
    header.className = 'header'
    header.innerHTML = headerHtml
  }
  const footer = document.querySelector('footer')
  if (footer) {
    footer.className = 'footer'
    footer.innerHTML = footerHtml
  }

  // Hamburger Menu toggle
  const toggle = document.getElementById('menu-toggle')
  const navLinks = document.getElementById('nav-links')
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active')
    })
  }

  // Highlight active link
  const path = window.location.pathname
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href')
    // Reset active class
    link.classList.remove('active')
    if (path === '/' && href === '/') {
      link.classList.add('active')
    } else if (href && href !== '/' && path.includes(href)) {
      link.classList.add('active')
    }
  })

  // Update badge initially
  mettreAJourBadge()
}

// Auto init if header and footer exist
document.addEventListener('DOMContentLoaded', () => {
  initHeaderFooter()
})
