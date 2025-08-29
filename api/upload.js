const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Upload request received');
        const { mediaData, fileName, fileType } = req.body;

        // Validation des données
        if (!mediaData || !fileName || !fileType) {
            console.error('Missing required fields:', { mediaData: !!mediaData, fileName: !!fileName, fileType: !!fileType });
            return res.status(400).json({ error: 'Missing required fields: mediaData, fileName, fileType' });
        }

        // Validation du type de fichier
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
        if (!allowedTypes.includes(fileType)) {
            console.error('Invalid file type:', fileType);
            return res.status(400).json({ error: 'Invalid file type. Allowed: ' + allowedTypes.join(', ') });
        }

        // Validation de la taille (max 10MB)
        const base64Data = mediaData.split(',')[1];
        if (!base64Data) {
            console.error('Invalid base64 data format');
            return res.status(400).json({ error: 'Invalid file data format' });
        }

        const fileSizeInBytes = Math.ceil((base64Data.length * 3) / 4);
        const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

        if (fileSizeInBytes > maxSizeInBytes) {
            console.error('File too large:', fileSizeInBytes, 'bytes');
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
        }

        console.log('Processing upload:', { fileName, fileType, size: fileSizeInBytes });

        // Conversion base64 vers buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload vers Vercel Blob
        console.log('Uploading to Vercel Blob...');
        const { url } = await put(fileName, buffer, { 
            access: 'public',
            contentType: fileType
        });

        console.log('Upload successful:', url);
        res.status(200).json({ url, size: fileSizeInBytes });
    } catch (error) {
        console.error('Upload error:', error);
        
        // Gestion spécifique des erreurs Vercel Blob
        if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
            res.status(500).json({ error: 'Blob storage configuration error. Please check your Vercel Blob token.' });
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            res.status(500).json({ error: 'Network error during upload. Please try again.' });
        } else {
            res.status(500).json({ error: 'Upload failed: ' + error.message });
        }
    }
}
