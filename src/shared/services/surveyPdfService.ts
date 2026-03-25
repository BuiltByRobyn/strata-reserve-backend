import PDFDocument from 'pdfkit';
import type { SurveyPdfMeta, FlatSurveyQuestion, ActiveSurveyResponse } from '../types/surveyPdf.types';
import { formatDateLong } from '../helpers/dateUtils';

export type { SurveyPdfMeta, FlatSurveyQuestion, ActiveSurveyResponse };

function answerToText(q: FlatSurveyQuestion, resp?: ActiveSurveyResponse): string {
  if (!resp) return 'No answer';
  if (resp.responseText === 'NOT_APPLICABLE') return 'Not Applicable';
  if (resp.responseText === 'UNKNOWN') return 'Unknown';

  const type = q.questionType;

  if (type === 'boolean') {
    if (resp.responseBoolean === true) return 'Yes';
    if (resp.responseBoolean === false) return 'No';
    return 'No answer';
  }

  if (type === 'multiple_choice') {
    if (resp.multipleChoiceOptionId == null) return 'No answer';
    const opt = q.multipleChoiceOptions.find(o => o.optionId === resp.multipleChoiceOptionId);
    return opt?.optionText || `Option ${resp.multipleChoiceOptionId}`;
  }

  if (type === 'checkbox') {
    const raw = resp.responseText || '';
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return 'No answer';
    const labels = ids.map((id) => {
      const num = Number(id);
      const opt = Number.isFinite(num)
        ? q.multipleChoiceOptions.find(o => o.optionId === num)
        : undefined;
      return opt?.optionText || id;
    });
    return labels.join(', ');
  }

  if (type === 'number') {
    return resp.responseNumber != null ? String(resp.responseNumber) : 'No answer';
  }

  if (type === 'date') {
    return resp.responseDate ? formatDateLong(resp.responseDate) : 'No answer';
  }

return resp.responseText?.trim() ? resp.responseText : 'No answer';
}

export async function renderSurveyAnswersPdf(
  meta: SurveyPdfMeta,
  questions: FlatSurveyQuestion[],
  responses: ActiveSurveyResponse[],
  mode: 'client' | 'admin' = 'admin'
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const chunks: Buffer[] = [];

  const responseMap = new Map<string, ActiveSurveyResponse>();
  for (const r of responses) {
    responseMap.set(`${r.parentQuestionId ?? ''}-${r.questionId}-${r.propertyTypeId}`, r);
  }

  const getResp = (questionId: number, propertyTypeId: number, parentQuestionId?: number | null) => {
    return responseMap.get(`${parentQuestionId ?? ''}-${questionId}-${propertyTypeId}`);
  };

  const parents = questions
    .filter(q => q.parentQuestionId == null)
    .sort((a, b) => {
      if (a.propertyTypeName !== b.propertyTypeName) return a.propertyTypeName.localeCompare(b.propertyTypeName);
      if (a.questionCategory !== b.questionCategory) return a.questionCategory.localeCompare(b.questionCategory);
      return (a.sortOrder ?? a.questionId) - (b.sortOrder ?? b.questionId);
    });

  const subByParent = new Map<string, FlatSurveyQuestion[]>();
  for (const q of questions) {
    if (q.parentQuestionId == null) continue;
    const key = `${q.parentQuestionId}-${q.propertyTypeId}`;
    const list = subByParent.get(key) ?? [];
    list.push(q);
    subByParent.set(key, list);
  }
  for (const [, list] of subByParent) {
    list.sort((a, b) => (a.sortOrder ?? a.questionId) - (b.sortOrder ?? b.questionId));
  }

  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const PAGE_MARGIN = 50;

  const COLS = 3;
  const colWidth = (doc.page.width - PAGE_MARGIN * 2) / COLS;

  const CONTENT_LEFT = PAGE_MARGIN;
  const CONTENT_WIDTH = doc.page.width - PAGE_MARGIN * 2;
  const BOX_LEFT = CONTENT_LEFT;
  const BOX_WIDTH = CONTENT_WIDTH;
  const PAGE_BOTTOM = doc.page.height - PAGE_MARGIN;

  // Ensure enough vertical space remains; if not, start a new page
  const ensureSpace = (needed: number) => {
    if (doc.y + needed > PAGE_BOTTOM) {
      doc.addPage();
    }
  };

  // Renders the title + header grid for a property type section
  const renderPageHeader = (propertyTypeName: string) => {
    doc.font('Helvetica-Bold').fontSize(18).text('Survey Answers', { align: 'center', underline: true });
    doc.moveDown(1.5);

    const headerFields: { label: string; value: string }[] = [
      { label: 'Strata Plan', value: meta.strataPlan || 'N/A' },
    ];
    if (meta.complexName) headerFields.push({ label: 'Complex', value: meta.complexName });
    if (meta.serviceName) headerFields.push({ label: 'Service', value: meta.serviceName });
    if (meta.fileNumber) headerFields.push({ label: 'File Number', value: meta.fileNumber });
    if (meta.requestDate) headerFields.push({ label: 'Requested', value: formatDateLong(meta.requestDate) });
    headerFields.push({ label: 'Property Type', value: propertyTypeName });

    doc.fontSize(10);
    for (let i = 0; i < headerFields.length; i += COLS) {
      const rowY = doc.y;
      for (let j = 0; j < COLS && i + j < headerFields.length; j++) {
        const field = headerFields[i + j];
        const x = PAGE_MARGIN + j * colWidth;
        doc.font('Helvetica-Bold').text(`${field.label}: `, x, rowY, { continued: true, width: colWidth });
        doc.font('Helvetica').text(field.value);
      }
      doc.y = rowY + 16;
    }

    doc.moveDown(1);
  };

  // Show property type headings when admin, or when client has multiple property types
  const distinctPropertyTypes = new Set(parents.map(q => q.propertyTypeName));
  const showPropertyHeaders = mode === 'admin' || distinctPropertyTypes.size > 1;

  let currentCategory: string | null = null;
  let currentPropertyType: string | null = null;
  let isFirstPropertyType = true;

  for (const q of parents) {
    // Property type changed → new page with header
    if (q.propertyTypeName !== currentPropertyType) {
      currentPropertyType = q.propertyTypeName;
      currentCategory = null;
      if (isFirstPropertyType) {
        isFirstPropertyType = false;
      } else {
        doc.addPage();
      }
      renderPageHeader(currentPropertyType);
    }

    // Category/section changed → grey separator line + section header
    if (q.questionCategory !== currentCategory) {
      // Grey line before every section (including the first)
      doc.moveDown(1.5);
      const lineY = doc.y;
      doc.strokeColor('#cccccc').lineWidth(0.5)
        .moveTo(CONTENT_LEFT, lineY)
        .lineTo(CONTENT_LEFT + CONTENT_WIDTH, lineY)
        .stroke();
      doc.y = lineY + 20;

      currentCategory = q.questionCategory;
      doc.font('Helvetica-Bold').fontSize(12).text(currentCategory, CONTENT_LEFT, doc.y, { width: CONTENT_WIDTH });
      doc.moveDown(1.5);
    }

    // Ensure question + answer box fit on current page
    ensureSpace(100);
    doc.font('Helvetica-Bold').fontSize(10).text(q.questionText, BOX_LEFT, doc.y, { width: BOX_WIDTH });
    doc.moveDown(0.6);

    const answerText = answerToText(q, getResp(q.questionId, q.propertyTypeId));
    if (answerText === 'No answer') {
      ensureSpace(80);
      const boxY = doc.y;
      const boxH = 80;
      doc.rect(BOX_LEFT, boxY, BOX_WIDTH, boxH).lineWidth(0.5).strokeColor('#cccccc').stroke();
      doc.y = boxY + boxH;
    } else {
      doc.font('Helvetica').fontSize(10).text(answerText, BOX_LEFT, doc.y, { width: BOX_WIDTH });
    }

    const parentResp = getResp(q.questionId, q.propertyTypeId);
    const parentFlagged = parentResp?.responseText === 'NOT_APPLICABLE' || parentResp?.responseText === 'UNKNOWN';
    const sub = parentFlagged ? [] : (subByParent.get(`${q.questionId}-${q.propertyTypeId}`) ?? []);
    if (sub.length > 0) {
      doc.moveDown(1.5);
      for (const sq of sub) {
        const label = sq.subLabel ? `${sq.subLabel}. ` : '';
        ensureSpace(80);
        doc.font('Helvetica').fontSize(9).text(`${label}${sq.questionText}`, BOX_LEFT, doc.y, { width: BOX_WIDTH });
        doc.moveDown(0.6);

        const subAnswerText = answerToText(sq, getResp(sq.questionId, sq.propertyTypeId, sq.parentQuestionId));
        if (subAnswerText === 'No answer') {
          ensureSpace(60);
          const boxY = doc.y;
          const boxH = 60;
          doc.rect(BOX_LEFT, boxY, BOX_WIDTH, boxH).lineWidth(0.5).strokeColor('#cccccc').stroke();
          doc.y = boxY + boxH;
        } else {
          doc.font('Helvetica').fontSize(9).text(`Answer: ${subAnswerText}`, BOX_LEFT, doc.y, { width: BOX_WIDTH });
        }
        doc.moveDown(1.5);
      }
    }

    doc.moveDown(2.5);
  }

  if (mode === 'client') {
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(14).text('Submission Instructions', CONTENT_LEFT, doc.y, { width: CONTENT_WIDTH });
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(11).text(
      'Once completed please email to clientcare@stratareserveplanning.com, or mail to our regional office in Vancouver 720-999 West Broadway, Vancouver, BC V5Z 1J5',
      CONTENT_LEFT,
      doc.y,
      { width: CONTENT_WIDTH }
    );
  }

  doc.end();
  return endPromise;
}
