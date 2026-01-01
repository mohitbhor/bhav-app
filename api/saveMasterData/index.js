const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  context.log('Saving master data');

  try {
    const { vegetables, dealers, mandis } = req.body;

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = 'bhav-data';
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists();

    const masterData = {
      vegetables: vegetables || [],
      dealers: dealers || [],
      mandis: mandis || [],
      lastUpdated: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(masterData, null, 2);
    const blobName = 'master/master-data.json';
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(jsonContent, jsonContent.length, {
      blobHTTPHeaders: { blobContentType: 'application/json' }
    });

    context.log('Master data saved successfully');

    context.res = {
      status: 200,
      body: { success: true }
    };
  } catch (error) {
    context.log.error('Error saving master data:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to save master data', details: error.message }
    };
  }
};