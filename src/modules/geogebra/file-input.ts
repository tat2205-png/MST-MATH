export type FoldInputKind = 'image'|'docx'|'pdf'|'text';
export function classifyFoldInput(fileName:string,mimeType=''):FoldInputKind|undefined { const ext=fileName.toLowerCase().split('.').pop(); if(['png','jpg','jpeg','webp'].includes(ext??'')||mimeType.startsWith('image/')) return 'image'; if(ext==='docx') return 'docx'; if(ext==='pdf'||mimeType==='application/pdf') return 'pdf'; return undefined; }
export function isSupportedFoldInput(fileName:string,mimeType=''):boolean { return classifyFoldInput(fileName,mimeType)!==undefined; }
