const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  context.log('Getting master data');

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = 'bhav-data';
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists();

    const blobName = 'master/master-data.json';
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Try to download existing master data
    try {
      const downloadResponse = await blockBlobClient.download(0);
      const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
      const masterData = JSON.parse(downloaded.toString());
      
      context.res = {
        status: 200,
        body: masterData
      };
    } catch (error) {
      // If file doesn't exist, return defaults
      context.log('Master data not found, returning defaults');
      context.res = {
        status: 200,
        body: {
          vegetables: [],
          dealers: [],
          mandis: []
        }
      };
    }
  } catch (error) {
    context.log.error('Error getting master data:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to get master data', details: error.message }
    };
  }
};

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}