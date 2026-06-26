# Social Mitra - Deployment Guide

## Why You Got 404 Error

The OAuth callback at `/api/oauth/callback` requires the **backend server** to be running. Static hosting (like the `kimi.page` deployment) only serves HTML/CSS/JS files - it cannot run the Node.js backend.

**Architecture:**
```
Frontend (React)  -->  Backend (Hono/Node.js)  -->  Database (MySQL)
     |                       |
  Static files           Runs OAuth API
  dist/public/           /api/oauth/callback
                         /api/trpc/*
```

**Solution:** Deploy to a platform that runs Node.js (Railway, Render, etc.)

---

## Option 1: Railway (Recommended - FREE Tier)

### Step 1: Push Code to GitHub
```bash
cd /mnt/agents/output/app
git init
git add .
git commit -m "Social Mitra platform ready for deployment"
# Create a GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/social-mitra.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to **https://railway.app** and login with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `social-mitra` repository
4. Railway auto-detects Node.js and installs dependencies
5. The `railway.json` file tells it to run `npm start`

### Step 3: Add Environment Variables
In Railway dashboard, go to your project → **Variables** tab, add these:

```env
APP_ID=19eee51b-4d62-8ec6-8000-0000a09e5d62
APP_SECRET=qAC5iI6DcPwOx9pl1n8iRQahY47s6hrZ
DATABASE_URL=mysql://29egRL4WFCnkacK.root:O4C92vxcT1TFARBEULySO68TIVFO15U6@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19eee50e-c6c2-8d3c-8000-09ebd707d301
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
OWNER_UNION_ID=d8qd460c86sdei1nv6vg
VITE_APP_ID=19eee51b-4d62-8ec6-8000-0000a09e5d62
VITE_KIMI_AUTH_URL=https://auth.kimi.com
```

### Step 4: Deploy
Click **"Deploy"** in Railway. Wait 2-3 minutes.

You'll get a URL like: `https://social-mitra-production.up.railway.app`

### Step 5: Update Kimi OAuth Callback
In your Kimi app settings, set the callback URL to:
```
https://YOUR_RAILWAY_URL/api/oauth/callback
```

---

## Option 2: Render (FREE Tier)

### Step 1: Push to GitHub
(Same as above)

### Step 2: Create Web Service on Render
1. Go to **https://render.com** → **"New Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name:** social-mitra
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add all environment variables (same as Railway above)
5. Click **"Create Web Service"**

Your URL will be: `https://social-mitra.onrender.com`

---

## Option 3: Run Locally (For Testing)

```bash
cd /mnt/agents/output/app
npm install
npm run build
npm start
```

Then open **http://localhost:3000** in your browser.

For OAuth to work locally, you need to update the Kimi app callback URL to:
```
http://localhost:3000/api/oauth/callback
```

---

## After Deployment - Access URLs

| Page | URL |
|------|-----|
| Homepage | `https://YOUR_URL/` |
| Login | `https://YOUR_URL/login` |
| Role Selection | `https://YOUR_URL/onboarding` |
| Creator Signup | `https://YOUR_URL/onboarding/influencer` |
| Brand Signup | `https://YOUR_URL/onboarding/brand` |
| Creator Dashboard | `https://YOUR_URL/influencer/dashboard` |
| Brand Dashboard | `https://YOUR_URL/brand/dashboard` |
| Admin Dashboard | `https://YOUR_URL/admin/dashboard` |

**All URLs will work because the backend server handles routing!**

---

## How to Make Someone Admin

After they sign up, run this database query:
```sql
UPDATE users SET role = 'admin' WHERE email = 'their-email@example.com';
```

Or use the admin dashboard if you already have admin access.
