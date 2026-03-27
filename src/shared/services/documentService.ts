import prisma from '../lib/prismaClient';
import { documentInclude, documentIncludeCompact, requirementInclude } from '../constants/prismaIncludes';
import { filterClientDocumentNotes } from '../helpers/noteFilterHelper';
import * as emailService from '../lib/emailService';
import type { NaStatusValue, BatchDocumentReviewItemInput } from '../types/document.types';

const getVisibleSectionIdsForProfile = async (profileId: string): Promise<number[]> => {
  const profileSections = await prisma.strataProfileSection.findMany({
    where: { strataProfile: { profileId } },
    select: { sectionId: true },
  });
  return profileSections.map((s) => s.sectionId);
};

const sectionVisibilityWhere = (sectionIds: number[]) => {
  return sectionIds.length
    ? { OR: [{ sectionId: null }, { sectionId: { in: sectionIds } }] }
    : {};
};

export const getDocuments = async () => {
  return prisma.fileNumberDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentById = async (id: number) => {
  return prisma.fileNumberDocument.findUnique({
    where: { fileNumberDocumentId: id },
    include: documentInclude
  });
};

export const getDocumentsByFileNumber = async (fileId: number) => {
  return prisma.fileNumberDocument.findMany({
    where: { fileId: fileId },
    orderBy: { uploadedAt: 'desc' },
    include: documentIncludeCompact
  });
};

export const updateDocumentStatus = async (id: number, reviewStatusId: number, notes?: string) => {
  return prisma.fileNumberDocument.update({
    where: { fileNumberDocumentId: id },
    data: {
      reviewStatusId,
      ...(notes !== undefined ? { notes } : {})
    },
    include: {
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};

export const clearDocumentNotes = async (id: number) => {
  return prisma.fileNumberDocument.update({
    where: { fileNumberDocumentId: id },
    data: { notes: null }
  });
};

export const deleteDocument = async (id: number) => {
  return prisma.fileNumberDocument.delete({
    where: { fileNumberDocumentId: id }
  });
};

export const searchDocuments = async (query: string) => {
  return prisma.fileNumberDocument.findMany({
    where: {
      OR: [
        { fileName: { contains: query, mode: 'insensitive' } },
        { documentType: { typeName: { contains: query, mode: 'insensitive' } } },
        { fileNumber: { strata: { strataPlan: { contains: query, mode: 'insensitive' } } } },
        { fileNumber: { strata: { complexName: { contains: query, mode: 'insensitive' } } } }
      ]
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentsByProfile = async (profileId: string) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  const docs = await prisma.fileNumberDocument.findMany({
    where: {
      fileNumber: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...sectionVisibilityWhere(sectionIds),
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
  return docs.map(filterClientDocumentNotes);
};

export const getDocumentByIdForProfile = async (profileId: string, id: number) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  const doc = await prisma.fileNumberDocument.findFirst({
    where: {
      fileNumberDocumentId: id,
      fileNumber: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...sectionVisibilityWhere(sectionIds),
    },
    include: documentInclude
  });
  return doc ? filterClientDocumentNotes(doc) : null;
};

export const searchDocumentsByProfile = async (profileId: string, query: string) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return getDocumentsByProfile(profileId);
  }

  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  const docs = await prisma.fileNumberDocument.findMany({
    where: {
      AND: [
        {
          fileNumber: {
            strata: {
              strataProfiles: { some: { profileId } }
            }
          }
        },
        ...(sectionIds.length ? [sectionVisibilityWhere(sectionIds)] : []),
        {
          OR: [
            { fileName: { contains: trimmedQuery, mode: 'insensitive' } },
            { documentType: { typeName: { contains: trimmedQuery, mode: 'insensitive' } } },
            { fileNumber: { strata: { strataPlan: { contains: trimmedQuery, mode: 'insensitive' } } } },
            { fileNumber: { strata: { complexName: { contains: trimmedQuery, mode: 'insensitive' } } } }
          ]
        }
      ]
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
  return docs.map(filterClientDocumentNotes);
};

export const getFileNumberByIdForProfile = async (profileId: string, fileId: number) => {
  return prisma.fileNumber.findFirst({
    where: {
      fileId: fileId,
      strata: {
        strataProfiles: { some: { profileId } }
      }
    },
    select: {
      fileId: true,
      serviceId: true,
      strata: {
        select: {
          strataPropertyTypes: { select: { propertyTypeId: true } }
        }
      }
    }
  });
};

export const getDocumentsByFileNumberForProfile = async (profileId: string, fileId: number) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  const docs = await prisma.fileNumberDocument.findMany({
    where: {
      fileId: fileId,
      fileNumber: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...sectionVisibilityWhere(sectionIds),
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentIncludeCompact
  });
  return docs.map(filterClientDocumentNotes);
};

export const getRequiredDocumentsChecklist = async (profileId: string, fileId: number) => {
  const sr = await getFileNumberByIdForProfile(profileId, fileId);
  if (!sr) return null;

  const [requirements, latestReview] = await Promise.all([
    prisma.fileNumberDocumentRequirement.findMany({
      where: { fileId },
      include: requirementInclude,
      orderBy: { fnDocRequirementId: 'asc' },
    }),
    prisma.fileNumberDocumentReview.findFirst({
      where: { fileId },
      orderBy: { reviewedAt: 'desc' },
      select: {
        reviewId: true,
        reviewedAt: true,
        items: {
          select: {
            fnDocRequirementId: true,
            notes: true,
            reviewStatus: { select: { reviewStatusId: true, statusName: true } },
          },
        },
      },
    }),
  ]);

  const reviewItemMap = new Map(
    latestReview?.items.map(item => [item.fnDocRequirementId, item]) ?? []
  );

  return requirements.map((req) => ({
    fnDocRequirementId: req.fnDocRequirementId,
    fileId: req.fileId,
    documentTypeId: req.documentTypeId,
    propertyTypeId: req.propertyTypeId,
    versionLabel: req.versionLabel,
    documentType: req.documentType,
    propertyType: req.propertyType,
    naStatus: req.naStatus?.status ?? null,
    uploadedDocument: req.fileNumberDocuments[0] ?? null,
    reviewId: latestReview?.reviewId ?? null,
    reviewedAt: latestReview?.reviewedAt?.toISOString() ?? null,
    reviewStatus: reviewItemMap.get(req.fnDocRequirementId)?.reviewStatus ?? null,
    denialNote: reviewItemMap.get(req.fnDocRequirementId)?.notes ?? null,
  }));
};

export const setNaStatus = async (fnDocRequirementId: number, status: NaStatusValue, profileId: string) => {
  return prisma.fileNumberDocumentNaStatus.upsert({
    where: { fnDocRequirementId },
    update: { status, setByProfileId: profileId, setAt: new Date() },
    create: { fnDocRequirementId, status, setByProfileId: profileId },
  });
};

export const clearNaStatus = async (fnDocRequirementId: number) => {
  await prisma.fileNumberDocumentNaStatus.deleteMany({ where: { fnDocRequirementId } });
};

export const submitBatchDocumentReview = async (
  fileId: number,
  reviewedByProfileId: string,
  items: BatchDocumentReviewItemInput[]
) => {
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.fileNumberDocumentReview.create({
      data: {
        fileId,
        reviewedByProfileId,
        items: {
          create: items.map((item) => ({
            fnDocRequirementId: item.fnDocRequirementId,
            reviewStatusId: item.reviewStatusId,
            notes: item.notes ?? null,
          })),
        },
      },
      include: {
        items: {
          include: {
            reviewStatus: { select: { reviewStatusId: true, statusName: true } },
            requirement: {
              select: {
                fnDocRequirementId: true,
                versionLabel: true,
                documentType: { select: { typeName: true } },
                propertyType: { select: { propertyTypeName: true } },
              },
            },
          },
        },
      },
    });

    await tx.fileNumber.update({
      where: { fileId },
      data: { status: 'Documents Reviewed' },
    });

    return created;
  });

  const allApproved = review.items.every((item) => item.reviewStatus.statusName === 'Approved');
  if (allApproved) {
    const [fn, reviewer] = await Promise.all([
      prisma.fileNumber.findUnique({
        where: { fileId },
        select: {
          fileNumber: true,
          requestedBy: { select: { email: true, firstName: true, lastName: true, displayName: true } },
          strata: { select: { strataPlan: true, complexName: true } },
        },
      }),
      prisma.profile.findUnique({
        where: { id: reviewedByProfileId },
        select: { firstName: true, lastName: true, displayName: true },
      }),
    ]);

    const finalizedDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const propertyAddress = fn?.strata?.complexName || fn?.strata?.strataPlan || '';
    const clientName = fn?.requestedBy?.displayName
      || [fn?.requestedBy?.firstName, fn?.requestedBy?.lastName].filter(Boolean).join(' ')
      || 'Unknown';
    const finalizedBy = reviewer?.displayName
      || [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(' ')
      || 'Admin';

    if (fn?.requestedBy?.email) {
      emailService.sendDocumentsFinalizedEmail({
        to: fn.requestedBy.email,
        fileNumber: fn.fileNumber || '',
        finalizedDate,
      }).catch((err) => console.error('Failed to send documents finalized email:', err));
    }

    emailService.sendAdminDocumentsFinalizedEmail({
      fileNumber: fn?.fileNumber || '',
      propertyAddress,
      clientName,
      documentCount: review.items.length,
      finalizedBy,
    }).catch((err) => console.error('Failed to send admin documents finalized email:', err));
  }

  return review;
};

export const getLatestDocumentReview = async (fileId: number) => {
  const requirements = await prisma.fileNumberDocumentRequirement.findMany({
    where: { fileId },
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } },
      propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
      naStatus: { select: { status: true } },
      fileNumberDocuments: {
        orderBy: { uploadedAt: 'desc' },
        take: 1,
        select: {
          fileNumberDocumentId: true,
          fileName: true,
          filePath: true,
          uploadedAt: true,
          fnDocRequirementId: true,
        },
      },
    },
    orderBy: { fnDocRequirementId: 'asc' },
  });

  const review = await prisma.fileNumberDocumentReview.findFirst({
    where: { fileId },
    orderBy: { reviewedAt: 'desc' },
    include: {
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          reviewStatus: { select: { reviewStatusId: true, statusName: true } },
        },
      },
    },
  });

  return { requirements, review };
};

export const createAdminReadyForReviewNotification = async (fileId: number) => {
  const existing = await prisma.inAppNotification.findFirst({
    where: { fileId, type: 'docs_ready_for_review' },
  });
  if (existing) return;

  const fileNumberRecord = await prisma.fileNumber.findUnique({
    where: { fileId },
    select: {
      fileNumber: true,
      strata: { select: { strataPlan: true, complexName: true } },
    },
  });
  if (!fileNumberRecord) return;

  const strataName = fileNumberRecord.strata.complexName || fileNumberRecord.strata.strataPlan || '';
  const fnLabel = fileNumberRecord.fileNumber || String(fileId);

  const adminProfiles = await prisma.profile.findMany({
    where: { userTypeId: 1 },
    select: { id: true, email: true, firstName: true },
  });

  if (adminProfiles.length > 0) {
    await prisma.inAppNotification.createMany({
      data: adminProfiles.map((p) => ({
        profileId: p.id,
        fileId,
        type: 'docs_ready_for_review',
        message: `Documents for ${strataName} (${fnLabel}) are ready for review.`,
      })),
    });
  }

  for (const admin of adminProfiles) {
    if (admin.email) {
      emailService
        .sendDocumentReviewReadyEmail({
          to: admin.email,
          firstName: admin.firstName,
          strataName,
          fileNumber: fnLabel,
        })
        .catch((err) => console.error('Email error:', err));
    }
  }
};

export const createAdminDocResubmittedNotification = async (fileId: number) => {
  const latestReview = await prisma.fileNumberDocumentReview.findFirst({
    where: { fileId },
    orderBy: { reviewedAt: 'desc' },
    include: {
      items: {
        include: {
          reviewStatus: { select: { statusName: true } },
        },
      },
    },
  });

  const hasRejection = latestReview?.items.some((item) =>
    /deny|reject/i.test(item.reviewStatus.statusName)
  );
  if (!hasRejection) return;

  const existingUnread = await prisma.inAppNotification.findFirst({
    where: { fileId, type: 'doc_resubmitted_after_rejection', isRead: false },
  });
  if (existingUnread) return;

  const fileNumberRecord = await prisma.fileNumber.findUnique({
    where: { fileId },
    select: {
      fileNumber: true,
      strataId: true,
      strata: { select: { strataPlan: true, complexName: true } },
    },
  });
  if (!fileNumberRecord) return;

  const strataName = fileNumberRecord.strata.complexName || fileNumberRecord.strata.strataPlan || '';
  const fnLabel = fileNumberRecord.fileNumber || String(fileId);
  const strataId = fileNumberRecord.strataId;

  const adminProfiles = await prisma.profile.findMany({
    where: { userTypeId: 1 },
    select: { id: true },
  });

  if (adminProfiles.length > 0) {
    await prisma.inAppNotification.createMany({
      data: adminProfiles.map((p) => ({
        profileId: p.id,
        fileId,
        type: 'doc_resubmitted_after_rejection',
        message: `New documents have been uploaded for ${strataName} (${fnLabel}) following a rejection. Please review.`,
        referenceId: strataId,
      })),
    });
  }
};

export const createClientReviewCompleteNotification = async (
  fileId: number,
  reviewId: number,
  items: Array<{
    documentTypeName: string;
    versionLabel: string;
    propertyTypeName: string | null;
    statusName: string;
    notes: string | null;
  }>
) => {
  const fileNumberRecord = await prisma.fileNumber.findUnique({
    where: { fileId },
    select: {
      fileNumber: true,
      strata: {
        select: {
          strataPlan: true,
          complexName: true,
          strataProfiles: {
            select: { profile: { select: { id: true, email: true, firstName: true } } },
          },
        },
      },
    },
  });
  if (!fileNumberRecord) return;

  const strataName = fileNumberRecord.strata.complexName || fileNumberRecord.strata.strataPlan || '';
  const fnLabel = fileNumberRecord.fileNumber || String(fileId);
  const clientProfiles = fileNumberRecord.strata.strataProfiles.map((sp) => sp.profile);

  if (clientProfiles.length > 0) {
    await prisma.inAppNotification.createMany({
      data: clientProfiles.map((p) => ({
        profileId: p.id,
        fileId,
        type: 'doc_review_complete',
        message: `Your document submission for ${strataName} has been reviewed.`,
        referenceId: reviewId,
      })),
    });
  }

  for (const client of clientProfiles) {
    if (client.email) {
      emailService
        .sendDocumentReviewResultEmail({
          to: client.email,
          firstName: client.firstName,
          strataName,
          fileNumber: fnLabel,
          items,
        })
        .catch((err) => console.error('Email error:', err));
    }
  }

  await prisma.fileNumberDocumentReview.update({
    where: { reviewId },
    data: { clientNotifiedAt: new Date() },
  });
};

export const handleDuplicateUpload = async (fileId: number, reqId: number) => {
  const docs = await prisma.fileNumberDocument.findMany({
    where: { fnDocRequirementId: reqId },
    orderBy: { uploadedAt: 'desc' },
    select: { fileNumberDocumentId: true },
  });

  if (docs.length <= 1) return;

  const req = await prisma.fileNumberDocumentRequirement.findUnique({
    where: { fnDocRequirementId: reqId },
  });
  if (!req) return;

  const existingCount = await prisma.fileNumberDocumentRequirement.count({
    where: { fileId, documentTypeId: req.documentTypeId, propertyTypeId: req.propertyTypeId },
  });

  const newReq = await prisma.fileNumberDocumentRequirement.create({
    data: {
      fileId,
      documentTypeId: req.documentTypeId,
      propertyTypeId: req.propertyTypeId,
      versionLabel: `Additional ${existingCount}`,
    },
  });

  await prisma.fileNumberDocument.update({
    where: { fileNumberDocumentId: docs[0].fileNumberDocumentId },
    data: { fnDocRequirementId: newReq.fnDocRequirementId },
  });
};
