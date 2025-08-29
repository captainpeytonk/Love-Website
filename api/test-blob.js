module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Testing blob access...');
        
        // Import @vercel/blob
        const { head, list } = await import('@vercel/blob');
        
        try {
            console.log('Listing available blobs...');
            const blobs = await list();
            console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
            console.log('Number of blobs found:', blobs.blobs.length);
            
            // Find all files that start with 'worldspots-points-'
            const pointsFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('worldspots-points-'));
            console.log('Found points files:', pointsFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
            
            if (pointsFiles.length > 0) {
                // Sort by upload date to get the most recent
                pointsFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                const latestBlob = pointsFiles[0];
                console.log('Using most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                
                // Use the URL directly to fetch the data
                const response = await fetch(latestBlob.url);
                console.log('Fetch response:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const text = await response.text();
                console.log('Raw response text length:', text.length);
                console.log('Raw response text (first 500 chars):', text.substring(0, 500));
                
                const pointsData = JSON.parse(text);
                console.log('Parsed data successfully, points count:', pointsData.length);
                console.log('All points data:', JSON.stringify(pointsData, null, 2));
                
                res.status(200).json({ 
                    success: true, 
                    blob: latestBlob,
                    points: pointsData,
                    count: pointsData.length,
                    rawText: text.substring(0, 200), // Show first 200 chars for debugging
                    allPointsFiles: pointsFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt }))
                });
            } else {
                console.log('No points files found');
                res.status(200).json({ 
                    success: false, 
                    error: 'No points files found',
                    availableBlobs: blobs.blobs.map(b => b.pathname)
                });
            }
        } catch (listError) {
            console.error('Error listing blobs:', listError);
            res.status(200).json({ 
                success: false, 
                error: `Error listing blobs: ${listError.message}`
            });
        }
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ 
            error: 'Test failed', 
            details: error.message,
            stack: error.stack
        });
    }
}
