export type NavItem = {
  id: string;
  name: string;
  link: string;
  hasDropdown: boolean;
  subItems?: { name: string; link: string }[];
};

export const navigationItems: NavItem[] = [
  {
    id: "futbol",
    name: "Futbol",
    link: "/kategori/futbol",
    hasDropdown: true,
    subItems: [
      { name: "Süper Lig", link: "/kategori/trendyol-superlig" },
      { name: "Şampiyonlar Ligi", link: "/kategori/uefa-sampiyonlar-ligi" },
      { name: "Uefa Avrupa Ligi", link: "/kategori/uefa-avrupa-ligi" },
      { name: "Konferans Ligi", link: "/kategori/uefa-konferans-ligi" },
      { name: "Galatasaray", link: "/kategori/galatasaray" },
      { name: "Fenerbahçe", link: "/kategori/fenerbahce" },
      { name: "Beşiktaş", link: "/kategori/besiktas" },
    ],
  },
  {
    id: "basketbol",
    name: "Basketbol",
    link: "/kategori/basketbol",
    hasDropdown: true,
    subItems: [
      { name: "Basketbol Süper Ligi", link: "/kategori/basketbol-super-ligi" },
      { name: "Euroleague", link: "/kategori/euroleague" },
      { name: "Fenerbahçe Basketbol", link: "/kategori/fenerbahce-basketbol" },
      { name: "Anadolu Efes", link: "/kategori/anadolu-efes" },
    ],
  },
  {
    id: "konserler",
    name: "Konserler",
    link: "/kategori/konser",
    hasDropdown: false,
  },
];
