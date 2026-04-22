function sanitizeOptionalText(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

function sanitizeCpf(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.replace(/\D/g, '');
  return normalized === '' ? undefined : normalized;
}

function hasMeaningfulUpdate(values: Array<string | undefined>): boolean {
  return values.some((value) => value !== undefined && value.trim() !== '');
}

export { sanitizeOptionalText, sanitizeCpf, hasMeaningfulUpdate };
