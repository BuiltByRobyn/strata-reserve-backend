import { Context } from 'hono';

export const UploadController = {
  uploadFile: async (c: Context) => {
    try {
      const body = await c.req.parseBody();
      const file = body['file'];

      if (file && file instanceof File) {
        // Here you would typically save the file to disk or cloud storage
        // For this example, we'll just echo back the metadata
        return c.json({
          message: 'File uploaded successfully',
          filename: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });
      }

      return c.json({ message: 'No file uploaded' }, 400);
    } catch (error) {
      console.error('Error uploading file:', error);
      return c.json({ message: 'Internal Server Error' }, 500);
    }
  },
};
