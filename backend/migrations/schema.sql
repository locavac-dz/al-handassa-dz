-- ================================================================
-- HANDASSI.DZ — Schéma PostgreSQL Complet
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─────────────────────────────────────────────────────────────────
-- TYPES ENUM
-- ─────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE study_level AS ENUM ('bac_technique', 'bts', 'licence', 'master', 'ingenieur', 'professionnel');
CREATE TYPE subscription_plan AS ENUM ('free', 'standard', 'pro');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');
CREATE TYPE product_type AS ENUM ('ouvrage', 'cours_pdf', 'exercices', 'normes', 'logiciels', 'pack');
CREATE TYPE content_level AS ENUM ('debutant', 'intermediaire', 'avance', 'tous');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cib', 'dahabiya', 'baridimob', 'ccp_virement', 'especes', 'paypal', 'visa', 'code_prepaye');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- ─────────────────────────────────────────────────────────────────
-- WILAYAS (48 wilayas d'Algérie)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE wilayas (
  id          SMALLINT PRIMARY KEY,
  code        VARCHAR(2) NOT NULL,
  name_fr     VARCHAR(100) NOT NULL,
  name_ar     VARCHAR(100) NOT NULL,
  region      VARCHAR(50)
);

INSERT INTO wilayas (id, code, name_fr, name_ar, region) VALUES
(1,'01','Adrar','أدرار','Sud'),
(2,'02','Chlef','الشلف','Centre'),
(3,'03','Laghouat','الأغواط','Sud'),
(4,'04','Oum El Bouaghi','أم البواقي','Est'),
(5,'05','Batna','باتنة','Est'),
(6,'06','Béjaïa','بجاية','Est'),
(7,'07','Biskra','بسكرة','Sud'),
(8,'08','Béchar','بشار','Sud'),
(9,'09','Blida','البليدة','Centre'),
(10,'10','Bouira','البويرة','Centre'),
(11,'11','Tamanrasset','تمنراست','Sud'),
(12,'12','Tébessa','تبسة','Est'),
(13,'13','Tlemcen','تلمسان','Ouest'),
(14,'14','Tiaret','تيارت','Ouest'),
(15,'15','Tizi Ouzou','تيزي وزو','Centre'),
(16,'16','Alger','الجزائر','Centre'),
(17,'17','Djelfa','الجلفة','Centre'),
(18,'18','Jijel','جيجل','Est'),
(19,'19','Sétif','سطيف','Est'),
(20,'20','Saïda','سعيدة','Ouest'),
(21,'21','Skikda','سكيكدة','Est'),
(22,'22','Sidi Bel Abbès','سيدي بلعباس','Ouest'),
(23,'23','Annaba','عنابة','Est'),
(24,'24','Guelma','قالمة','Est'),
(25,'25','Constantine','قسنطينة','Est'),
(26,'26','Médéa','المدية','Centre'),
(27,'27','Mostaganem','مستغانم','Ouest'),
(28,'28','M''Sila','المسيلة','Centre'),
(29,'29','Mascara','معسكر','Ouest'),
(30,'30','Ouargla','ورقلة','Sud'),
(31,'31','Oran','وهران','Ouest'),
(32,'32','El Bayadh','البيض','Sud'),
(33,'33','Illizi','إليزي','Sud'),
(34,'34','Bordj Bou Arréridj','برج بوعريريج','Est'),
(35,'35','Boumerdès','بومرداس','Centre'),
(36,'36','El Tarf','الطارف','Est'),
(37,'37','Tindouf','تندوف','Sud'),
(38,'38','Tissemsilt','تيسمسيلت','Ouest'),
(39,'39','El Oued','الوادي','Sud'),
(40,'40','Khenchela','خنشلة','Est'),
(41,'41','Souk Ahras','سوق أهراس','Est'),
(42,'42','Tipaza','تيبازة','Centre'),
(43,'43','Mila','ميلة','Est'),
(44,'44','Aïn Defla','عين الدفلى','Centre'),
(45,'45','Naâma','النعامة','Ouest'),
(46,'46','Aïn Témouchent','عين تموشنت','Ouest'),
(47,'47','Ghardaïa','غرداية','Sud'),
(48,'48','Relizane','غليزان','Ouest');

-- ─────────────────────────────────────────────────────────────────
-- UTILISATEURS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255) UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  phone               VARCHAR(20),
  wilaya_id           SMALLINT REFERENCES wilayas(id),
  study_level         study_level,
  university          VARCHAR(200),
  role                user_role NOT NULL DEFAULT 'student',
  subscription_plan   subscription_plan NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  avatar_url          TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  email_verify_token  VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  refresh_token       TEXT,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription ON users(subscription_plan);

-- ─────────────────────────────────────────────────────────────────
-- CATÉGORIES DE PRODUITS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  name_fr     VARCHAR(150) NOT NULL,
  name_ar     VARCHAR(150) NOT NULL,
  description TEXT,
  icon        VARCHAR(10),
  parent_id   INTEGER REFERENCES categories(id),
  sort_order  SMALLINT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (slug, name_fr, name_ar, icon) VALUES
('beton-arme',         'Béton Armé',                 'الخرسانة المسلحة',      '🏗️'),
('structures',         'Structures',                  'الهياكل',               '📐'),
('geotechnique',       'Géotechnique & Fondations',  'الجيوتقنية والأساسات',  '🔬'),
('hydraulique',        'Hydraulique',                 'الهيدروليك',            '🌊'),
('materiaux',          'Matériaux de Construction',  'مواد البناء',           '🧱'),
('topographie',        'Topographie & DAO',           'الطوبوغرافيا والرسم',   '📏'),
('architecture',       'Architecture',                'العمارة',               '🏛️'),
('parasismique',       'Parasismique & Normes DTR',  'مقاومة الزلازل',        '📋'),
('routes-vrd',         'Routes & VRD',                'الطرق والأشغال العامة', '🛣️'),
('logiciels',          'Logiciels (AutoCAD, Revit)', 'البرامج التقنية',       '💻'),
('pfe-memoires',       'PFE & Mémoires',              'مذكرات التخرج',         '🎓'),
('developpement-durable','Développement Durable',    'التنمية المستدامة',     '🌱');

-- ─────────────────────────────────────────────────────────────────
-- AUTEURS / FORMATEURS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE instructors (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  display_name  VARCHAR(200) NOT NULL,
  title         VARCHAR(200),
  institution   VARCHAR(200),
  bio           TEXT,
  avatar_url    TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- PRODUITS (ouvrages, cours PDF, exercices, normes…)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(300) NOT NULL,
  title_ar        VARCHAR(300),
  slug            VARCHAR(350) UNIQUE NOT NULL,
  description     TEXT,
  description_ar  TEXT,
  type            product_type NOT NULL,
  category_id     INTEGER REFERENCES categories(id),
  study_level     content_level NOT NULL DEFAULT 'tous',
  instructor_id   INTEGER REFERENCES instructors(id),
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price  NUMERIC(10,2),
  discount_ends_at TIMESTAMPTZ,
  is_free         BOOLEAN NOT NULL DEFAULT FALSE,
  file_url        TEXT,
  file_size_mb    NUMERIC(6,2),
  pages_count     INTEGER,
  thumbnail_url   TEXT,
  preview_url     TEXT,
  language        VARCHAR(10) NOT NULL DEFAULT 'fr',
  tags            TEXT[],
  metadata        JSONB DEFAULT '{}',
  rating_avg      NUMERIC(3,2) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  views_count     INTEGER DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_level ON products(study_level);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')));

-- ─────────────────────────────────────────────────────────────────
-- VIDÉOS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE videos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(300) NOT NULL,
  title_ar        VARCHAR(300),
  slug            VARCHAR(350) UNIQUE NOT NULL,
  description     TEXT,
  category_id     INTEGER REFERENCES categories(id),
  study_level     content_level NOT NULL DEFAULT 'tous',
  instructor_id   INTEGER REFERENCES instructors(id),
  duration_seconds INTEGER,
  video_url       TEXT,
  video_host      VARCHAR(50) DEFAULT 'local',
  thumbnail_url   TEXT,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_free         BOOLEAN NOT NULL DEFAULT FALSE,
  language        VARCHAR(10) DEFAULT 'fr',
  tags            TEXT[],
  views_count     INTEGER DEFAULT 0,
  rating_avg      NUMERIC(3,2) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_level ON videos(study_level);
CREATE INDEX idx_videos_free ON videos(is_free);

-- ─────────────────────────────────────────────────────────────────
-- ARTICLES SCIENTIFIQUES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(400) NOT NULL,
  title_ar        VARCHAR(400),
  slug            VARCHAR(450) UNIQUE NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL,
  category_id     INTEGER REFERENCES categories(id),
  author_id       INTEGER REFERENCES instructors(id),
  thumbnail_url   TEXT,
  read_time_min   SMALLINT,
  is_free         BOOLEAN NOT NULL DEFAULT TRUE,
  price           NUMERIC(10,2) DEFAULT 0,
  language        VARCHAR(10) DEFAULT 'fr',
  tags            TEXT[],
  bibliography    TEXT[],
  doi             VARCHAR(100),
  views_count     INTEGER DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('french', title || ' ' || COALESCE(excerpt, '')));

-- ─────────────────────────────────────────────────────────────────
-- COMMANDES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      VARCHAR(20) UNIQUE NOT NULL,
  user_id           UUID NOT NULL REFERENCES users(id),
  status            order_status NOT NULL DEFAULT 'pending',
  subtotal          NUMERIC(10,2) NOT NULL,
  discount_amount   NUMERIC(10,2) DEFAULT 0,
  total_amount      NUMERIC(10,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'DZD',
  payment_method    payment_method,
  coupon_code       VARCHAR(50),
  notes             TEXT,
  ip_address        INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  video_id    UUID REFERENCES videos(id),
  item_type   VARCHAR(20) NOT NULL CHECK (item_type IN ('product','video','subscription')),
  title       VARCHAR(300) NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  quantity    SMALLINT NOT NULL DEFAULT 1,
  subtotal    NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- PAIEMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  method              payment_method NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  amount              NUMERIC(10,2) NOT NULL,
  currency            VARCHAR(3) NOT NULL DEFAULT 'DZD',
  gateway_reference   VARCHAR(255),
  gateway_response    JSONB,
  satim_order_id      VARCHAR(100),
  baridimob_ref       VARCHAR(100),
  initiated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ─────────────────────────────────────────────────────────────────
-- ABONNEMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  plan            subscription_plan NOT NULL,
  billing_cycle   billing_cycle NOT NULL DEFAULT 'monthly',
  status          subscription_status NOT NULL DEFAULT 'pending',
  amount          NUMERIC(10,2) NOT NULL,
  payment_method  payment_method,
  payment_id      UUID REFERENCES payments(id),
  starts_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  auto_renew      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

-- ─────────────────────────────────────────────────────────────────
-- TÉLÉCHARGEMENTS & ACCÈS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE user_downloads (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  product_id    UUID REFERENCES products(id),
  order_item_id INTEGER REFERENCES order_items(id),
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    INET,
  UNIQUE(user_id, product_id)
);

CREATE TABLE user_video_access (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  video_id    UUID NOT NULL REFERENCES videos(id),
  order_id    UUID REFERENCES orders(id),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watch_time_sec INTEGER DEFAULT 0,
  completed   BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, video_id)
);

-- ─────────────────────────────────────────────────────────────────
-- AVIS & NOTES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  video_id    UUID REFERENCES videos(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_review_target CHECK (
    (product_id IS NOT NULL AND video_id IS NULL) OR
    (video_id IS NOT NULL AND product_id IS NULL)
  )
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_video ON reviews(video_id);

-- ─────────────────────────────────────────────────────────────────
-- FAVORIS (WISHLIST)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE wishlist (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  video_id    UUID REFERENCES videos(id),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id),
  CONSTRAINT chk_wishlist_target CHECK (
    (product_id IS NOT NULL AND video_id IS NULL) OR
    (video_id IS NOT NULL AND product_id IS NULL)
  )
);

-- ─────────────────────────────────────────────────────────────────
-- CODES PROMO
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE coupons (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  description     VARCHAR(200),
  discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses        INTEGER,
  used_count      INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_until)
VALUES ('BIENVENUE20', 'Réduction bienvenue 20%', 'percent', 20, 1000, NOW() + INTERVAL '1 year'),
       ('ETUDIANT50',  'Réduction étudiants 50%', 'percent', 50, 500,  NOW() + INTERVAL '6 months'),
       ('BTS2024',     '200 DZD de réduction BTS','fixed',   200,200,   NOW() + INTERVAL '3 months');

-- ─────────────────────────────────────────────────────────────────
-- NEWSLETTER
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE newsletter_subscribers (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  first_name  VARCHAR(100),
  study_level study_level,
  is_active   BOOLEAN DEFAULT TRUE,
  token       VARCHAR(255),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────
-- CODES PRÉPAYÉS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE prepaid_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(20) UNIQUE NOT NULL,
  amount_dzd  NUMERIC(10,2) NOT NULL,
  plan        subscription_plan NOT NULL DEFAULT 'standard',
  is_used     BOOLEAN DEFAULT FALSE,
  used_by     UUID REFERENCES users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- TRIGGER: updated_at auto
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_products       BEFORE UPDATE ON products       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_videos         BEFORE UPDATE ON videos         FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_articles       BEFORE UPDATE ON articles       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_orders         BEFORE UPDATE ON orders         FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_subscriptions  BEFORE UPDATE ON subscriptions  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- TRIGGER: recalcul rating moyen produit
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL AND NEW.is_approved THEN
    UPDATE products SET
      rating_avg   = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE)
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ─────────────────────────────────────────────────────────────────
-- TRIGGER: numéro de commande automatique
-- ─────────────────────────────────────────────────────────────────
CREATE SEQUENCE order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'HDS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ─────────────────────────────────────────────────────────────────
-- VUE: produits avec infos formateur et catégorie
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_products AS
SELECT
  p.*,
  c.name_fr        AS category_name,
  c.slug           AS category_slug,
  c.icon           AS category_icon,
  i.display_name   AS instructor_name,
  i.institution    AS instructor_institution,
  CASE WHEN p.discount_price IS NOT NULL AND (p.discount_ends_at IS NULL OR p.discount_ends_at > NOW())
       THEN p.discount_price
       ELSE p.price
  END AS effective_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN instructors i ON p.instructor_id = i.id
WHERE p.is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────
-- VUE: statistiques utilisateur
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.subscription_plan,
  COUNT(DISTINCT o.id)   AS total_orders,
  COUNT(DISTINCT ud.product_id) AS total_downloads,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN user_downloads ud ON u.id = ud.user_id
GROUP BY u.id;
