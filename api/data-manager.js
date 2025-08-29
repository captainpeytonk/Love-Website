module.exports = async function handler(req, res) {
    const { operation, dataType } = req.query;
    
    if (req.method === 'GET' && operation === 'load') {
        // Load operation
        try {
            const { list } = await import('@vercel/blob');
            
            // List all blobs and find the most recent file for the specified data type
            const blobs = await list();
            console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
            
            // Determine prefix based on data type
            const prefix = dataType === 'timeline' ? 'love-timeline-' : 'love-bucket-';
            const files = blobs.blobs.filter(blob => blob.pathname.startsWith(prefix));
            console.log(`Found ${dataType} files:`, files.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
            
            if (files.length > 0) {
                // Sort by upload date to get the most recent
                files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                const latestBlob = files[0];
                console.log(`Loading from most recent ${dataType} file:`, latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                
                // Load data from the most recent file
                const response = await fetch(latestBlob.url);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Loaded ${data.length} items from ${latestBlob.pathname}`);
                    res.status(200).json({ 
                        data, 
                        totalItems: data.length, 
                        fileName: latestBlob.pathname,
                        dataType 
                    });
                } else {
                    console.log(`Failed to fetch ${dataType} data`);
                    res.status(200).json({ data: [], totalItems: 0, fileName: null, dataType });
                }
            } else {
                console.log(`No ${dataType} files found`);
                res.status(200).json({ data: [], totalItems: 0, fileName: null, dataType });
            }
        } catch (error) {
            console.error(`Load ${dataType} error:`, error);
            res.status(500).json({ error: 'Load failed', data: [], dataType });
        }
    } else if (req.method === 'POST' && operation === 'save') {
        // Save operation
        try {
            const { data } = req.body;
            
            if (!data || !Array.isArray(data)) {
                return res.status(400).json({ error: 'Missing or invalid data' });
            }

            const { put, head, list, del } = await import('@vercel/blob');

            // Determine prefix based on data type
            const prefix = dataType === 'timeline' ? 'love-timeline-' : 'love-bucket-';
            
            // Get existing data from the most recent file
            let existingData = [];
            let latestBlob = null;
            
            try {
                // List all blobs and find the most recent file
                const blobs = await list();
                console.log('All available blobs:', blobs.blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
                
                // Find all files that start with the prefix
                const files = blobs.blobs.filter(blob => blob.pathname.startsWith(prefix));
                console.log(`Found ${dataType} files:`, files.map(f => ({ pathname: f.pathname, uploadedAt: f.uploadedAt })));
                
                if (files.length > 0) {
                    // Sort by upload date to get the most recent
                    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                    latestBlob = files[0];
                    console.log(`Using most recent ${dataType} file:`, latestBlob.pathname, 'uploaded at:', latestBlob.uploadedAt);
                    
                    // Load data from the most recent file
                    const response = await fetch(latestBlob.url);
                    if (response.ok) {
                        existingData = await response.json();
                        console.log(`Loaded ${existingData.length} existing items from ${latestBlob.pathname}`);
                    } else {
                        console.log(`Failed to fetch existing ${dataType} data, starting fresh`);
                        existingData = [];
                    }
                    
                    // Delete older files to avoid accumulation
                    if (files.length > 1) {
                        console.log(`Deleting ${files.length - 1} older files...`);
                        for (let i = 1; i < files.length; i++) {
                            try {
                                await del(files[i].pathname);
                                console.log(`Deleted: ${files[i].pathname}`);
                            } catch (deleteError) {
                                console.log(`Failed to delete ${files[i].pathname}:`, deleteError.message);
                            }
                        }
                    }
                } else {
                    console.log(`No existing ${dataType} files found, starting fresh`);
                    existingData = [];
                }
            } catch (error) {
                console.log(`Error loading existing ${dataType} data:`, error.message);
                existingData = [];
            }

            // Replace all data with the new data
            const allData = data;
            console.log(`Saving ${allData.length} items to ${dataType}`);
            console.log(`All ${dataType} data:`, JSON.stringify(allData, null, 2));

            // Create a new file with timestamp to ensure uniqueness
            const timestamp = Date.now();
            const newFileName = `${prefix}${timestamp}.json`;
            
            const jsonData = JSON.stringify(allData, null, 2);
            console.log(`Saving ${dataType} to new file: ${newFileName}`);

            const { url } = await put(newFileName, jsonData, { 
                access: 'public',
                contentType: 'application/json'
            });

            console.log(`${dataType} saved successfully to:`, url);
            res.status(200).json({ 
                url, 
                totalItems: allData.length, 
                fileName: newFileName,
                dataType 
            });
        } catch (error) {
            console.error(`Save ${dataType} error:`, error);
            res.status(500).json({ error: 'Save failed', dataType });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed or invalid operation' });
    }
}
