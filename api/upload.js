const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { mediaData, fileName, fileType } = req.body;

        if (!mediaData || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(mediaData.split(',')[1], 'base64');

        // Upload to Vercel Blob
        const { url } = await put(fileName, buffer, { 
            access: 'public',
            contentType: fileType
        });

        res.status(200).json({ url });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
}
