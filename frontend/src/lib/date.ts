export function formatDateTR(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  return `${day} ${months[month]} ${year}`;
}

export function formatTimeTR(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}
