const sensitivePattern = /(OPENAI_API_KEY|authorization|bearer|api[_-]?key|token|password|secret|credential)\s*[:=]?\s*(?:bearer\s+)?([^\s,;]+)/gi;

export function redactSensitive(value: string): string {
  return value.replace(sensitivePattern, (_match, label) => `${label}=[REDACTED]`);
}