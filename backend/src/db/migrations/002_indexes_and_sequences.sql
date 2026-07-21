-- Follow-up to 001 for databases that were already migrated and seeded.

-- Lookup indexes for the hot paths: cart/favorites drawers, profile orders,
-- the admin dashboard join, and the webhook's razorpay_order_id lookup
-- (that one is already covered by the UNIQUE constraint on the column).
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- The product seed inserts explicit ids (1-12), which leaves the SERIAL
-- sequence parked at 1. Without this, the first product an admin creates
-- collides on the primary key. Fast-forward every id sequence past its
-- table's current maximum. No-ops on an empty or already-correct table.
SELECT setval(
  pg_get_serial_sequence('products', 'id'),
  COALESCE((SELECT MAX(id) FROM products), 1),
  (SELECT COUNT(*) FROM products) > 0
);
SELECT setval(
  pg_get_serial_sequence('users', 'id'),
  COALESCE((SELECT MAX(id) FROM users), 1),
  (SELECT COUNT(*) FROM users) > 0
);
