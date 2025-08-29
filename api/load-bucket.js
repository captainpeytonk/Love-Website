module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { list } = await import('@vercel/blob');

        // List all blobs and find the most recent bucket list file
        const blobs = await list();
        console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
        
        // Find all files that start with 'love-bucket-'
        const bucketFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('love-bucket-'));
        console.log('Found bucket files:', bucketFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
        
        if (bucketFiles.length > 0) {
            // Sort by upload date to get the most recent
            bucketFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            const latestBlob = bucketFiles[0];
            console.log('Loading from most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
            
            // Load items from the most recent file
            const response = await fetch(latestBlob.url);
            if (response.ok) {
                const items = await response.json();
                console.log(`Loaded ${items.length} items from ${latestBlob.pathname}`);
                res.status(200).json({ items, totalItems: items.length, fileName: latestBlob.pathname });
            } else {
                console.log('Failed to fetch bucket list data');
                res.status(200).json({ items: [], totalItems: 0, fileName: null });
            }
        } else {
            console.log('No bucket files found');
            res.status(200).json({ items: [], totalItems: 0, fileName: null });
        }
    } catch (error) {
        console.error('Load bucket list error:', error);
        res.status(500).json({ error: 'Load failed', items: [] });
    }
}
