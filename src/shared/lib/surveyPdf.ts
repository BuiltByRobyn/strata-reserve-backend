import PDFDocument from 'pdfkit';

export interface SurveyPdfMeta {
  serviceRequestId: number;
  strataPlan?: string | null;
  complexName?: string | null;
  serviceName?: string | null;
  status?: string | null;
  requestDate?: string | null;
  generatedAtIso?: string;
}

export interface FlatSurveyQuestion {
  srSurveyQuestionId: number;
  propertyTypeId: number;
  propertyTypeName: string;
  questionId: number;
  parentQuestionId: number | null;
  subLabel: string | null;
  questionText: string;
  isRequired: boolean;
  informationText: string | null;
  questionCategory: string;
  questionType: string;
  sortOrder: number;
  multipleChoiceOptions: Array<{ optionId: number; optionText: string; sortOrder: number }>;
}

export interface ActiveSurveyResponse {
  questionId: number;
  propertyTypeId: number;
  responseText: string | null;
  responseDate: string | null;
  responseNumber: number | null;
  responseBoolean: boolean | null;
  multipleChoiceOptionId: number | null;
}

function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function answerToText(q: FlatSurveyQuestion, resp?: ActiveSurveyResponse): string {
  if (!resp) return 'No answer';

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
    return resp.responseDate ? formatDate(resp.responseDate) : 'No answer';
  }

  if (type === 'none_or_explain') {
    if (!resp.responseText) return 'No answer';
    return resp.responseText === 'NONE' ? 'None' : resp.responseText;
  }

  return resp.responseText?.trim() ? resp.responseText : 'No answer';
}

export async function renderSurveyAnswersPdf(
  meta: SurveyPdfMeta,
  questions: FlatSurveyQuestion[],
  responses: ActiveSurveyResponse[]
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const chunks: Buffer[] = [];

  const responseMap = new Map<string, ActiveSurveyResponse>();
  for (const r of responses) {
    responseMap.set(`${r.questionId}-${r.propertyTypeId}`, r);
  }

  const getResp = (questionId: number, propertyTypeId: number) => {
    return responseMap.get(`${questionId}-${propertyTypeId}`);
  };

  const parents = questions
    .filter(q => q.parentQuestionId == null)
    .sort((a, b) => {
      if (a.questionCategory !== b.questionCategory) return a.questionCategory.localeCompare(b.questionCategory);
      if (a.propertyTypeName !== b.propertyTypeName) return a.propertyTypeName.localeCompare(b.propertyTypeName);
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

  const headerLine = (label: string, value: string) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(value);
  };

  doc.font('Helvetica-Bold').fontSize(18).text('Survey Answers', { align: 'center' });
  doc.moveDown(0.75);

  doc.fontSize(10);
  headerLine('Service Request', String(meta.serviceRequestId));
  headerLine('Strata Plan', meta.strataPlan || 'N/A');
  if (meta.complexName) headerLine('Complex', meta.complexName);
  if (meta.serviceName) headerLine('Service', meta.serviceName);
  if (meta.status) headerLine('Status', meta.status);
  if (meta.requestDate) headerLine('Requested', formatDate(meta.requestDate));
  headerLine('Generated', formatDate(meta.generatedAtIso || new Date().toISOString()));

  doc.moveDown(1);

  let currentCategory: string | null = null;
  let currentPropertyType: string | null = null;

  for (const q of parents) {
    if (q.questionCategory !== currentCategory) {
      currentCategory = q.questionCategory;
      currentPropertyType = null;
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(14).text(currentCategory);
      doc.moveDown(0.25);
    }

    if (q.propertyTypeName !== currentPropertyType) {
      currentPropertyType = q.propertyTypeName;
      doc.moveDown(0.25);
      doc.font('Helvetica-Bold').fontSize(12).text(currentPropertyType, { indent: 10 });
      doc.moveDown(0.15);
    }

    doc.font('Helvetica-Bold').fontSize(10).text(`Q: ${q.questionText}`, { indent: 20 });
    doc.font('Helvetica').fontSize(10).text(`A: ${answerToText(q, getResp(q.questionId, q.propertyTypeId))}`, { indent: 30 });

    const sub = subByParent.get(`${q.questionId}-${q.propertyTypeId}`) ?? [];
    if (sub.length > 0) {
      for (const sq of sub) {
        const label = sq.subLabel ? `${sq.subLabel}. ` : '';
        doc.font('Helvetica-Bold').fontSize(9).text(`${label}${sq.questionText}`, { indent: 30 });
        doc.font('Helvetica').fontSize(9).text(`Answer: ${answerToText(sq, getResp(sq.questionId, sq.propertyTypeId))}`, { indent: 40 });
      }
    }

    doc.moveDown(0.4);
  }

  doc.end();
  return endPromise;
}
