module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Attempting to load points from Vercel Blob...');
        
        const { head, list } = await import('@vercel/blob');
        
        try {
            // List all blobs and find the most recent points file
            const blobs = await list();
            console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
            
            // Find all files that start with 'worldspots-points-'
            const pointsFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('worldspots-points-'));
            console.log('Found points files:', pointsFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
            
            if (pointsFiles.length > 0) {
                // Sort by upload date to get the most recent
                pointsFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                const latestBlob = pointsFiles[0];
                console.log('Using most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                
                const response = await fetch(latestBlob.url);
                console.log('Fetch response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const pointsData = await response.json();
                console.log(`Successfully loaded ${pointsData.length} points from ${latestBlob.pathname}:`, pointsData);
                res.status(200).json({ points: pointsData });
            } else {
                console.log('No points files found');
                res.status(200).json({ points: [] });
            }
        } catch (error) {
            console.log('Error loading points:', error.message);
            res.status(200).json({ points: [] });
        }
    } catch (error) {
        console.error('Load points error:', error);
        res.status(500).json({ error: 'Load failed', details: error.message });
    }
}
