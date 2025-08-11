import { list, get } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // List all media data files
    const { blobs } = await list();
    
    // Filter for media data files
    const mediaDataFiles = blobs.filter(blob => 
      blob.pathname.startsWith('media-data-') && blob.pathname.endsWith('.json')
    );

    // Sort by creation date (newest first)
    mediaDataFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Get the most recent media data file
    if (mediaDataFiles.length > 0) {
      const latestFile = mediaDataFiles[0];
      const { blob } = await get(latestFile.pathname);
      
      // Convert blob to text and parse JSON
      const text = await blob.text();
      const mediaData = JSON.parse(text);
      
      res.status(200).json(mediaData);
    } else {
      // No media data found, return empty array
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to retrieve media data' });
  }
}
