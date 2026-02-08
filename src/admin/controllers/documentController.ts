// Document Controller - Handles admin requests for document management
import { Context } from 'hono';
import * as documentService from '../../services/documentService';

// ============================================
// Get All Documents
// ============================================
export const getDocuments = async (c: Context) => {
  try {
    const documents = await documentService.getDocuments();
    return c.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({ success: false, error: 'Failed to fetch documents' }, 500);
  }
};

// ============================================
// Get Document by ID
// ============================================
export const getDocumentById = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid document ID' }, 400);
    }

    const document = await documentService.getDocumentById(id);
    if (!document) {
      return c.json({ success: false, error: 'Document not found' }, 404);
    }

    return c.json({ success: true, data: document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return c.json({ success: false, error: 'Failed to fetch document' }, 500);
  }
};

// ============================================
// Update Document Status
// ============================================
export const updateDocumentStatus = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid document ID' }, 400);
    }

    const body = await c.req.json();
    if (!body.reviewStatusId) {
      return c.json({ success: false, error: 'Review status ID is required' }, 400);
    }

    const document = await documentService.updateDocumentStatus(
      id,
      parseInt(body.reviewStatusId),
      body.notes?.trim()
    );

    return c.json({ success: true, data: document });
  } catch (error) {
    console.error('Error updating document status:', error);
    return c.json({ success: false, error: 'Failed to update document status' }, 500);
  }
};

// ============================================
// Delete Document
// ============================================
export const deleteDocument = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid document ID' }, 400);
    }

    await documentService.deleteDocument(id);
    return c.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ success: false, error: 'Failed to delete document' }, 500);
  }
};

// ============================================
// Search Documents
// ============================================
export const searchDocuments = async (c: Context) => {
  try {
    const query = c.req.query('q') || '';
    const documents = await documentService.searchDocuments(query);
    return c.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error searching documents:', error);
    return c.json({ success: false, error: 'Failed to search documents' }, 500);
  }
};
