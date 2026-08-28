export interface XmlNode {
  name: string;
  attributes: Record<string, string>;
  children: Array<XmlNode | string>;
}

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_match, entity: string) => {
    if (entity[0] === "#") {
      const hex = entity[1]?.toLowerCase() === "x";
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "�";
    }
    return XML_ENTITIES[entity.toLowerCase()] ?? _match;
  });
}

export function localName(name: string): string {
  const separator = name.indexOf(":");
  return separator === -1 ? name : name.slice(separator + 1);
}

export function getAttribute(node: XmlNode | undefined, name: string): string | undefined {
  if (!node) return undefined;
  return Object.entries(node.attributes).find(([key]) => key === name || localName(key) === name)?.[1];
}

export function childElements(node: XmlNode, name?: string): XmlNode[] {
  return node.children.filter((child): child is XmlNode => typeof child !== "string" && (name === undefined || localName(child.name) === name));
}

export function descendants(node: XmlNode, name?: string): XmlNode[] {
  const result: XmlNode[] = [];
  for (const child of childElements(node)) {
    if (name === undefined || localName(child.name) === name) result.push(child);
    result.push(...descendants(child, name));
  }
  return result;
}

export function textContent(node: XmlNode): string {
  return node.children.map((child) => typeof child === "string" ? child : textContent(child)).join("");
}

export function parseXml(xml: string): XmlNode {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("XML_DTD_FORBIDDEN");
  const root: XmlNode = { name: "#document", attributes: {}, children: [] };
  const stack = [root];
  const tokenPattern = /<\?[^]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<([^>]+)>|([^<]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(xml)) !== null) {
    if (match[1] !== undefined) { stack.at(-1)!.children.push(match[1]); continue; }
    if (match[3] !== undefined) { stack.at(-1)!.children.push(decodeEntities(match[3])); continue; }
    if (match[2] === undefined) continue;
    const token = match[2].trim();
    if (!token || token.startsWith("!") || token.startsWith("?")) continue;
    if (token.startsWith("/")) {
      const closing = token.slice(1).trim();
      const current = stack.pop();
      if (!current || current === root || current.name !== closing) throw new Error(`XML_MISMATCHED_TAG:${closing}`);
      continue;
    }
    const selfClosing = token.endsWith("/");
    const body = selfClosing ? token.slice(0, -1).trim() : token;
    const nameMatch = /^([^\s/>]+)/.exec(body);
    if (!nameMatch) throw new Error("XML_INVALID_TAG");
    const node: XmlNode = { name: nameMatch[1], attributes: {}, children: [] };
    const attrText = body.slice(nameMatch[0].length);
    const attrPattern = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let attr: RegExpExecArray | null;
    while ((attr = attrPattern.exec(attrText)) !== null) node.attributes[attr[1]] = decodeEntities(attr[3] ?? attr[4] ?? "");
    const residue = attrText.replace(attrPattern, "").trim();
    if (residue) throw new Error(`XML_INVALID_ATTRIBUTE:${residue}`);
    stack.at(-1)!.children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`XML_UNCLOSED_TAG:${stack.at(-1)!.name}`);
  const documentElement = childElements(root)[0];
  if (!documentElement) throw new Error("XML_MISSING_ROOT");
  return documentElement;
}
