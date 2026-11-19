/** Téléphone réduit à ses chiffres, au format national (« 06… »), pour retrouver une fiche client. */
export function phoneKey(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0033")) d = d.slice(2);
  if (d.startsWith("33") && d.length === 11) d = `0${d.slice(2)}`;
  return d.length >= 6 ? d : "";
}
