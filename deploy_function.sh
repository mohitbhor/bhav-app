#!/bin/bash

echo "🚀 Deploying Azure Functions..."

# Variables
RESOURCE_GROUP="bhav-app-rg"
STORAGE_ACCOUNT="bhavappstore1767279272"
FUNCTION_APP_NAME="bhav-api-$(date +%s)"

echo "Creating Function App: $FUNCTION_APP_NAME"

# Get storage connection string
echo "📦 Getting storage connection string..."
CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv)

if [ -z "$CONNECTION_STRING" ]; then
  echo "❌ Failed to get storage connection string"
  exit 1
fi

echo "✅ Got connection string"

# Create Function App with Node 20
echo "🏗️ Creating Function App..."
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --storage-account $STORAGE_ACCOUNT \
  --consumption-plan-location centralus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Linux

# Check if creation succeeded
if [ $? -ne 0 ]; then
  echo "❌ Failed to create Function App"
  exit 1
fi

echo "✅ Function App created successfully"

# Wait a bit for the app to be ready
echo "⏳ Waiting 30 seconds for Function App to be ready..."
sleep 30

# Configure app settings
echo "⚙️ Configuring app settings..."
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings AZURE_STORAGE_CONNECTION_STRING="$CONNECTION_STRING"

if [ $? -ne 0 ]; then
  echo "⚠️ Warning: Failed to set app settings, but continuing..."
fi

# Enable CORS
echo "🌐 Enabling CORS..."
az functionapp cors add \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "https://bhav.karmyogifarm.com" "http://localhost:5173"

if [ $? -ne 0 ]; then
  echo "⚠️ Warning: Failed to set CORS, but continuing..."
fi

# Deploy functions
echo "📤 Deploying functions..."
cd api

# Make sure we have the right dependencies
echo "📦 Installing dependencies..."
npm install

# Check if func command exists
if ! command -v func &> /dev/null; then
  echo "❌ Azure Functions Core Tools not found"
  echo "Install with: brew tap azure/functions && brew install azure-functions-core-tools@4"
  exit 1
fi

# Deploy
echo "🚀 Publishing functions..."
func azure functionapp publish $FUNCTION_APP_NAME --javascript

if [ $? -ne 0 ]; then
  echo "❌ Failed to publish functions"
  exit 1
fi

cd ..

# Get URL
echo "🔍 Getting Function App URL..."
FUNCTION_URL=$(az functionapp show \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)

echo ""
echo "=========================================="
echo "✅ Function App deployed successfully!"
echo "=========================================="
echo ""
echo "📍 Function App URL: https://$FUNCTION_URL"
echo ""
echo "🔧 Next steps:"
echo ""
echo "1. Create/update .env file with:"
echo "   VITE_API_URL=https://$FUNCTION_URL"
echo ""
echo "2. Update src/App.jsx:"
echo "   Replace 'YOUR_FUNCTION_APP_NAME' with: $FUNCTION_APP_NAME"
echo ""
echo "3. Rebuild and deploy:"
echo "   npm run build"
echo "   git add ."
echo "   git commit -m 'Update API endpoints'"
echo "   git push"
echo ""
echo "4. Test your functions:"
echo "   curl https://$FUNCTION_URL/api/getMasterData"
echo ""
echo "=========================================="