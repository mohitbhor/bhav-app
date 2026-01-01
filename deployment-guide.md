# Bhav Entry App - Complete Deployment Guide

## 📋 Prerequisites

Before starting, make sure you have:
- Azure account (free tier works)
- Node.js installed (download from nodejs.org)
- GoDaddy account with domain (karmyogifarm.com)
- Basic command line knowledge

---

## 🗂️ Step 1: Set Up Project Structure

### 1.1 Create the project folder

Open Terminal on your Mac and run:

```bash
# Create main project folder
mkdir ~/bhav-app
cd ~/bhav-app

# Create subfolders
mkdir -p src api/saveEntries api/getMasterData api/saveMasterData public
```

### 1.2 Copy all the files

Copy these files into your project:

```
bhav-app/
├── package.json                  (File 1)
├── vite.config.js               (File 8)
├── staticwebapp.config.json     (File 9)
├── public/
│   └── index.html               (File 2)
├── src/
│   ├── main.jsx                 (File 3)
│   └── App.jsx                  (File 4)
└── api/
    ├── saveEntries/
    │   └── index.js             (File 5)
    ├── getMasterData/
    │   └── index.js             (File 6)
    └── saveMasterData/
        └── index.js             (File 7)
```

### 1.3 Install dependencies

```bash
# Install frontend dependencies
npm install

# Install Azure Function dependencies
cd api/saveEntries
npm init -y
npm install @azure/storage-blob
cd ../..
```

---

## ☁️ Step 2: Create Azure Resources

### 2.1 Login to Azure

```bash
az login
```

This will open your browser - login with your Azure account.

### 2.2 Create a Resource Group

```bash
az group create \
  --name bhav-app-rg \
  --location centralindia
```

### 2.3 Create Storage Account

```bash
az storage account create \
  --name bhavappstore \
  --resource-group bhav-app-rg \
  --location centralindia \
  --sku Standard_LRS
```

### 2.4 Get Storage Connection String

```bash
az storage account show-connection-string \
  --name bhavappstore \
  --resource-group bhav-app-rg \
  --output tsv
```

**IMPORTANT:** Copy this connection string! You'll need it later.

### 2.5 Create Static Web App

```bash
az staticwebapp create \
  --name bhav-app \
  --resource-group bhav-app-rg \
  --location centralindia \
  --sku Free
```

---

## 🚀 Step 3: Deploy the App

### 3.1 Build the frontend

```bash
cd ~/bhav-app
npm run build
```

### 3.2 Get deployment token

```bash
az staticwebapp secrets list \
  --name bhav-app \
  --resource-group bhav-app-rg \
  --query "properties.apiKey" \
  --output tsv
```

Copy this token!

### 3.3 Deploy using GitHub (Recommended)

1. Go to https://github.com and create a new repository called "bhav-app"
2. In your Terminal:

```bash
cd ~/bhav-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bhav-app.git
git push -u origin main
```

3. Go to Azure Portal → Your Static Web App → Settings → Configuration
4. Click "Manage deployment token" → Copy the token
5. Go to your GitHub repo → Settings → Secrets → New repository secret
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Paste the token
6. Azure will automatically build and deploy!

### 3.4 Or deploy manually

```bash
npm install -g @azure/static-web-apps-cli
swa deploy ./dist \
  --api-location ./api \
  --deployment-token YOUR_DEPLOYMENT_TOKEN_HERE
```

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Add Storage Connection String

1. Go to Azure Portal
2. Open your Static Web App: **bhav-app**
3. Click **Settings → Configuration**
4. Click **+ Add**
5. Add:
   - **Name**: `AZURE_STORAGE_CONNECTION_STRING`
   - **Value**: Paste the connection string from Step 2.4
6. Click **Save**

---

## 🌐 Step 5: Configure Custom Domain

### 5.1 In Azure Portal

1. Go to your Static Web App: **bhav-app**
2. Click **Settings → Custom domains**
3. Click **+ Add**
4. Enter: `bhav.karmyogifarm.com`
5. Select **CNAME** record type
6. Azure will show you a CNAME value like: `abc123.azurestaticapps.net`

### 5.2 In GoDaddy

1. Login to GoDaddy
2. Go to **My Products → Domains → karmyogifarm.com → DNS**
3. Click **Add** → Select **CNAME**
4. Fill in:
   - **Name**: `bhav`
   - **Value**: The CNAME value from Azure (e.g., `abc123.azurestaticapps.net`)
   - **TTL**: 1 Hour
5. Click **Save**

### 5.3 Wait and Verify

- Wait 10-60 minutes for DNS propagation
- Go back to Azure Portal → Custom domains
- Click **Validate** next to your domain
- Once validated, Azure will provision SSL certificate automatically

---

## ✅ Step 6: Test Your App

1. Open: `https://bhav.karmyogifarm.com`
2. Try the flow:
   - Select date and mandi
   - Select dealer
   - Add vegetables with prices
   - Click "Finish & Save All"
3. Check if data is saved in Azure Storage:
   - Azure Portal → Storage Account → Containers → bhav-data → entries/

---

## 📊 Step 7: View Your Data

### 7.1 Access CSV files

1. Azure Portal → Storage Account: **bhavappstore**
2. Click **Containers → bhav-data → entries/**
3. You'll see CSV files like: `Azadpur_20250101_2025-01-01T10-30-00.csv`
4. Click any file → Download

### 7.2 Master data (vegetables, dealers, mandis)

1. Same location → **master/** folder
2. File: `master-data.json`
3. This contains all your custom vegetables, dealers, and mandis

---

## 🔄 How Data Persistence Works

### When you add new items:

**Vegetables:**
- Added to the app → Saved to `master/master-data.json` in Azure Storage
- Next day when you open the app, it loads from this file
- All team members see the same vegetables

**Dealers:**
- Same as vegetables - saved to master data
- Persists across sessions

**Mandis:**
- Same persistence model

**Price Entries:**
- Saved as CSV files in `entries/` folder
- One CSV per session with format: `MandiName_Date_Timestamp.csv`
- Never deleted automatically
- You can download and analyze anytime

---

## 💰 Cost Breakdown

### Azure Resources:
- **Static Web App**: Free tier (perfect for your needs)
- **Storage Account**: ~₹0.50/month (first 5GB free)
- **Bandwidth**: ~₹0.20/month (minimal usage)

**Total: ~₹0.70/month (~$0.01/month)**

---

## 🛠️ Troubleshooting

### App not loading?
```bash
# Check deployment status
az staticwebapp show \
  --name bhav-app \
  --resource-group bhav-app-rg
```

### API not working?
1. Azure Portal → Static Web App → Functions
2. Check if functions are listed
3. Click on a function → Monitor → See error logs

### Domain not working?
```bash
# Check DNS propagation
nslookup bhav.karmyogifarm.com
```

Should show CNAME pointing to Azure.

### Storage not saving?
1. Check environment variables in Azure Portal
2. Verify connection string is correct
3. Check Storage Account → Monitoring → Insights for errors

---

## 📱 Using the App

### Daily workflow:
1. Open `https://bhav.karmyogifarm.com` on phone
2. Select today's date
3. Choose mandi (e.g., Azadpur)
4. Choose dealer
5. Add all vegetables you bought from that dealer
6. Click "Next Dealer" to move to next dealer
7. Or "Next Mandi" to change mandi
8. Click "Finish & Save All" when done
9. Data automatically saved to Azure!

---

## 🔮 Next Steps (Optional)

### Add admin dashboard:
- Create separate page to view all entries
- Filter by date, mandi, vegetable
- Export to Excel
- Show price trends with charts

### Add authentication:
- Require login to use the app
- Track who entered which data

### Add mobile app:
- Convert to Progressive Web App (PWA)
- Install on phone home screen
- Works offline

---

## 📞 Need Help?

If you get stuck:
1. Check Azure Portal logs
2. Look at browser console (F12)
3. Verify all files are in correct locations
4. Make sure environment variables are set

---

## ✨ Summary

You now have:
✅ React web app for price entry
✅ Azure Functions backend
✅ CSV storage in Azure Data Lake
✅ Custom domain: bhav.karmyogifarm.com
✅ SSL certificate (secure HTTPS)
✅ Persistent master data (vegetables/dealers/mandis)
✅ Geolocation and timestamp tracking
✅ Mobile-friendly interface
✅ Cost: Less than ₹1/month!

Your team can now enter mandi prices daily, and you'll have years of data to analyze price trends! 🎉