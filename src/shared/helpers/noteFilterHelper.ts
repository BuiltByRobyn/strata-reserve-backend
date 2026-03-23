const REJECTED_STATUS = 'Rejected';

export const filterClientDocumentNotes = <
  T extends { notes: string | null; reviewStatus?: { statusName: string } | null }
>(doc: T): T => ({
  ...doc,
  notes: doc.reviewStatus?.statusName === REJECTED_STATUS ? doc.notes : null,
});
