module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Testing Vercel Blob configuration...');
        
        const { list, put, del } = await import('@vercel/blob');
        
        // Test 1: Lister les blobs existants
        console.log('Test 1: Listing existing blobs...');
        const blobs = await list();
        console.log('Found blobs:', blobs.blobs.length);
        
        // Test 2: Créer un fichier de test
        console.log('Test 2: Creating test file...');
        const testFileName = `test-${Date.now()}.txt`;
        const testContent = 'Hello WorldSpots!';
        
        const { url: testUrl } = await put(testFileName, testContent, {
            access: 'public',
            contentType: 'text/plain'
        });
        console.log('Test file created:', testUrl);
        
        // Test 3: Supprimer le fichier de test
        console.log('Test 3: Deleting test file...');
        await del(testFileName);
        console.log('Test file deleted');
        
        // Test 4: Vérifier les points existants
        console.log('Test 4: Checking existing points...');
        const pointsFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('worldspots-points-'));
        console.log('Points files found:', pointsFiles.length);
        
        let latestPoints = null;
        if (pointsFiles.length > 0) {
            pointsFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            latestPoints = pointsFiles[0];
            console.log('Latest points file:', latestPoints.pathname);
        }
        
        res.status(200).json({
            success: true,
            message: 'Vercel Blob is working correctly',
            blobCount: blobs.blobs.length,
            pointsFiles: pointsFiles.length,
            latestPointsFile: latestPoints ? latestPoints.pathname : null,
            testUrl: testUrl
        });
        
    } catch (error) {
        console.error('Blob test error:', error);
        
        // Diagnostic des erreurs courantes
        let errorMessage = error.message;
        let errorType = 'unknown';
        
        if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
            errorType = 'token_error';
            errorMessage = 'Vercel Blob token is missing or invalid. Please check your environment variables.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorType = 'network_error';
            errorMessage = 'Network error connecting to Vercel Blob service.';
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
            errorType = 'permission_error';
            errorMessage = 'Permission denied. Check your Vercel Blob token permissions.';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            errorType: errorType,
            details: error.message
        });
    }
}
