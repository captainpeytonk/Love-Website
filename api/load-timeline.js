module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { list } = await import('@vercel/blob');

        // List all blobs and find the most recent timeline file
        const blobs = await list();
        console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
        
        // Find all files that start with 'love-timeline-'
        const timelineFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('love-timeline-'));
        console.log('Found timeline files:', timelineFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
        
        if (timelineFiles.length > 0) {
            // Sort by upload date to get the most recent
            timelineFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            const latestBlob = timelineFiles[0];
            console.log('Loading from most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
            
            // Load events from the most recent file
            const response = await fetch(latestBlob.url);
            if (response.ok) {
                const events = await response.json();
                console.log(`Loaded ${events.length} events from ${latestBlob.pathname}`);
                res.status(200).json({ events, totalEvents: events.length, fileName: latestBlob.pathname });
            } else {
                console.log('Failed to fetch timeline data');
                res.status(200).json({ events: [], totalEvents: 0, fileName: null });
            }
        } else {
            console.log('No timeline files found');
            res.status(200).json({ events: [], totalEvents: 0, fileName: null });
        }
    } catch (error) {
        console.error('Load timeline error:', error);
        res.status(500).json({ error: 'Load failed', events: [] });
    }
}
