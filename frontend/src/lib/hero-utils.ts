export type HeroFields = {
  backgroundImageUrl?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  dateText?: string;
  timeText?: string;
  venue?: string;
  description?: string;
  ticketLink?: string;
};

/** Sunucudan anlamlı hero gelip gelmediği (Takım A/B sahte metni göstermemek için) */
export function isHeroRenderable(hero: HeroFields | null | undefined): boolean {
  if (!hero || typeof hero !== "object") return false;
  const bg = hero.backgroundImageUrl?.trim();
  const a = hero.homeTeamName?.trim();
  const b = hero.awayTeamName?.trim();
  const hasTeams = Boolean(a && b);
  const hasWhen = Boolean(hero.dateText?.trim() || hero.timeText?.trim() || hero.venue?.trim());
  const hasDesc = Boolean(hero.description?.trim());
  if (bg) return true;
  if (hasTeams) return true;
  if (hasWhen || hasDesc) return true;
  return false;
}

export function hasBothTeamNames(hero: HeroFields | null | undefined): boolean {
  return Boolean(hero?.homeTeamName?.trim() && hero?.awayTeamName?.trim());
}
