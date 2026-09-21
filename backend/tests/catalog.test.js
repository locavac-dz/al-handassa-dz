const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tcat';

describe('catalogue public : recherche, pagination, sitemap', () => {
  let ctx;
  const cleanup = async () => {
    await h.query(`DELETE FROM products WHERE slug LIKE $1`, [`${PFX}-%`]);
    await h.query(`DELETE FROM categories WHERE slug = $1`, [`${PFX}-cat`]);
    await h.query(`DELETE FROM articles WHERE slug LIKE $1`, [`${PFX}-%`]);
    for (const t of ['companies', 'job_offers', 'tenders', 'professionals']) await h.query(`DELETE FROM ${t} WHERE slug LIKE $1`, [`${PFX}-%`]);
  };
  before(async () => { ctx = await h.start(); await cleanup(); });
  after(async () => { await cleanup(); await ctx.stop(); });

  describe('recherche produit', () => {
    let s;
    before(async () => {
      s = async (q) => { const r = await ctx.call('GET', '/api/products/search/query?q=' + encodeURIComponent(q)); return { status: r.status, data: r.json?.data || [] }; };
      const cat = (await h.one(`INSERT INTO categories (slug, name_fr, name_ar) VALUES ($1,'Zzcatégorie','x') RETURNING id`, [`${PFX}-cat`])).id;
      await h.query(`INSERT INTO products (title,slug,type,price,is_active,category_id,tags,description) VALUES
        ('Béton armé zzalpha',$1,'ouvrage',100,TRUE,$5,'{"zztag"}','Cours'),
        ('Remise 100% zzbeta',$2,'ouvrage',100,TRUE,NULL,'{}','x'),
        ('<img src=x onerror=alert(1)> zzgamma',$3,'ouvrage',100,TRUE,NULL,'{}','x'),
        ('Inactif zzdelta',$4,'ouvrage',100,FALSE,NULL,'{}','x')`,
      [`${PFX}-a`, `${PFX}-b`, `${PFX}-c`, `${PFX}-d`, cat]);
    });

    it('trouve par titre (avec la catégorie), par nom de catégorie et par tag', async () => {
      const r = await s('zzalpha');
      assert.equal(r.status, 200);
      assert.equal(r.data.length, 1);
      assert.equal(r.data[0].category_name, 'Zzcatégorie');
      assert.ok((await s('zzcatégorie')).data.some((x) => x.slug === `${PFX}-a`));
      assert.ok((await s('zztag')).data.some((x) => x.slug === `${PFX}-a`));
    });

    it('« % » et « _ » saisis sont littéraux, les produits inactifs sont exclus', async () => {
      const pct = await s('100% zz');
      assert.deepEqual(pct.data.map((x) => x.slug), [`${PFX}-b`]);
      assert.equal((await s('%%')).data.length, 0);
      assert.equal((await s('_')).data.length, 0);
      assert.equal((await s('zzdelta')).data.length, 0);
    });

    it('requêtes vides, très longues ou piégées : 200, jamais 500 (l\'échappement HTML est côté page)', async () => {
      assert.equal((await s('')).status, 200);
      assert.equal((await s('a'.repeat(5000))).status, 200);
      assert.equal((await s('zzgamma')).data.length, 1);
    });
  });

  describe('pagination des listes', () => {
    const LISTS = {
      companies: { path: '/api/companies', def: 24, ins: `INSERT INTO companies (slug,name) SELECT $1||g,'C'||g FROM generate_series(1,130) g` },
      jobs: { path: '/api/jobs', def: 20, ins: `INSERT INTO job_offers (slug,title) SELECT $1||g,'J'||g FROM generate_series(1,130) g` },
      tenders: { path: '/api/tenders', def: 20, ins: `INSERT INTO tenders (slug,title) SELECT $1||g,'T'||g FROM generate_series(1,130) g` },
      professionals: { path: '/api/professionals', def: 24, ins: `INSERT INTO professionals (slug,first_name,last_name) SELECT $1||g,'P'||g,'X' FROM generate_series(1,130) g` },
    };
    for (const [name, t] of Object.entries(LISTS)) {
      it(`${name} : plafond à 100, valeurs par défaut, entrées invalides tolérées`, async () => {
        await h.query(t.ins, [`${PFX}-`]);
        const get = async (qs) => { const r = await ctx.call('GET', t.path + qs); return { status: r.status, j: r.json }; };
        let r = await get('?limit=1000000');
        assert.equal(r.status, 200);
        assert.equal(r.j.data.length, 100);
        assert.equal(r.j.limit, 100);
        assert.equal((await get('')).j.data.length, t.def);
        r = await get('?limit=abc&page=xyz');
        assert.equal(r.status, 200);
        assert.equal(r.j.page, 1);
        r = await get('?limit=-5&page=-3');
        assert.equal(r.status, 200);
        assert.equal(r.j.data.length, 1);
        assert.equal((await get('?limit=0')).j.data.length, 1);
        const p1 = await get('?limit=50&page=1'), p2 = await get('?limit=50&page=2');
        const ids1 = new Set(p1.j.data.map((x) => x.id));
        assert.ok(p2.j.data.length === 50 && p2.j.data.every((x) => !ids1.has(x.id)), 'page 2 distincte de la page 1');
        assert.equal((await get('?limit=50&page=99999999999')).j.data.length, 0);
        assert.equal((await get('?limit=10&limit=20')).status, 200);
      });
    }
  });

  describe('sitemap dynamique', () => {
    it('/sitemap.xml et /api/sitemap.xml : contenu actif seulement, URL valides, domaine SITE_URL', async () => {
      await h.query(`INSERT INTO products (title,slug,type,price,is_active) VALUES ('a',$1,'ouvrage',1,TRUE),('b',$2,'ouvrage',1,FALSE),('c',$3,'ouvrage',1,TRUE)`,
        [`${PFX}-sm-actif`, `${PFX}-sm-inactif`, `${PFX}-sm-a&b`]);
      await h.query(`INSERT INTO articles (title,slug,content,is_published,status) VALUES ('x',$1,'x',TRUE,'published'),('y',$2,'x',FALSE,'draft')`,
        [`${PFX}-sm-pub`, `${PFX}-sm-brouillon`]);
      await h.query(`INSERT INTO companies (slug,name,is_active) VALUES ($1,'C',TRUE),($2,'C2',FALSE)`, [`${PFX}-sm-co`, `${PFX}-sm-co-off`]);
      for (const url of ['/sitemap.xml', '/api/sitemap.xml']) {
        const r = await ctx.call('GET', url);
        assert.equal(r.status, 200, url);
        assert.match(r.headers.get('content-type'), /xml/);
        const x = r.text;
        assert.ok(x.includes(`product.html?slug=${PFX}-sm-actif`) && !x.includes(`${PFX}-sm-inactif`));
        assert.ok(x.includes(`${PFX}-sm-a%26b`) && !x.includes('a&b<'), 'le « & » d\'un slug est encodé');
        assert.ok(x.includes(`article.html?slug=${PFX}-sm-pub`) && !x.includes(`${PFX}-sm-brouillon`));
        assert.ok(x.includes(`entreprise.html?slug=${PFX}-sm-co<`) && !x.includes(`${PFX}-sm-co-off`));
        assert.ok(x.includes('/annuaire.html') && !x.includes('login.html') && !x.includes('localhost'));
        assert.ok(x.includes('<loc>https://handassi.test/</loc>'), 'domaine = SITE_URL');
      }
    });
  });
});
