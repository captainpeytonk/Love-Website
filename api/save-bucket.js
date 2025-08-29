module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { bucketItems } = req.body;

        if (!bucketItems || !Array.isArray(bucketItems)) {
            return res.status(400).json({ error: 'Missing or invalid bucket items data' });
        }

        const { put, head, list, del } = await import('@vercel/blob');

        // Get existing bucket list data from the most recent file
        let existingItems = [];
        let latestBlob = null;
        
        try {
            // List all blobs and find the most recent bucket list file
            const blobs = await list();
            console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
            
            // Find all files that start with 'love-bucket-'
            const bucketFiles = blobs.blobs.filter(blob => blob.pathname.startsWith('love-bucket-'));
            console.log('Found bucket files:', bucketFiles.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
            
            if (bucketFiles.length > 0) {
                // Sort by upload date to get the most recent
                bucketFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                latestBlob = bucketFiles[0];
                console.log('Using most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                
                // Load items from the most recent file
                const response = await fetch(latestBlob.url);
                if (response.ok) {
                    existingItems = await response.json();
                    console.log(`Loaded ${existingItems.length} existing items from ${latestBlob.pathname}`);
                } else {
                    console.log('Failed to fetch existing items, starting fresh');
                    existingItems = [];
                }
                
                // Delete older files to avoid accumulation
                if (bucketFiles.length > 1) {
                    console.log(`Deleting ${bucketFiles.length - 1} older files...`);
                    for (let i = 1; i < bucketFiles.length; i++) {
                        try {
                            await del(bucketFiles[i].pathname);
                            console.log(`Deleted: ${bucketFiles[i].pathname}`);
                        } catch (deleteError) {
                            console.log(`Failed to delete ${bucketFiles[i].pathname}:`, deleteError.message);
                        }
                    }
                }
            } else {
                console.log('No existing bucket files found, starting fresh');
                existingItems = [];
            }
        } catch (error) {
            console.log('Error loading existing items:', error.message);
            existingItems = [];
        }

        // Replace all items with the new data
        const allItems = bucketItems;
        console.log(`Saving ${allItems.length} items to bucket list`);
        console.log('All items:', JSON.stringify(allItems, null, 2));

        // Create a new file with timestamp to ensure uniqueness
        const timestamp = Date.now();
        const newFileName = `love-bucket-${timestamp}.json`;
        
        const jsonData = JSON.stringify(allItems, null, 2);
        console.log(`Saving bucket list to new file: ${newFileName}`);

        const { url } = await put(newFileName, jsonData, { 
            access: 'public',
            contentType: 'application/json'
        });

        console.log('Bucket list saved successfully to:', url);
        res.status(200).json({ url, totalItems: allItems.length, fileName: newFileName });
    } catch (error) {
        console.error('Save bucket list error:', error);
        res.status(500).json({ error: 'Save failed' });
    }
}
