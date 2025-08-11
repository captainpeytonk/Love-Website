import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, fileName, fileType } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File and fileName are required' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file.split(',')[1], 'base64');

    // Upload to Vercel Blob
    const { url } = await put(fileName, buffer, { 
      access: 'public',
      contentType: fileType 
    });

    res.status(200).json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
