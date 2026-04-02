const zoneColors: Record<string, { ticket: string }> = {
  "VIP": { ticket: "#ffd700" },
  "Loca": { ticket: "#8a2be2" },
  "Kale Arkası Alt Kat": { ticket: "#32cd32" },
  "Alt Kat": { ticket: "#4169e1" },
  "Alt Kat Kenar": { ticket: "#ff0000" },
  "Üst Kat": { ticket: "#ff69b4" },
  "Üst Kat Kenar": { ticket: "#ff0000" },
  "Kale Arkası Üst Kat": { ticket: "#20b2aa" },
  "Misafir": { ticket: "#ff4500" },
};

export function getZoneColor(category: string | undefined | null): string {
  const c = (category ?? "").trim();
  if (!c) return "#7ac2ee";
  if (zoneColors[c]) return zoneColors[c].ticket;
  for (const [zoneName, colors] of Object.entries(zoneColors)) {
    if (c.includes(zoneName)) return colors.ticket;
  }
  return "#7ac2ee";
}
