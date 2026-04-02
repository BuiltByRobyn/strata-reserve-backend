import type { Prisma } from '@prisma/client';
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

type DocumentListRow = Prisma.FileNumberDocumentGetPayload<{ include: typeof documentInclude }>;

/*
  Overlay status from the latest FileNumberDocumentReview per file — same source as Strata Detail checklist.
  Resolves fnDocRequirementId when missing on the row (some uploads only link via requirement.fileNumberDocuments).
  When a matching review item exists, it wins over file_number_document.review_status_id so the list matches Strata.
*/
const enrichDocumentsWithLatestReviewStatus = async (
  docs: DocumentListRow[]
): Promise<DocumentListRow[]> => {
  if (docs.length === 0) return docs;

  const fileIds = [...new Set(docs.map((d) => d.fileId))];
  const reviews = await prisma.fileNumberDocumentReview.findMany({
    where: { fileId: { in: fileIds } },
    orderBy: { reviewedAt: 'desc' },
    include: {
      items: {
        include: {
          reviewStatus: { select: { reviewStatusId: true, statusName: true } },
        },
      },
    },
  });

  const latestByFileId = new Map<number, (typeof reviews)[0]>();
  for (const r of reviews) {
    if (!latestByFileId.has(r.fileId)) {
      latestByFileId.set(r.fileId, r);
    }
  }

  const docIdsMissingReq = docs
    .filter((d) => d.fnDocRequirementId == null)
    .map((d) => d.fileNumberDocumentId);
  const docIdToReqId = new Map<number, number>();
  if (docIdsMissingReq.length > 0) {
    const reqsWithDoc = await prisma.fileNumberDocumentRequirement.findMany({
      where: {
        fileNumberDocuments: { some: { fileNumberDocumentId: { in: docIdsMissingReq } } },
      },
      select: {
        fnDocRequirementId: true,
        fileNumberDocuments: {
          where: { fileNumberDocumentId: { in: docIdsMissingReq } },
          select: { fileNumberDocumentId: true },
        },
      },
    });
    for (const rq of reqsWithDoc) {
      for (const fd of rq.fileNumberDocuments) {
        docIdToReqId.set(fd.fileNumberDocumentId, rq.fnDocRequirementId);
      }
    }
  }

  return docs.map((doc) => {
    const latest = latestByFileId.get(doc.fileId);
    if (!latest?.items?.length) return doc;
    const reqId = doc.fnDocRequirementId ?? docIdToReqId.get(doc.fileNumberDocumentId);
    if (reqId == null) return doc;
    const item = latest.items.find((i) => i.fnDocRequirementId === reqId);
    if (!item?.reviewStatus) return doc;
    return { ...doc, reviewStatus: item.reviewStatus };
  });
};

export const getDocuments = async () => {
  const docs = await prisma.fileNumberDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
  return enrichDocumentsWithLatestReviewStatus(docs);
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
  const docs = await prisma.fileNumberDocument.findMany({
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
  return enrichDocumentsWithLatestReviewStatus(docs);
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

  const [requirements, reviews, allDocuments] = await Promise.all([
    prisma.fileNumberDocumentRequirement.findMany({
      where: { fileId },
      include: requirementInclude,
      orderBy: { fnDocRequirementId: 'asc' },
    }),
    prisma.fileNumberDocumentReview.findMany({
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
    prisma.fileNumberDocument.findMany({
      where: { fileId, fnDocRequirementId: null },
      orderBy: { uploadedAt: 'desc' },
      select: {
        fileNumberDocumentId: true,
        fileName: true,
        filePath: true,
        uploadedAt: true,
        fnDocRequirementId: true,
        documentTypeId: true,
        propertyTypeId: true,
      },
    }),
  ]);

  const latestReview = reviews[0] ?? null;

  const reviewItemMap = new Map<number, { reviewedAt: string; reviewStatus: { reviewStatusId: number; statusName: string } | null; notes: string | null }>();
  for (let i = reviews.length - 1; i >= 0; i--) {
    const review = reviews[i];
    for (const item of review.items) {
      reviewItemMap.set(item.fnDocRequirementId, {
        reviewedAt: review.reviewedAt.toISOString(),
        reviewStatus: item.reviewStatus,
        notes: item.notes,
      });
    }
  }

  return requirements.map((req) => {
    const reviewItem = reviewItemMap.get(req.fnDocRequirementId);
    const linkedDoc = req.fileNumberDocuments[0] ?? null;
    const fallbackDoc = !linkedDoc
      ? allDocuments.find(d => d.documentTypeId === req.documentTypeId && d.propertyTypeId === req.propertyTypeId) ?? null
      : null;
    const doc = linkedDoc || fallbackDoc;

    // If a document was uploaded after N/A was set, the document takes precedence
    const naSetAt = req.naStatus?.setAt?.toISOString() ?? null;
    const docOverridesNa = doc && naSetAt && new Date(doc.uploadedAt) > new Date(naSetAt);

    return {
      fnDocRequirementId: req.fnDocRequirementId,
      fileId: req.fileId,
      documentTypeId: req.documentTypeId,
      propertyTypeId: req.propertyTypeId,
      versionLabel: req.versionLabel,
      documentType: req.documentType,
      propertyType: req.propertyType,
      naStatus: docOverridesNa ? null : (req.naStatus?.status ?? null),
      naStatusSetAt: docOverridesNa ? null : naSetAt,
      uploadedDocument: doc,
      reviewId: latestReview?.reviewId ?? null,
      reviewedAt: reviewItem?.reviewedAt ?? null,
      reviewStatus: reviewItem?.reviewStatus ?? null,
      denialNote: reviewItem?.notes ?? null,
    };
  });
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

    for (const item of items) {
      const latestDoc = await tx.fileNumberDocument.findFirst({
        where: { fileId, fnDocRequirementId: item.fnDocRequirementId },
        orderBy: { uploadedAt: 'desc' },
        select: { fileNumberDocumentId: true },
      });
      if (latestDoc) {
        await tx.fileNumberDocument.update({
          where: { fileNumberDocumentId: latestDoc.fileNumberDocumentId },
          data: { reviewStatusId: item.reviewStatusId },
        });
      }
    }

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
          submittedForReviewDate: true,
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
        strataNumber: fn?.strata?.strataPlan || '',
        finalizedDate,
      }).catch((err) => console.error('Failed to send documents finalized email:', err));
    }

    emailService.sendAdminDocumentsFinalizedEmail({
      fileNumber: fn?.fileNumber || '',
      strataNumber: fn?.strata?.strataPlan || '',
      propertyAddress,
      clientName,
      documentCount: review.items.length,
      finalizedBy,
      surveyCompleted: fn?.submittedForReviewDate ? 'Yes' : 'No',
    }).catch((err) => console.error('Failed to send admin documents finalized email:', err));
  }

  return review;
};

export const getLatestDocumentReview = async (fileId: number) => {
  const requirements = await prisma.fileNumberDocumentRequirement.findMany({
    where: { fileId },
    include: requirementInclude,
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


export const createAdminDocResubmittedNotification = async (fileId: number) => {
  const latestReview = await prisma.fileNumberDocumentReview.findFirst({
    where: { fileId },
    orderBy: { reviewedAt: 'desc' },
    include: {
      items: {
        include: {
          reviewStatus: { select: { statusName: true } },
          requirement: {
            select: {
              fnDocRequirementId: true,
              fileNumberDocuments: {
                select: { uploadedAt: true },
                orderBy: { uploadedAt: 'desc' },
                take: 1,
              },
              naStatus: { select: { naStatusId: true, setAt: true } },
            },
          },
        },
      },
    },
  });

  if (!latestReview) return;

  const rejectedItems = latestReview.items.filter((item) =>
    /deny|reject/i.test(item.reviewStatus.statusName)
  );
  if (rejectedItems.length === 0) return;

  const allRejectedAddressed = rejectedItems.every((item) => {
    const req = item.requirement;
    const hasNewUpload = req.fileNumberDocuments.length > 0
      && req.fileNumberDocuments[0].uploadedAt > latestReview.reviewedAt;
    const hasNaAfterDenial = req.naStatus !== null
      && req.naStatus.setAt != null
      && req.naStatus.setAt > latestReview.reviewedAt;
    return hasNewUpload || hasNaAfterDenial;
  });
  if (!allRejectedAddressed) return;

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
) => {
  const fileNumberRecord = await prisma.fileNumber.findUnique({
    where: { fileId },
    select: {
      strata: {
        select: {
          strataPlan: true,
          complexName: true,
          strataProfiles: {
            select: { profile: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!fileNumberRecord) return;

  const strataName = fileNumberRecord.strata.complexName || fileNumberRecord.strata.strataPlan || '';
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
