# 🌱 Add Test Products to Your Live Database

Your site is live but empty! Let's add 10 realistic test products in 2 minutes.

---

## **Option 1: Via Railway Console (Easiest - 2 min)**

### Step 1: Open Railway Console
1. Go to: https://railway.app/dashboard
2. Click your project: **al-handassa-dz**
3. Click **"Plugin"** or **"Variables"** tab
4. Find **PostgreSQL** → Click it
5. Click **"Connect"** or **"Query"** button
6. You're in the database console

### Step 2: Run the Seed Script
```bash
# In Railway console, run:
npm install
node backend/seed-test-products.js
```

### Step 3: Verify
Navigate to your site and refresh:
```
https://your-railway-url.railway.app
```

You should now see **10 products** in the catalog! ✅

---

## **Option 2: Via SSH (If Console Unavailable)**

### Step 1: Connect via SSH
```bash
# Railway will give you SSH command
ssh -i key.pem user@your-railway-host
```

### Step 2: Run Seed
```bash
cd /app
node backend/seed-test-products.js
```

---

## **Option 3: Direct Database Query (Advanced)**

If you have PostgreSQL client installed:

```bash
# Get DATABASE_URL from Railway
# Then:
PGPASSWORD=your_password psql -h host -U user -d database < seed-test-products.js
```

---

## **10 Test Products Added**

Your database will include:

### **Courses (Cours PDF)**
1. ✅ Cours Béton Armé - 2,500 DA - ⭐ 4.8
2. ✅ Calcul Structures FEM - 3,500 DA - ⭐ 4.6
3. ✅ Topographie & Géodésie - 2,000 DA - ⭐ 4.7

### **Exercises (TD/TP)**
4. ✅ TD Béton Armés (10 Exercices) - 1,500 DA - ⭐ 4.5
5. ✅ TP Essais Géotechniques - 1,800 DA - ⭐ 4.4

### **Standards (Normes)**
6. ✅ DTR BC 2.2 - 3,000 DA - ⭐ 4.9
7. ✅ DTR C 2.41 CVC - 2,500 DA - ⭐ 4.6

### **Tutorials (Tutoriels)**
8. ✅ AutoCAD 2024 Complet - 1,200 DA - ⭐ 4.7
9. ✅ Revit Architecture - 2,200 DA - ⭐ 4.8
10. ✅ ETABS Sismique - 2,800 DA - ⭐ 4.9

### **Packs**
11. ✅ Pack Licence Complet - 12,000 DA - ⭐ 4.9
12. ✅ Pack Master Structures - 18,000 DA - ⭐ 4.95

---

## **What You Get**

✅ **10-12 realistic products**
✅ **Multiple categories** (Béton, Structures, Topographie, CAO, etc.)
✅ **Real pricing** (1,200 - 18,000 DA)
✅ **Star ratings** (4.4 - 4.95 ⭐)
✅ **Realistic descriptions**
✅ **Instructor names**
✅ **Study levels** (Licence, Master, Ingénieur)

---

## **After Adding Products**

Your site will now have:

1. ✅ **Products visible** on homepage
2. ✅ **Search working** (try searching "béton")
3. ✅ **Filters functional** (by price, category, rating)
4. ✅ **Add to cart** buttons work
5. ✅ **Checkout** ready to test
6. ✅ **Recommendations** populated

---

## **Test Purchases** (Optional)

To fully test your e-commerce:

1. Go to your site
2. Click any product
3. Click **"Add to Cart"**
4. Go to **Cart**
5. Click **"Checkout"**
6. Fill form & test payment
7. (Payment will redirect to SATIM if configured)

---

## **Next Steps**

1. ✅ Add test products (this guide)
2. 🔜 Configure real payment gateway (SATIM)
3. 🔜 Set up email notifications
4. 🔜 Create admin accounts
5. 🔜 Start marketing

---

## **Troubleshooting**

**Products not showing after running script?**
- Clear browser cache (Ctrl+Shift+Delete)
- Reload page
- Check Railway logs for errors

**Script fails with "database connection error"?**
- Verify PostgreSQL plugin is added in Railway
- Check DATABASE_URL in variables
- Ensure 4 environment variables are set

**Still stuck?**
- Check Railway logs: Project → Logs tab
- Verify database is running
- Re-run the seed script

---

**Ready to add products?** Follow Option 1 above (easiest)! 🚀

Your site will be fully functional in 2 minutes! ✨
