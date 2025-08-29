module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Checking Vercel Blob configuration...');
        
        // Vérifier les variables d'environnement
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        const hasToken = !!blobToken;
        const tokenLength = blobToken ? blobToken.length : 0;
        const tokenPrefix = blobToken ? blobToken.substring(0, 10) + '...' : 'none';
        
        console.log('Environment check:', {
            hasToken,
            tokenLength,
            tokenPrefix
        });

        // Test de connexion à Vercel Blob
        let blobTest = { success: false, error: 'Not tested' };
        try {
            const { list } = await import('@vercel/blob');
            const blobs = await list();
            blobTest = { 
                success: true, 
                blobCount: blobs.blobs.length,
                message: 'Vercel Blob connection successful'
            };
        } catch (blobError) {
            blobTest = { 
                success: false, 
                error: blobError.message,
                type: blobError.message.includes('BLOB_READ_WRITE_TOKEN') ? 'token_error' : 'connection_error'
            };
        }

        // Informations sur l'environnement
        const envInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            env: process.env.NODE_ENV || 'development'
        };

        res.status(200).json({
            timestamp: new Date().toISOString(),
            environment: envInfo,
            blobConfiguration: {
                hasToken,
                tokenLength,
                tokenPrefix,
                test: blobTest
            },
            recommendations: getRecommendations(hasToken, blobTest)
        });
        
    } catch (error) {
        console.error('Configuration check error:', error);
        res.status(500).json({
            error: 'Configuration check failed',
            details: error.message
        });
    }
}

function getRecommendations(hasToken, blobTest) {
    const recommendations = [];
    
    if (!hasToken) {
        recommendations.push({
            type: 'critical',
            message: 'BLOB_READ_WRITE_TOKEN is missing. Add it to your Vercel environment variables.',
            action: 'Go to Vercel Dashboard > Your Project > Settings > Environment Variables'
        });
    } else if (!blobTest.success) {
        if (blobTest.type === 'token_error') {
            recommendations.push({
                type: 'critical',
                message: 'BLOB_READ_WRITE_TOKEN is invalid or expired. Generate a new one.',
                action: 'Go to Vercel Dashboard > Storage > Blob > Settings > Tokens'
            });
        } else {
            recommendations.push({
                type: 'warning',
                message: 'Cannot connect to Vercel Blob service. Check your network connection.',
                action: 'Try again later or check your internet connection'
            });
        }
    } else {
        recommendations.push({
            type: 'success',
            message: 'Vercel Blob is properly configured and working.',
            action: 'You can now upload media files'
        });
    }
    
    return recommendations;
}
