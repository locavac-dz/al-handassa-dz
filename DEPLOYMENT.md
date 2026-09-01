# 🚀 Al Handassa.dz — Deployment Guide

Choose your platform below. All configurations are pre-configured and ready to go.

---

## **Option 1: Railway (⭐ RECOMMENDED - Easiest)**

Railway is the easiest. No credit card required for first $5/month.

### Steps:

1. **Go to Railway.app**
   ```
   https://railway.app
   ```

2. **Create Project → Deploy from GitHub**
   - Connect GitHub account
   - Select: `locavac-dz/al-handassa-dz`
   - Railway auto-detects Dockerfile

3. **Add PostgreSQL Plugin**
   - Click "Add Plugin" → Select "PostgreSQL 15"
   - Railway auto-sets `DATABASE_URL`

4. **Configure Environment Variables**
   - `JWT_SECRET`: `your-secret-key-here`
   - `SATIM_MERCHANT_ID`: (leave empty if not ready)
   - `SATIM_MERCHANT_KEY`: (leave empty if not ready)
   - `SMTP_USER`: `your-gmail@gmail.com`
   - `SMTP_PASS`: `your-16-char-app-password`
   - `FRONTEND_URL`: `https://your-domain.railway.app`

5. **Deploy**
   - Railway auto-deploys on git push
   - Takes ~2-3 minutes

6. **Custom Domain** (optional)
   - Add in Railway dashboard
   - $2/month or use free `.railway.app` subdomain

**Cost**: ~$5/month (PostgreSQL) + ~$5/month (compute)

---

## **Option 2: Vercel + Railway (Fast & Modern)**

Vercel for frontend, Railway for backend.

### Frontend on Vercel:

1. **Go to Vercel.app**
   ```
   https://vercel.app
   ```

2. **Import Project**
   - Connect GitHub
   - Select repository
   - Vercel auto-detects `vercel.json`

3. **Configure**
   - Set `API_URL` → Your Railway API endpoint
   - Deploy

### Backend on Railway:

See "Option 1" above, but:
- Only deploy `backend/` folder
- In Railway: set "Root Directory" to `backend`

**Cost**: ~$0 (Vercel free tier) + ~$5/month (Railway)

---

## **Option 3: Heroku (Simple but slower)**

Heroku is simple but slower (sleeps after 30 mins of inactivity).

### Steps:

1. **Create `Procfile`**
   ```
   web: npm run start
   ```

2. **Connect to Heroku CLI**
   ```bash
   heroku login
   heroku create al-handassa-dz
   git push heroku main
   ```

3. **Add Database**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET="your-secret"
   heroku config:set SMTP_USER="your-gmail"
   heroku config:set SMTP_PASS="app-password"
   ```

**Cost**: ~$7-9/month (with Postgres)

---

## **Option 4: Docker (Self-Hosted)**

Deploy on your own server (DigitalOcean, AWS, VPS, etc.)

### Build Docker Image:

```bash
docker build -t al-handassa:latest .
```

### Run Container:

```bash
docker run -p 3000:3000 -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  -e SMTP_USER="your-email" \
  -e SMTP_PASS="app-password" \
  al-handassa:latest
```

### Using Docker Compose:

1. **Create `docker-compose.yml`**:
   ```yaml
   version: '3.8'
   services:
     db:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: handassi_db
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data

     app:
       build: .
       ports:
         - "3000:3000"
         - "5000:5000"
       environment:
         DATABASE_URL: "postgresql://postgres:postgres@db:5432/handassi_db"
         NODE_ENV: production
         JWT_SECRET: ${JWT_SECRET}
         SMTP_USER: ${SMTP_USER}
         SMTP_PASS: ${SMTP_PASS}
       depends_on:
         - db

   volumes:
     postgres_data:
   ```

2. **Deploy**:
   ```bash
   docker-compose up -d
   ```

3. **Run Migrations**:
   ```bash
   docker exec <container> npm run migrate
   ```

**Cost**: ~$5-20/month depending on server

---

## **Pre-Deployment Checklist**

- [ ] Database created (PostgreSQL 13+)
- [ ] JWT_SECRET set (strong random string)
- [ ] SMTP credentials configured (Gmail app password)
- [ ] SATIM merchant ID & key (if using payments)
- [ ] .env file configured locally
- [ ] All migrations run (`npm run migrate`)
- [ ] Admin account created
- [ ] Tests passing (`npm test`)
- [ ] Build successful (`npm run build`)

---

## **Environment Variables (Production)**

```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# SATIM (Optional)
SATIM_MERCHANT_ID=your-merchant-id
SATIM_MERCHANT_KEY=your-merchant-key
SATIM_API_ENDPOINT=https://payment.satim.dz/api/payment

# Admin
ADMIN_EMAIL=admin@alhandassa.dz
ADMIN_PASSWORD=strong-password-here
```

---

## **Post-Deployment**

### 1. Verify Deployment

```bash
# Check frontend
curl https://your-domain.com

# Check API
curl https://your-domain.com/api/products

# Check health
curl https://your-domain.com/health
```

### 2. Create Admin Account

```bash
node backend/reset-admin-password.js
```

### 3. Test Payment Gateway

- Go to `/checkout.html`
- Complete test payment with SATIM (if configured)
- Verify success page displays

### 4. Test Email

```bash
node backend/test-email.js
```

### 5. Monitor Logs

**Railway**:
```
Dashboard → Logs tab
```

**Vercel**:
```
Dashboard → Deployments → Logs
```

**Docker**:
```bash
docker logs <container-id>
```

---

## **Troubleshooting**

### Build Fails
```
Check logs for missing dependencies
npm install
npm run build
```

### Database Connection Error
```
Verify DATABASE_URL is correct
Check PostgreSQL is running
Run migrations: npm run migrate
```

### Static Files Not Loading
```
Check FRONTEND_URL in .env
Verify public/ folder exists
Check web server static config
```

### API Calls 404
```
Check BACKEND_URL/API_URL config
Verify backend is running on correct port
Check CORS headers in app.js
```

---

## **Performance Tips**

1. **Enable Caching**
   ```javascript
   // In production
   app.use(express.static('public', {
     maxAge: '1d',
     etag: false
   }));
   ```

2. **Use CDN** (Cloudflare free tier)
   - Point DNS to Cloudflare
   - Enable "Auto Minify" for CSS/JS
   - Cache static assets aggressively

3. **Database Optimization**
   - Add indexes on frequently searched columns
   - Connection pooling (enabled in Railway/Heroku)

4. **Monitoring**
   - Set up uptime monitoring (UptimeRobot free)
   - Email alerts for downtime
   - Monitor database size

---

## **Rollback Procedure**

If something breaks:

**Railway/Vercel**:
```
Dashboard → Deployments → Select previous version → Redeploy
```

**Heroku**:
```bash
heroku releases
heroku rollback v3  # Rollback to version 3
```

**Docker**:
```bash
git revert <commit-hash>
docker build -t al-handassa:latest .
docker-compose restart
```

---

## **Getting Help**

- **Railway Support**: railway.app/support
- **Vercel Support**: vercel.com/support
- **Heroku Support**: help.heroku.com
- **Docker Help**: docs.docker.com
- **Our Repo**: github.com/locavac-dz/al-handassa-dz/issues

---

**Recommended**: Start with **Railway** (easiest, ~$10/month, includes Postgres)

Ready to deploy? Let me know which platform you choose! 🚀
