import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mediaData = req.body;

    if (!mediaData) {
      return res.status(400).json({ error: 'Media data is required' });
    }

    // Generate unique filename for media data
    const timestamp = Date.now();
    const fileName = `media-data-${timestamp}.json`;

    // Convert data to JSON string
    const jsonData = JSON.stringify(mediaData, null, 2);

    // Upload to Vercel Blob
    const { url } = await put(fileName, jsonData, { 
      access: 'public',
      contentType: 'application/json' 
    });

    res.status(200).json({ 
      url,
      message: 'Media data saved successfully',
      timestamp 
    });
  } catch (error) {
    console.error('Save media error:', error);
    res.status(500).json({ error: 'Failed to save media data' });
  }
}
