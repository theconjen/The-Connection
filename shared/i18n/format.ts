export function fmtDate(timeISO: string | number | Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timeISO));
}

export function fmtNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n);
}

export function fmtCurrency(n: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
}
