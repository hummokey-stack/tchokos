import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'client/a-propos.html'),
        shop: resolve(__dirname, 'client/boutique.html'),
        shoes: resolve(__dirname, 'client/chaussures.html'),
        bags: resolve(__dirname, 'client/sacs.html'),
        local: resolve(__dirname, 'client/produits-locaux.html'),
        services: resolve(__dirname, 'client/services.html'),
        promotions: resolve(__dirname, 'client/promotions.html'),
        checkout: resolve(__dirname, 'client/commande.html'),
        contact: resolve(__dirname, 'client/contact.html'),
        faq: resolve(__dirname, 'client/faq.html'),
        legal: resolve(__dirname, 'client/mentions-legales.html'),
        product: resolve(__dirname, 'client/produit.html'),
        adminLogin: resolve(__dirname, 'admin/login.html'),
        adminDashboard: resolve(__dirname, 'admin/dashboard.html'),
      }
    }
  }
})
