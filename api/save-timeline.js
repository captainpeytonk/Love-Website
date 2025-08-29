module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { events } = req.body;

        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Missing or invalid events data' });
        }

        const { put, head, list, del } = await import('@vercel/blob');

        // Get existing timeline data from the most recent file
        let existingEvents = [];
        let latestBlob = null;
        
        try {
            // List all blobs and find the most recent timeline file
            const blobs = await list();
            console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
            
            // Find all files that start with 'love-timeline-'
            const timelineFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('love-timeline-'));
            console.log('Found timeline files:', timelineFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
            
            if (timelineFiles.length > 0) {
                // Sort by upload date to get the most recent
                timelineFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                latestBlob = timelineFiles[0];
                console.log('Using most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                
                // Load events from the most recent file
                const response = await fetch(latestBlob.url);
                if (response.ok) {
                    existingEvents = await response.json();
                    console.log(`Loaded ${existingEvents.length} existing events from ${latestBlob.pathname}`);
                } else {
                    console.log('Failed to fetch existing events, starting fresh');
                    existingEvents = [];
                }
                
                // Delete older files to avoid accumulation
                if (timelineFiles.length > 1) {
                    console.log(`Deleting ${timelineFiles.length - 1} older files...`);
                    for (let i = 1; i < timelineFiles.length; i++) {
                        try {
                            await del(timelineFiles[i].pathname);
                            console.log(`Deleted: ${timelineFiles[i].pathname}`);
                        } catch (deleteError) {
                            console.log(`Failed to delete ${timelineFiles[i].pathname}:`, deleteError.message);
                        }
                    }
                }
            } else {
                console.log('No existing timeline files found, starting fresh');
                existingEvents = [];
            }
        } catch (error) {
            console.log('Error loading existing events:', error.message);
            existingEvents = [];
        }

        // Replace all events with the new data
        const allEvents = events;
        console.log(`Saving ${allEvents.length} events to timeline`);
        console.log('All events:', JSON.stringify(allEvents, null, 2));

        // Create a new file with timestamp to ensure uniqueness
        const timestamp = Date.now();
        const newFileName = `love-timeline-${timestamp}.json`;
        
        const jsonData = JSON.stringify(allEvents, null, 2);
        console.log(`Saving timeline to new file: ${newFileName}`);

        const { url } = await put(newFileName, jsonData, { 
            access: 'public',
            contentType: 'application/json'
        });

        console.log('Timeline saved successfully to:', url);
        res.status(200).json({ url, totalEvents: allEvents.length, fileName: newFileName });
    } catch (error) {
        console.error('Save timeline error:', error);
        res.status(500).json({ error: 'Save failed' });
    }
}
