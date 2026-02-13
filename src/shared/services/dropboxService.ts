import { Dropbox } from 'dropbox';

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });

export const getDropboxTemporaryLink = async (filePath: string) => {
  try {
    const response = await dbx.filesGetTemporaryLink({ path: filePath });
    return {
      link: response.result.link,
      metadata: response.result.metadata
    };
  } catch (error) {
    console.error('Dropbox error:', error);
    throw new Error('Failed to get file from Dropbox');
  }
};
