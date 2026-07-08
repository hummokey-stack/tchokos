import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if credentials are valid (i.e. not empty and not the placeholder example values)
const isLiveSupabaseAvailable = 
  supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseAnonKey && 
  !supabaseAnonKey.includes('your-anon-key');

// Initialize mock database tables in localStorage if they don't exist
function initMockDatabase() {
  const categoriesKey = 'tchokoss_db_categories';
  if (!localStorage.getItem(categoriesKey)) {
    const initialCategories = [
      {"id": "c1a79854-1845-4c07-ba71-6c2cfdfa3528", "name": "Chaussures Importées", "slug": "chaussures-importees", "family": "revendu", "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "c2a79854-1845-4c07-ba71-6c2cfdfa3529", "name": "Chaussures Artisanales", "slug": "chaussures-artisanales", "family": "chaussure_locale", "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "c3a79854-1845-4c07-ba71-6c2cfdfa3530", "name": "Sacs en Cuir", "slug": "sacs-en-cuir", "family": "sac_local", "created_at": "2026-07-06T00:00:00.000Z"}
    ];
    localStorage.setItem(categoriesKey, JSON.stringify(initialCategories));
  }

  const productsKey = 'tchokoss_db_products';
  if (!localStorage.getItem(productsKey)) {
    const initialProducts = [
      {
        "id": "f1a79854-1845-4c07-ba71-6c2cfdfa3531",
        "reference": "CH-IMP-001",
        "name": "Mocassins Classiques Homme",
        "slug": "mocassins-classiques-homme",
        "category_id": "c1a79854-1845-4c07-ba71-6c2cfdfa3528",
        "description": "Mocassins de luxe importés en cuir de qualité supérieure. Confort exceptionnel et design élégant.",
        "price_retail": 45000,
        "price_wholesale": 35000,
        "min_wholesale_qty": 10,
        "status": "published",
        "is_new": true,
        "is_featured": true,
        "main_image_url": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=60",
        "created_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "id": "f2a79854-1845-4c07-ba71-6c2cfdfa3532",
        "reference": "CH-LOC-002",
        "name": "Sandales Traditionnelles Douala",
        "slug": "sandales-traditionnelles-douala",
        "category_id": "c2a79854-1845-4c07-ba71-6c2cfdfa3529",
        "description": "Sandales en cuir véritable, fabriquées à la main par nos artisans à Douala. Durables et légères.",
        "price_retail": 15000,
        "price_wholesale": 11000,
        "min_wholesale_qty": 15,
        "status": "published",
        "is_new": false,
        "is_featured": true,
        "main_image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60",
        "created_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "id": "f3a79854-1845-4c07-ba71-6c2cfdfa3533",
        "reference": "SAC-LOC-003",
        "name": "Sac à Main Cabas Kribi",
        "slug": "sac-a-main-cabas-kribi",
        "category_id": "c3a79854-1845-4c07-ba71-6c2cfdfa3530",
        "description": "Grand sac cabas artisanal en cuir local. Parfait pour le quotidien, alliant style et praticité.",
        "price_retail": 30000,
        "price_wholesale": 22000,
        "min_wholesale_qty": 5,
        "status": "published",
        "is_new": true,
        "is_featured": false,
        "main_image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
        "created_at": "2026-07-06T00:00:00.000Z"
      }
    ];
    localStorage.setItem(productsKey, JSON.stringify(initialProducts));
  }

  const variantsKey = 'tchokoss_db_product_variants';
  if (!localStorage.getItem(variantsKey)) {
    const initialVariants = [
      {"id": "e1a79854-1845-4c07-ba71-6c2cfdfa3534", "product_id": "f1a79854-1845-4c07-ba71-6c2cfdfa3531", "sku": "SKU-CH-IMP-001-42-NOIR", "size": "42", "color": "Noir", "stock_qty": 15, "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "e2a79854-1845-4c07-ba71-6c2cfdfa3535", "product_id": "f1a79854-1845-4c07-ba71-6c2cfdfa3531", "sku": "SKU-CH-IMP-001-43-NOIR", "size": "43", "color": "Noir", "stock_qty": 20, "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "e3a79854-1845-4c07-ba71-6c2cfdfa3536", "product_id": "f1a79854-1845-4c07-ba71-6c2cfdfa3531", "sku": "SKU-CH-IMP-001-42-MARRON", "size": "42", "color": "Marron", "stock_qty": 10, "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "e4a79854-1845-4c07-ba71-6c2cfdfa3537", "product_id": "f2a79854-1845-4c07-ba71-6c2cfdfa3532", "sku": "SKU-CH-LOC-002-41-NATUREL", "size": "41", "color": "Naturel", "stock_qty": 30, "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "e5a79854-1845-4c07-ba71-6c2cfdfa3538", "product_id": "f2a79854-1845-4c07-ba71-6c2cfdfa3532", "sku": "SKU-CH-LOC-002-42-NATUREL", "size": "42", "color": "Naturel", "stock_qty": 25, "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "e6a79854-1845-4c07-ba71-6c2cfdfa3539", "product_id": "f3a79854-1845-4c07-ba71-6c2cfdfa3533", "sku": "SKU-SAC-LOC-003-TU-NOIR", "size": "TU", "color": "Noir", "stock_qty": 8, "created_at": "2026-07-06T00:00:00.000Z"},
      {"id": "e7a79854-1845-4c07-ba71-6c2cfdfa3540", "product_id": "f3a79854-1845-4c07-ba71-6c2cfdfa3533", "sku": "SKU-SAC-LOC-003-TU-ROUGE", "size": "TU", "color": "Rouge", "stock_qty": 5, "created_at": "2026-07-06T00:00:00.000Z"}
    ];
    localStorage.setItem(variantsKey, JSON.stringify(initialVariants));
  }

  const profilesKey = 'tchokoss_db_profiles';
  if (!localStorage.getItem(profilesKey)) {
    const initialProfiles = [
      {
        "id": "super-admin-uuid-1111-2222",
        "name": "Directeur Général",
        "email": "admin@tchokoss.com",
        "role": "super_admin",
        "created_at": "2026-07-06T00:00:00.000Z"
      }
    ];
    localStorage.setItem(profilesKey, JSON.stringify(initialProfiles));
  }

  const ordersKey = 'tchokoss_db_orders';
  if (!localStorage.getItem(ordersKey)) {
    const sampleOrders = [
      {
        "id": "sample-order-uuid-9999",
        "order_number": "TK-20260706-0001",
        "customer_name": "Kouamé Koffi",
        "customer_phone": "+237 677 88 99 00",
        "customer_email": "kouame.koffi@example.com",
        "order_type": "detail",
        "fulfillment": "livraison",
        "delivery_fee": 3000,
        "total": 48000,
        "status": "delivered",
        "payment_status": "paid",
        "created_at": "2026-07-06T14:35:00.000Z"
      }
    ];
    localStorage.setItem(ordersKey, JSON.stringify(sampleOrders));

    const orderItemsKey = 'tchokoss_db_order_items';
    const sampleOrderItems = [
      {
        "id": "sample-item-uuid-9999",
        "order_id": "sample-order-uuid-9999",
        "product_id": "f1a79854-1845-4c07-ba71-6c2cfdfa3531",
        "variant_id": "e1a79854-1845-4c07-ba71-6c2cfdfa3534",
        "product_name": "Mocassins Classiques Homme",
        "sku": "SKU-CH-IMP-001-42-NOIR",
        "unit_price": 45000,
        "quantity": 1,
        "subtotal": 45000
      }
    ];
    localStorage.setItem(orderItemsKey, JSON.stringify(sampleOrderItems));
  }
}

// execute mock order creation immitating PostgreSQL Stored Procedure
function executeMockCreateOrder(params) {
  const {
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_order_type,
    p_fulfillment,
    p_delivery_fee,
    p_items
  } = params;

  if (!p_customer_name) {
    return { data: null, error: new Error('Le nom du client est requis.') };
  }
  if (!p_customer_phone) {
    return { data: null, error: new Error('Le numéro de téléphone est requis.') };
  }

  // Generate order number
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqKey = 'tchokoss_db_seq_order_number';
  let seq = parseInt(localStorage.getItem(seqKey) || '0') + 1;
  localStorage.setItem(seqKey, seq.toString());
  const orderNumber = `TK-${todayStr}-${seq.toString().padStart(4, '0')}`;

  let itemsTotal = 0;
  for (const item of p_items) {
    itemsTotal += Number(item.price) * Number(item.quantity);
  }
  const total = itemsTotal + Number(p_delivery_fee);

  const orderId = crypto.randomUUID();

  // Load tables
  const ordersKey = 'tchokoss_db_orders';
  const orderItemsKey = 'tchokoss_db_order_items';
  const variantsKey = 'tchokoss_db_product_variants';
  const stockMovementsKey = 'tchokoss_db_stock_movements';
  const syncQueueKey = 'tchokoss_db_external_sync_queue';

  const orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
  const orderItems = JSON.parse(localStorage.getItem(orderItemsKey) || '[]');
  const variants = JSON.parse(localStorage.getItem(variantsKey) || '[]');
  const stockMovements = JSON.parse(localStorage.getItem(stockMovementsKey) || '[]');
  const syncQueue = JSON.parse(localStorage.getItem(syncQueueKey) || '[]');

  // Validate variant stock
  const orderItemsToInsert = [];
  const stockMovementsToInsert = [];

  for (const item of p_items) {
    const vIndex = variants.findIndex(v => v.id === item.variant_id);
    if (vIndex === -1) {
      return { data: null, error: new Error(`La variante avec SKU ${item.sku} est introuvable.`) };
    }

    const variant = variants[vIndex];
    if (variant.stock_qty < item.quantity) {
      return { data: null, error: new Error(`Stock insuffisant pour l'article ${item.name} (Demandé: ${item.quantity}, Disponible: ${variant.stock_qty})`) };
    }

    // Decrement stock
    variant.stock_qty -= item.quantity;

    orderItemsToInsert.push({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.name,
      sku: item.sku,
      unit_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    });

    stockMovementsToInsert.push({
      id: crypto.randomUUID(),
      variant_id: item.variant_id,
      movement_type: 'out',
      quantity: -item.quantity,
      reason: `Achat en ligne - Commande N° ${orderNumber}`,
      created_at: new Date().toISOString()
    });
  }

  // Save changes
  localStorage.setItem(variantsKey, JSON.stringify(variants));
  localStorage.setItem(orderItemsKey, JSON.stringify([...orderItems, ...orderItemsToInsert]));
  localStorage.setItem(stockMovementsKey, JSON.stringify([...stockMovements, ...stockMovementsToInsert]));

  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    customer_name: p_customer_name,
    customer_phone: p_customer_phone,
    customer_email: p_customer_email,
    order_type: p_order_type,
    fulfillment: p_fulfillment,
    delivery_fee: Number(p_delivery_fee),
    total: total,
    status: 'pending',
    payment_status: 'unpaid',
    created_at: new Date().toISOString()
  };
  localStorage.setItem(ordersKey, JSON.stringify([...orders, newOrder]));

  const syncEvent = {
    id: crypto.randomUUID(),
    event_type: 'order_created',
    payload: {
      order_id: orderId,
      order_number: orderNumber,
      customer_name: p_customer_name,
      customer_phone: p_customer_phone,
      fulfillment: p_fulfillment,
      delivery_fee: Number(p_delivery_fee),
      total: total,
      items: p_items
    },
    status: 'pending',
    attempts: 0,
    last_error: null,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(syncQueueKey, JSON.stringify([...syncQueue, syncEvent]));

  return {
    data: {
      order_id: orderId,
      order_number: orderNumber,
      total: total
    },
    error: null
  };
}

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderConfig = null;
    this.limitVal = null;
    this.isSingle = false;
    this.insertData = null;
    this.updateData = null;
    this.isDelete = false;
    this.countConfig = null;
  }

  select(columns = '*', options = {}) {
    this.columns = columns;
    if (options.count) {
      this.countConfig = options.count;
    }
    return this;
  }

  eq(column, value) {
    this.filters.push(row => {
      return row[column] === value;
    });
    return this;
  }

  in(column, values) {
    this.filters.push(row => {
      if (column.includes('.')) {
        const parts = column.split('.');
        const parent = row[parts[0]];
        return parent && values.includes(parent[parts[1]]);
      }
      return values.includes(row[column]);
    });
    return this;
  }

  lte(column, value) {
    this.filters.push(row => {
      return Number(row[column]) <= Number(value);
    });
    return this;
  }

  order(column, options = {}) {
    const ascending = options.ascending !== false;
    this.orderConfig = { column, ascending };
    return this;
  }

  limit(val) {
    this.limitVal = val;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data) {
    this.insertData = data;
    return this;
  }

  update(data) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  // Promise thenable implementation
  async then(onfulfilled, onrejected) {
    try {
      const result = this.execute();
      return onfulfilled ? onfulfilled(result) : result;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  execute() {
    const key = `tchokoss_db_${this.table}`;
    let data = JSON.parse(localStorage.getItem(key) || '[]');

    if (this.insertData) {
      const rowsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const insertedRows = rowsToInsert.map(row => {
        const newRow = {
          id: row.id || crypto.randomUUID(),
          created_at: row.created_at || new Date().toISOString(),
          ...row
        };
        data.push(newRow);
        return newRow;
      });
      localStorage.setItem(key, JSON.stringify(data));
      return { data: this.isSingle ? insertedRows[0] : insertedRows, error: null };
    }

    if (this.updateData) {
      const updatedRows = [];
      data = data.map(row => {
        const matches = this.filters.every(f => f(row));
        if (matches) {
          const updatedRow = { ...row, ...this.updateData };
          updatedRows.push(updatedRow);
          return updatedRow;
        }
        return row;
      });
      localStorage.setItem(key, JSON.stringify(data));
      return { data: this.isSingle ? updatedRows[0] : updatedRows, error: null };
    }

    if (this.isDelete) {
      data = data.filter(row => {
        const matches = this.filters.every(f => f(row));
        return !matches;
      });
      localStorage.setItem(key, JSON.stringify(data));
      return { data: null, error: null };
    }

    // Join resolution
    let processed = data.map(row => {
      const copy = { ...row };

      if (this.table === 'products' && copy.category_id) {
        const categories = JSON.parse(localStorage.getItem('tchokoss_db_categories') || '[]');
        copy.categories = categories.find(c => c.id === copy.category_id) || null;
      }

      if (this.table === 'product_variants' && copy.product_id) {
        const products = JSON.parse(localStorage.getItem('tchokoss_db_products') || '[]');
        const categories = JSON.parse(localStorage.getItem('tchokoss_db_categories') || '[]');
        const prod = products.find(p => p.id === copy.product_id);
        if (prod) {
          copy.products = { ...prod };
          copy.products.categories = categories.find(c => c.id === prod.category_id) || null;
        } else {
          copy.products = null;
        }
      }

      if (this.table === 'stock_movements' && copy.variant_id) {
        const variants = JSON.parse(localStorage.getItem('tchokoss_db_product_variants') || '[]');
        copy.product_variants = variants.find(v => v.id === copy.variant_id) || null;
      }

      return copy;
    });

    if (this.filters.length > 0) {
      processed = processed.filter(row => this.filters.every(f => f(row)));
    }

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      processed.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];

        if (valA === undefined || valB === undefined) return 0;

        if (typeof valA === 'string') {
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    if (this.limitVal !== null) {
      processed = processed.slice(0, this.limitVal);
    }

    let countResult = null;
    if (this.countConfig) {
      countResult = processed.length;
    }

    if (this.isSingle) {
      if (processed.length === 0) {
        return { data: null, error: new Error('Row not found') };
      }
      return { data: processed[0], error: null };
    }

    return { data: processed, error: null, count: countResult };
  }
}

class MockAuth {
  async getSession() {
    const session = JSON.parse(localStorage.getItem('tchokoss_db_auth_session'));
    return { data: { session }, error: null };
  }

  async signInWithPassword({ email, password }) {
    const profiles = JSON.parse(localStorage.getItem('tchokoss_db_profiles') || '[]');
    const profile = profiles.find(p => p.email === email);

    if (!profile) {
      return { data: { user: null }, error: new Error("Identifiants incorrects ou droits insuffisants.") };
    }

    const session = {
      user: {
        id: profile.id,
        email: profile.email
      },
      profile: profile
    };

    localStorage.setItem('tchokoss_db_auth_session', JSON.stringify(session));
    return { data: { user: session.user }, error: null };
  }

  async signOut() {
    localStorage.removeItem('tchokoss_db_auth_session');
    return { error: null };
  }

  async signUp({ email, password, options }) {
    const profiles = JSON.parse(localStorage.getItem('tchokoss_db_profiles') || '[]');
    const newAdminId = crypto.randomUUID();
    const newProfile = {
      id: newAdminId,
      name: options?.data?.name || 'Nouvel Administrateur',
      email: email,
      role: options?.data?.role || 'moderateur',
      created_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    localStorage.setItem('tchokoss_db_profiles', JSON.stringify(profiles));

    return { data: { user: { id: newAdminId, email } }, error: null };
  }
}

class MockSupabaseClient {
  constructor() {
    initMockDatabase();
    this.auth = new MockAuth();
  }

  from(table) {
    return new MockQueryBuilder(table);
  }

  async rpc(funcName, params) {
    if (funcName === 'create_order') {
      return executeMockCreateOrder(params);
    }
    return { data: null, error: new Error(`La fonction RPC ${funcName} n'est pas implémentée sur le client simulé.`) };
  }
}

// Export either real client or mock client depending on configuration
export const supabase = isLiveSupabaseAvailable
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new MockSupabaseClient();
