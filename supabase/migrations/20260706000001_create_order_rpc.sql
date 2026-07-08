-- Create sequence for generating order numbers sequentially
create sequence if not exists public.order_number_seq;

-- Grant usage on sequence to anonymous and authenticated users so they can place orders
grant usage, select on sequence public.order_number_seq to anon, authenticated;

-- RPC function to create order transactionally inside Postgres
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_order_type text,
  p_fulfillment text,
  p_delivery_fee numeric,
  p_items jsonb
)
returns jsonb as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_total numeric := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_qty integer;
  v_price numeric;
  v_stock integer;
  v_sku text;
  v_product_id uuid;
  v_product_name text;
begin
  -- Check parameters
  if p_customer_name is null or p_customer_name = '' then
    raise exception 'Le nom du client est requis.';
  end if;
  if p_customer_phone is null or p_customer_phone = '' then
    raise exception 'Le numéro de téléphone est requis.';
  end if;

  -- Generate order number (TK-YYYYMMDD-XXXX)
  v_order_number := 'TK-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  
  -- Calculate total from items array to ensure integrity
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + ((v_item->>'price')::numeric * (v_item->>'quantity')::integer);
  end loop;
  
  v_total := v_total + p_delivery_fee;

  -- Insert order header
  insert into public.orders (
    order_number, customer_name, customer_phone, customer_email,
    order_type, fulfillment, delivery_fee, total, status, payment_status
  ) values (
    v_order_number, p_customer_name, p_customer_phone, p_customer_email,
    p_order_type, p_fulfillment, p_delivery_fee, v_total, 'pending', 'unpaid'
  ) returning id into v_order_id;

  -- Process and validate each item
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    v_product_id := (v_item->>'product_id')::uuid;
    v_product_name := v_item->>'name';
    v_sku := v_item->>'sku';

    -- Get stock and lock row for update to prevent concurrent race conditions
    select stock_qty into v_stock
    from public.product_variants
    where id = v_variant_id
    for update;

    if v_stock is null then
      raise exception 'La variante avec SKU % est introuvable.', v_sku;
    end if;

    if v_stock < v_qty then
      raise exception 'Stock insuffisant pour l''article % (Demandé: %, Disponible: %)', v_product_name, v_qty, v_stock;
    end if;

    -- Insert order item details
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, unit_price, quantity, subtotal
    ) values (
      v_order_id, v_product_id, v_variant_id, v_product_name, v_sku, v_price, v_qty, (v_price * v_qty)
    );

    -- Decrement variant stock
    update public.product_variants
    set stock_qty = stock_qty - v_qty
    where id = v_variant_id;

    -- Log stock movement
    insert into public.stock_movements (
      variant_id, movement_type, quantity, reason
    ) values (
      v_variant_id, 'out', -v_qty, 'Achat en ligne - Commande N° ' || v_order_number
    );
  end loop;

  -- Queue order for external synchronization (Outbox Pattern)
  insert into public.external_sync_queue (event_type, payload)
  values (
    'order_created',
    jsonb_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'customer_name', p_customer_name,
      'customer_phone', p_customer_phone,
      'fulfillment', p_fulfillment,
      'delivery_fee', p_delivery_fee,
      'total', v_total,
      'items', p_items
    )
  );

  -- Return response metadata
  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
end;
$$ language plpgsql security definer;

-- Grant execution permissions to anon and authenticated users
grant execute on function public.create_order to anon, authenticated;
