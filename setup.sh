#!/bin/bash

# Bhav App Setup Script
# Run this to set up everything automatically

echo "🌱 Setting up Bhav Entry App..."
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Installing..."
    brew install azure-cli
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org"
    exit 1
fi

# Login to Azure
echo "🔐 Logging into Azure..."
az login

# Set variables
RESOURCE_GROUP="bhav-app-rg"
LOCATION="centralus"
STORAGE_ACCOUNT="bhavappstore$(date +%s)"  # Add timestamp to make unique
STATIC_APP="bhav-app"

echo ""
echo "📦 Creating Azure resources..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Storage Account: $STORAGE_ACCOUNT"
echo ""

# Create resource group
echo "1️⃣ Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create storage account
echo "2️⃣ Creating storage account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Get connection string
echo "3️⃣ Getting storage connection string..."
CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv)

echo ""
echo "✅ Connection String: $CONNECTION_STRING"
echo ""
echo "⚠️  IMPORTANT: Save this connection string!"
echo ""

# Create static web app
echo "4️⃣ Creating Static Web App..."
az staticwebapp create \
  --name $STATIC_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

# Get deployment token
echo "5️⃣ Getting deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $STATIC_APP \
  --resource-group $RESOURCE_GROUP \
  --query "properties.apiKey" \
  --output tsv)

echo ""
echo "✅ Deployment Token: $DEPLOYMENT_TOKEN"
echo ""

# Install dependencies
echo "6️⃣ Installing dependencies..."
npm install

cd api/saveEntries
npm init -y
npm install @azure/storage-blob
cd ../getMasterData
npm init -y
npm install @azure/storage-blob
cd ../saveMasterData
npm init -y
npm install @azure/storage-blob
cd ../..

# Build app
echo "7️⃣ Building app..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Find your Static Web App: $STATIC_APP"
echo "3. Go to Settings → Configuration"
echo "4. Add application setting:"
echo "   Name: AZURE_STORAGE_CONNECTION_STRING"
echo "   Value: $CONNECTION_STRING"
echo "5. Go to Custom domains and add: bhav.karmyogifarm.com"
echo "6. In GoDaddy, add CNAME record pointing to your Azure domain"
echo ""
echo "🌐 Your app will be available at: https://bhav.karmyogifarm.com"
echo ""
echo "📖 Read DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""