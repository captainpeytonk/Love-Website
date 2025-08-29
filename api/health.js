module.exports = async function handler(req, res) {
    try {
        console.log('Health check requested');
        
        // Test basique de l'environnement
        const envInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            env: process.env.NODE_ENV || 'development',
            hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
            tokenLength: process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0
        };

        // Test de connexion à Vercel Blob
        let blobStatus = 'not_tested';
        try {
            const { list } = await import('@vercel/blob');
            const blobs = await list();
            blobStatus = 'working';
            console.log('Blob test successful, found', blobs.blobs.length, 'blobs');
        } catch (blobError) {
            blobStatus = 'failed';
            console.error('Blob test failed:', blobError.message);
        }

        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: envInfo,
            blobStatus: blobStatus,
            message: 'API is working'
        });
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
