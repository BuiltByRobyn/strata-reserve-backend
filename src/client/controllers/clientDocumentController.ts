import { Context } from 'hono';
import * as documentService from '../../services/documentService';

export const getMyDocuments = async (c: Context) => {
  try {
    const user = c.get('user');
    const documents = await documentService.getDocumentsByProfile(user.id);
    return c.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching client documents:', error);
    return c.json({ success: false, error: 'Failed to fetch documents' }, 500);
  }
};

export const getRequiredDocuments = async (c: Context) => {
  try {
    const serviceRequestId = parseInt(c.req.param('id'));
    if (isNaN(serviceRequestId)) {
      return c.json({ success: false, error: 'Invalid service request ID' }, 400);
    }

    const serviceId = parseInt(c.req.query('serviceId') || '');
    const propertyTypeId = c.req.query('propertyTypeId') ? parseInt(c.req.query('propertyTypeId')!) : undefined;

    if (isNaN(serviceId)) {
      return c.json({ success: false, error: 'Service ID is required' }, 400);
    }

    const [requiredDocs, uploadedDocs] = await Promise.all([
      documentService.getRequiredDocuments(serviceId, propertyTypeId),
      documentService.getDocumentsByServiceRequest(serviceRequestId)
    ]);

    const checklist = requiredDocs.map(req => ({
      ...req,
      uploadedDocument: uploadedDocs.find(
        doc => doc.documentTypeId === req.documentTypeId
      ) || null
    }));

    return c.json({ success: true, data: checklist });
  } catch (error) {
    console.error('Error fetching required documents:', error);
    return c.json({ success: false, error: 'Failed to fetch required documents' }, 500);
  }
};

export const getDocumentsByServiceRequest = async (c: Context) => {
  try {
    const serviceRequestId = parseInt(c.req.param('id'));
    if (isNaN(serviceRequestId)) {
      return c.json({ success: false, error: 'Invalid service request ID' }, 400);
    }

    const documents = await documentService.getDocumentsByServiceRequest(serviceRequestId);
    return c.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching service request documents:', error);
    return c.json({ success: false, error: 'Failed to fetch documents' }, 500);
  }
};
