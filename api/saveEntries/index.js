const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  context.log('Saving price entries');

  try {
    const { entries } = req.body;

    if (!entries || entries.length === 0) {
      context.res = {
        status: 400,
        body: { error: 'No entries provided' }
      };
      return;
    }

    // Get connection string from environment variable
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = 'bhav-data';
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists();

    // Group entries by mandi and date for CSV filename
    const firstEntry = entries[0];
    const date = firstEntry.date.replace(/-/g, '');
    const mandi = firstEntry.mandi.replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create CSV content
    const csvHeaders = 'Date,Timestamp,Mandi,Dealer,Vegetable,Price,Unit,Quality,Latitude,Longitude,Notes\n';
    const csvRows = entries.map(entry => {
      return [
        entry.date,
        entry.timestamp,
        entry.mandi,
        entry.dealer,
        entry.vegetable,
        entry.price,
        entry.unit,
        entry.quality,
        entry.location?.lat || '',
        entry.location?.lng || '',
        `"${(entry.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvRows;

    // Upload to blob storage
    const blobName = `entries/${mandi}_${date}_${timestamp}.csv`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(csvContent, csvContent.length, {
      blobHTTPHeaders: { blobContentType: 'text/csv' }
    });

    context.log(`Saved ${entries.length} entries to ${blobName}`);

    context.res = {
      status: 200,
      body: {
        success: true,
        entriesCount: entries.length,
        filename: blobName
      }
    };
  } catch (error) {
    context.log.error('Error saving entries:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to save entries', details: error.message }
    };
  }
};