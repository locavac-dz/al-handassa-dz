const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');
const { sendOrderConfirmation, sendLicenseIssued } = require('../utils/email');
const { settleOrder } = require('../utils/fulfillment');

async function create(req, res, next) {
  let client;
  try {
    client = await getClient();
    await client.query('BEGIN');

    const { items, payment_method, coupon_code } = req.body;
    if (!items?.length) throw new AppError('Panier vide.', 400);

    let subtotal = 0;
    let discount_amount = 0;
    const enrichedItems = [];

    for (const item of items) {
      if (item.type === 'product') {
        const res = await client.query(
          `SELECT id, title, price, discount_price, discount_ends_at, is_free
           FROM products WHERE id=$1 AND is_active=TRUE`,
          [item.id]
        );
        if (!res.rows.length) throw new AppError(`Produit ${item.id} introuvable.`, 404);
        const p = res.rows[0];
        const price = (!p.is_free && p.discount_price && (!p.discount_ends_at || new Date(p.discount_ends_at) > new Date()))
          ? parseFloat(p.discount_price)
          : parseFloat(p.price);
        subtotal += price;
        enrichedItems.push({ id: p.id, type: 'product', title: p.title, unit_price: price });
      } else if (item.type === 'video') {
        const res = await client.query(
          'SELECT id, title, price, is_free FROM videos WHERE id=$1 AND is_active=TRUE',
          [item.id]
        );
        if (!res.rows.length) throw new AppError(`Vidéo ${item.id} introuvable.`, 404);
        const v = res.rows[0];
        const price = v.is_free ? 0 : parseFloat(v.price);
        subtotal += price;
        enrichedItems.push({ id: v.id, type: 'video', title: v.title, unit_price: price });
      }
    }

    // Coupon
    if (coupon_code) {
      const coupon = await client.query(
        `SELECT * FROM coupons WHERE code=$1 AND is_active=TRUE
         AND (valid_until IS NULL OR valid_until > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
        [coupon_code.toUpperCase()]
      );
      if (!coupon.rows.length) throw new AppError('Code promo invalide ou expiré.', 400);
      const c = coupon.rows[0];
      if (subtotal < parseFloat(c.min_order_amount)) {
        throw new AppError(`Montant minimum requis: ${c.min_order_amount} DZD`, 400);
      }
      discount_amount = c.discount_type === 'percent'
        ? subtotal * (parseFloat(c.discount_value) / 100)
        : Math.min(parseFloat(c.discount_value), subtotal);
      await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id=$1', [c.id]);
    }

    const total_amount = Math.max(0, subtotal - discount_amount);

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, subtotal, discount_amount, total_amount, payment_method, coupon_code, ip_address)
       VALUES ($1,'pending',$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, subtotal, discount_amount, total_amount,
       payment_method || null, coupon_code || null, req.ip]
    );
    const order = orderRes.rows[0];

    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, ${item.type}_id, item_type, title, unit_price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,1,$5)`,
        [order.id, item.id, item.type, item.title, item.unit_price]
      );
    }

    await client.query('COMMIT');

    const fullOrder = { ...order, items: enrichedItems };
    // Email confirmation (non bloquant)
    const userRes = await query('SELECT email, first_name FROM users WHERE id=$1', [req.user.id]);
    sendOrderConfirmation(fullOrder, userRes.rows[0]).catch(e => console.error('[EMAIL]', e.message));

    res.status(201).json({ data: fullOrder });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client) client.release();
  }
}

async function getMyOrders(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_method, o.created_at,
              JSON_AGG(JSON_BUILD_OBJECT(
                'title', oi.title, 'type', oi.item_type, 'price', oi.unit_price
              )) AS items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    const total = parseInt((await query('SELECT COUNT(*) FROM orders WHERE user_id=$1', [req.user.id])).rows[0].count, 10);
    res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const result = await query(
      `SELECT o.*,
              JSON_AGG(JSON_BUILD_OBJECT('title',oi.title,'type',oi.item_type,'price',oi.unit_price,'subtotal',oi.subtotal)) AS items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id=$1 AND o.user_id=$2
       GROUP BY o.id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) throw new AppError('Commande introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
}

async function getMyPurchases(req, res, next) {
  try {
    const result = await query(
      `SELECT DISTINCT ON (oi.product_id)
              oi.product_id AS id,
              p.title, p.slug, p.type::varchar AS type, p.thumbnail_url,
              p.file_url IS NOT NULL AS has_file,
              o.id AS order_id, o.order_number, o.created_at AS purchased_at
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1 AND o.status = 'paid' AND oi.item_type = 'product'
       ORDER BY oi.product_id, o.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
}

// Admin — toutes les commandes
async function adminList(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { status } = req.query;
    const params = [];
    let where = '';
    if (status) { where = 'WHERE o.status = $1'; params.push(status); }
    params.push(limit, offset);

    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_method, o.created_at,
              u.first_name, u.last_name, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
}

// PATCH /api/orders/admin/:id/status
// 'paid' passe par settleOrder() (même livraison idempotente que SATIM et la validation admin) ;
// 'refunded' / 'cancelled' révoquent les licences et les accès vidéo de la commande (les téléchargements
// de produits se contrôlent sur orders.status = 'paid', ils se ferment donc d'eux-mêmes).
async function updateStatus(req, res, next) {
  let client;
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending','processing','paid','failed','refunded','cancelled'];
    if (!valid.includes(status)) throw new AppError('Statut invalide.', 400);

    client = await getClient();
    await client.query('BEGIN');

    const current = await client.query('SELECT id, user_id, status FROM orders WHERE id=$1 FOR UPDATE', [id]);
    if (!current.rows.length) throw new AppError('Commande introuvable.', 404);
    const order = current.rows[0];

    let licenses = [];
    if (status === 'paid') {
      const settled = await settleOrder(client, { orderId: id, userId: order.user_id, paymentId: null });
      if (!settled.fulfilled && order.status !== 'paid') {
        throw new AppError('Commande non payable depuis cet état (annulée ou remboursée).', 409);
      }
      licenses = settled.licenses;
    } else {
      await client.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', [status, id]);
      if (status === 'refunded' || status === 'cancelled') {
        await client.query(
          `UPDATE software_licenses SET status='revoked'
            WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=$1)`, [id]);
        await client.query('DELETE FROM user_video_access WHERE order_id=$1', [id]);
      }
    }

    const result = await client.query('SELECT * FROM orders WHERE id=$1', [id]);
    await client.query('COMMIT');

    if (licenses.length) {
      const userRes = await query('SELECT email, first_name FROM users WHERE id=$1', [order.user_id]);
      sendLicenseIssued(userRes.rows[0], licenses).catch(e => console.error('[EMAIL] sendLicenseIssued failed:', e.message));
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client) client.release();
  }
}

module.exports = { create, getMyOrders, getOne, getMyPurchases, adminList, updateStatus };
