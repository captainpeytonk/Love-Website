module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { newPoint } = req.body;

        if (!newPoint) {
            return res.status(400).json({ error: 'Missing point data' });
        }

        const { put, head, list, del } = await import('@vercel/blob');

        // Get existing points from the most recent file
        let allPoints = [];
        let latestBlob = null;
        
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
                latestBlob = pointsFiles[0];
                console.log('Using most recent file:', latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                
                // Load points from the most recent file
                const response = await fetch(latestBlob.url);
                if (response.ok) {
                    allPoints = await response.json();
                    console.log(`Loaded ${allPoints.length} existing points from ${latestBlob.pathname}`);
                } else {
                    console.log('Failed to fetch existing points, starting fresh');
                    allPoints = [];
                }
                
                // Delete older files to avoid accumulation
                if (pointsFiles.length > 1) {
                    console.log(`Deleting ${pointsFiles.length - 1} older files...`);
                    for (let i = 1; i < pointsFiles.length; i++) {
                        try {
                            await del(pointsFiles[i].pathname);
                            console.log(`Deleted: ${pointsFiles[i].pathname}`);
                        } catch (deleteError) {
                            console.log(`Failed to delete ${pointsFiles[i].pathname}:`, deleteError.message);
                        }
                    }
                }
            } else {
                console.log('No existing points files found, starting fresh');
                allPoints = [];
            }
        } catch (error) {
            console.log('Error loading existing points:', error.message);
            allPoints = [];
        }

        // Add the new point
        allPoints.push(newPoint);
        console.log(`Added new point. Total points now: ${allPoints.length}`);
        console.log('All points after adding new one:', JSON.stringify(allPoints, null, 2));

        // Create a new file with timestamp to ensure uniqueness
        const timestamp = Date.now();
        const newFileName = `worldspots-points-${timestamp}.json`;
        
        const jsonData = JSON.stringify(allPoints, null, 2);
        console.log(`Saving points to new file: ${newFileName}`);

        const { url } = await put(newFileName, jsonData, { 
            access: 'public',
            contentType: 'application/json'
        });

        console.log('Points saved successfully to:', url);
        res.status(200).json({ url, totalPoints: allPoints.length, fileName: newFileName });
    } catch (error) {
        console.error('Save points error:', error);
        res.status(500).json({ error: 'Save failed' });
    }
}
