-- Seed categories
insert into public.categories (id, name, slug, family) values
('c1a79854-1845-4c07-ba71-6c2cfdfa3528', 'Chaussures Importées', 'chaussures-importees', 'revendu'),
('c2a79854-1845-4c07-ba71-6c2cfdfa3529', 'Chaussures Artisanales', 'chaussures-artisanales', 'chaussure_locale'),
('c3a79854-1845-4c07-ba71-6c2cfdfa3530', 'Sacs en Cuir', 'sacs-en-cuir', 'sac_local')
on conflict (id) do nothing;

-- Seed products
insert into public.products (id, reference, name, slug, category_id, description, price_retail, price_wholesale, min_wholesale_qty, status, is_new, is_featured, main_image_url) values
('f1a79854-1845-4c07-ba71-6c2cfdfa3531', 'CH-IMP-001', 'Mocassins Classiques Homme', 'mocassins-classiques-homme', 'c1a79854-1845-4c07-ba71-6c2cfdfa3528', 'Mocassins de luxe importés en cuir de qualité supérieure. Confort exceptionnel et design élégant.', 45000, 35000, 10, 'published', true, true, 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=60'),
('f2a79854-1845-4c07-ba71-6c2cfdfa3532', 'CH-LOC-002', 'Sandales Traditionnelles Douala', 'sandales-traditionnelles-douala', 'c2a79854-1845-4c07-ba71-6c2cfdfa3529', 'Sandales en cuir véritable, fabriquées à la main par nos artisans à Douala. Durables et légères.', 15000, 11000, 15, 'published', false, true, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'),
('f3a79854-1845-4c07-ba71-6c2cfdfa3533', 'SAC-LOC-003', 'Sac à Main Cabas Kribi', 'sac-a-main-cabas-kribi', 'c3a79854-1845-4c07-ba71-6c2cfdfa3530', 'Grand sac cabas artisanal en cuir local. Parfait pour le quotidien, alliant style et praticité.', 30000, 22000, 5, 'published', true, false, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60')
on conflict (id) do nothing;

-- Seed product variants
insert into public.product_variants (id, product_id, sku, size, color, stock_qty) values
('e1a79854-1845-4c07-ba71-6c2cfdfa3534', 'f1a79854-1845-4c07-ba71-6c2cfdfa3531', 'SKU-CH-IMP-001-42-NOIR', '42', 'Noir', 15),
('e2a79854-1845-4c07-ba71-6c2cfdfa3535', 'f1a79854-1845-4c07-ba71-6c2cfdfa3531', 'SKU-CH-IMP-001-43-NOIR', '43', 'Noir', 20),
('e3a79854-1845-4c07-ba71-6c2cfdfa3536', 'f1a79854-1845-4c07-ba71-6c2cfdfa3531', 'SKU-CH-IMP-001-42-MARRON', '42', 'Marron', 10),
('e4a79854-1845-4c07-ba71-6c2cfdfa3537', 'f2a79854-1845-4c07-ba71-6c2cfdfa3532', 'SKU-CH-LOC-002-41-NATUREL', '41', 'Naturel', 30),
('e5a79854-1845-4c07-ba71-6c2cfdfa3538', 'f2a79854-1845-4c07-ba71-6c2cfdfa3532', 'SKU-CH-LOC-002-42-NATUREL', '42', 'Naturel', 25),
('e6a79854-1845-4c07-ba71-6c2cfdfa3539', 'f3a79854-1845-4c07-ba71-6c2cfdfa3533', 'SKU-SAC-LOC-003-TU-NOIR', 'TU', 'Noir', 8),
('e7a79854-1845-4c07-ba71-6c2cfdfa3540', 'f3a79854-1845-4c07-ba71-6c2cfdfa3533', 'SKU-SAC-LOC-003-TU-ROUGE', 'TU', 'Rouge', 5)
on conflict (id) do nothing;

-- Seed Settings
insert into public.settings (key, value) values
('company_info', '{"name": "Tchokos SARL", "address": "Akwa, Douala, Cameroun", "phone": "+237 600 00 00 00", "email": "contact@tchokos.com", "facebook": "https://facebook.com/tchokos", "instagram": "https://instagram.com/tchokos"}')
on conflict (key) do nothing;