export function decodeGeoGebraBase64(base64: string): Uint8Array {
  if (!base64.trim()) throw new Error('GEOGEBRA_EXPORT_EMPTY');
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  if (!bytes.length) throw new Error('GEOGEBRA_EXPORT_EMPTY');
  return bytes;
}
export function createGeoGebraDownload(base64: string, filename = 'NA_MATH_Khay_Chop_Cut_8dm_3dm_Fold.ggb'): HTMLAnchorElement {
  const blob = new Blob([decodeGeoGebraBase64(base64)], { type: 'application/vnd.geogebra.file' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; return link;
}
