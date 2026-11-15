const ALLOWED = Object.freeze({
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
/**
 * Identify the declared upload type consistently across browsers. Supabase Storage
 * checks the content type and maximum bytes again on the server.
 * Extension/MIME checks do not replace antivirus or content inspection.
 */
export function validateTradeDocument(file) {
  if (!file || typeof file.name !== 'string') throw new Error('Choose a document to upload.');
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error('Document must be between 1 byte and 10 MB.');
  const ext = file.name.trim().toLowerCase().split('.').pop();
  if (!Object.hasOwn(ALLOWED, ext))
    throw new Error('Allowed documents: PDF, JPG, PNG, WEBP, CSV or XLSX.');
  if (file.name.includes('/') || file.name.includes('\\'))
    throw new Error('Invalid document filename.');
  const declared = String(file.type || '').toLowerCase();
  const expected = ALLOWED[ext];
  const compatible = !declared || declared === expected ||
    (ext === 'csv' && ['application/vnd.ms-excel', 'application/csv', 'text/plain'].includes(declared)) ||
    (ext === 'xlsx' && declared === 'application/zip') ||
    (['jpg', 'jpeg'].includes(ext) && declared === 'image/jpg');
  if (!compatible) throw new Error('The file type does not match its extension.');
  return {contentType: expected, extension: ext};
}
