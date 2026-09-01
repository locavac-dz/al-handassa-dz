# 🚂 Railway Deployment — Step-by-Step Guide

**Total Setup Time: 5-10 minutes**

---

## **STEP 1: Create Railway Account**

1. Go to: **https://railway.app**
2. Click **"Start Free"**
3. Sign in with **GitHub** (use: locavac-dz)
4. ✅ Accept permissions

---

## **STEP 2: Create New Project**

1. Click **"New Project"**
2. Select **"Deploy from GitHub"**
3. Search: **`al-handassa-dz`**
4. Click **Select Repository**
5. ✅ Authorize Railway to access your repo

---

## **STEP 3: Add Database**

Railway will auto-detect Dockerfile and PostgreSQL needs.

1. Click **"Add Plugin"**
2. Search: **"PostgreSQL"**
3. Click **PostgreSQL 15**
4. ✅ Database created automatically

---

## **STEP 4: Configure Environment Variables**

Click **"Variables"** tab and set these 4 values:

### **Critical Variables:**

```
JWT_SECRET
───────────────────────────────────────
Value: your-super-secret-key-minimum-32-characters-long-ok
(Make it random and long)

Example: a7f8d2k9j5x3n8m2q1w9e5r3t2y8u0i7p4o9l2k3j

(Or use: openssl rand -base64 32)
```

```
SMTP_USER
───────────────────────────────────────
Value: your-email@gmail.com
```

```
SMTP_PASS
───────────────────────────────────────
Value: xxxx xxxx xxxx xxxx
(Your 16-char Gmail app password)
```

```
NODE_ENV
───────────────────────────────────────
Value: production
```

### **Optional (for later):**

```
SATIM_MERCHANT_ID = (leave blank for now)
SATIM_MERCHANT_KEY = (leave blank for now)
```

---

## **STEP 5: Deploy**

1. Click **"Deploy"** button
2. Watch the build progress (takes ~2-3 minutes)
3. When complete, you'll see: ✅ **"Running"**

---

## **STEP 6: Get Your URL**

In Railway dashboard:

1. Click **"Settings"** tab
2. Copy **"Public URL"** (something like: `al-handassa-dz-production.railway.app`)
3. This is your live site! 🚀

---

## **STEP 7: Verify It Works**

Test in browser:

```
https://your-railway-url.railway.app
```

You should see:
✅ Homepage loads
✅ Products visible (if DB migrated)
✅ Search works
✅ Cart/Wishlist buttons work

---

## **STEP 8: First Time Setup**

### **Create Admin Account:**

You have 2 options:

**Option A: Via Terminal (Recommended)**
```bash
# In your local terminal, run:
node backend/reset-admin-password.js

# Follow prompts to create admin user
```

**Option B: Via Railway Console**
```
Railway Dashboard → Settings → "Command"
Run: node backend/reset-admin-password.js
```

### **Initialize Database:**

Run migrations:
```bash
# Railway console or local terminal:
npm run migrate
```

---

## **STEP 9: Custom Domain (Optional)**

Want `al-handassa.dz` instead of `.railway.app`?

### **Add Custom Domain:**

1. Railway Dashboard → **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `al-handassa.dz`
5. Copy DNS records
6. Go to your domain registrar (GoDaddy, Namecheap, etc.)
7. Add DNS records
8. Wait 24 hours for propagation

**Cost**: $2/month extra (or use free `.railway.app` subdomain)

---

## **STEP 10: Enable Auto-Deploy**

Railway auto-deploys on git push. Make sure:

1. GitHub → locavac-dz/al-handassa-dz
2. Push a change to `master` branch
3. Railway automatically rebuilds and deploys ✅

---

## **📧 Gmail App Password Setup** (5 min)

If you don't have a Gmail app password:

1. Go to: **myaccount.google.com**
2. Click **"Security"** (left menu)
3. Enable **"2-Step Verification"** (if not done)
4. Go to **"App passwords"** (myaccount.google.com/apppasswords)
5. Select: **App**: Mail, **Device**: Windows Computer
6. Click **"Generate"**
7. Copy the **16-character password** (spaces included)
8. Use in Railway `SMTP_PASS` variable

---

## **✅ Final Checklist**

- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] PostgreSQL plugin added
- [ ] 4 environment variables set
- [ ] Build successful (showing "Running")
- [ ] Public URL working
- [ ] Homepage loads
- [ ] Admin account created
- [ ] Migrations run
- [ ] Email test successful (optional)

---

## **🚨 Troubleshooting**

### **Build Fails**
```
Railway → Logs tab → Read error message
Usually: Missing dependency or syntax error
Fix: Run locally, test, push again
```

### **Database Connection Error**
```
Variable DATABASE_URL auto-created by Railway
If missing: Add PostgreSQL plugin again
```

### **Static Files Not Loading (404)**
```
Check: FRONTEND_URL matches your Railway URL
If wrong: Update in variables
```

### **Emails Not Sending**
```
1. Verify SMTP_USER and SMTP_PASS are correct
2. Check Gmail app password is 16 chars
3. Verify SMTP_HOST = smtp.gmail.com
4. Run test: node backend/test-email.js
```

### **Deploy Stuck**
```
Click: Settings → "Reset Deploy"
Or push a new commit to trigger rebuild
```

---

## **📊 Monitoring & Logs**

View application logs:

1. Railway Dashboard
2. Click your project
3. **"Logs"** tab
4. Watch real-time logs
5. Set up alerts (optional)

---

## **🎉 Success Indicators**

Your deployment is successful when:

✅ Build status: **"Running"** (green)
✅ URL accessible without 502/503 errors
✅ Homepage renders properly
✅ API endpoints respond (test: `/api/products`)
✅ Search functionality works
✅ Cart/wishlist saves to localStorage
✅ Forms submit without errors

---

## **💰 Cost Breakdown**

```
PostgreSQL Database:  $7/month
Web Service (Compute): $5/month (generous tier)
Custom Domain:        $2/month (optional)
─────────────────────────────────
TOTAL:               ~$12-14/month
```

Free tier only: $0, but with limitations

---

## **Next: What To Do After Deploy**

1. ✅ Share your URL with team
2. ✅ Create test user account
3. ✅ Test payment flow (if SATIM set up)
4. ✅ Monitor performance
5. ✅ Set up email alerts

---

## **Quick Links**

- **Railway Dashboard**: https://railway.app/dashboard
- **Your Repository**: https://github.com/locavac-dz/al-handassa-dz
- **API Docs**: https://github.com/locavac-dz/al-handassa-dz/blob/master/API_DOCS.md
- **Deployment Guide**: https://github.com/locavac-dz/al-handassa-dz/blob/master/DEPLOYMENT.md

---

## **Getting Help**

- **Railway Support**: https://railway.app/support
- **Discord Community**: https://discord.gg/railway
- **Our Repo Issues**: https://github.com/locavac-dz/al-handassa-dz/issues

---

**Ready? Start at:** https://railway.app 🚀

**Expected Result**: Live site in 5 minutes! ✨
