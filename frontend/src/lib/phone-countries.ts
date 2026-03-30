import type { Locale } from "@/i18n";

export type PhoneCountry = {
  iso: string;
  dial: string;
  flag: string;
  nameTr: string;
  nameEn: string;
};

/** TR önde; geri kalan İngilizce ada göre sıralı */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "TR", dial: "+90", flag: "🇹🇷", nameTr: "Türkiye", nameEn: "Turkey" },
  { iso: "AF", dial: "+93", flag: "🇦🇫", nameTr: "Afganistan", nameEn: "Afghanistan" },
  { iso: "AL", dial: "+355", flag: "🇦🇱", nameTr: "Arnavutluk", nameEn: "Albania" },
  { iso: "DZ", dial: "+213", flag: "🇩🇿", nameTr: "Cezayir", nameEn: "Algeria" },
  { iso: "AD", dial: "+376", flag: "🇦🇩", nameTr: "Andorra", nameEn: "Andorra" },
  { iso: "AO", dial: "+244", flag: "🇦🇴", nameTr: "Angola", nameEn: "Angola" },
  { iso: "AR", dial: "+54", flag: "🇦🇷", nameTr: "Arjantin", nameEn: "Argentina" },
  { iso: "AM", dial: "+374", flag: "🇦🇲", nameTr: "Ermenistan", nameEn: "Armenia" },
  { iso: "AU", dial: "+61", flag: "🇦🇺", nameTr: "Avustralya", nameEn: "Australia" },
  { iso: "AT", dial: "+43", flag: "🇦🇹", nameTr: "Avusturya", nameEn: "Austria" },
  { iso: "AZ", dial: "+994", flag: "🇦🇿", nameTr: "Azerbaycan", nameEn: "Azerbaijan" },
  { iso: "BS", dial: "+1", flag: "🇧🇸", nameTr: "Bahamalar", nameEn: "Bahamas" },
  { iso: "BH", dial: "+973", flag: "🇧🇭", nameTr: "Bahreyn", nameEn: "Bahrain" },
  { iso: "BD", dial: "+880", flag: "🇧🇩", nameTr: "Bangladeş", nameEn: "Bangladesh" },
  { iso: "BY", dial: "+375", flag: "🇧🇾", nameTr: "Belarus", nameEn: "Belarus" },
  { iso: "BE", dial: "+32", flag: "🇧🇪", nameTr: "Belçika", nameEn: "Belgium" },
  { iso: "BZ", dial: "+501", flag: "🇧🇿", nameTr: "Belize", nameEn: "Belize" },
  { iso: "BJ", dial: "+229", flag: "🇧🇯", nameTr: "Benin", nameEn: "Benin" },
  { iso: "BT", dial: "+975", flag: "🇧🇹", nameTr: "Butan", nameEn: "Bhutan" },
  { iso: "BO", dial: "+591", flag: "🇧🇴", nameTr: "Bolivya", nameEn: "Bolivia" },
  { iso: "BA", dial: "+387", flag: "🇧🇦", nameTr: "Bosna-Hersek", nameEn: "Bosnia and Herzegovina" },
  { iso: "BW", dial: "+267", flag: "🇧🇼", nameTr: "Botsvana", nameEn: "Botswana" },
  { iso: "BR", dial: "+55", flag: "🇧🇷", nameTr: "Brezilya", nameEn: "Brazil" },
  { iso: "BN", dial: "+673", flag: "🇧🇳", nameTr: "Brunei", nameEn: "Brunei" },
  { iso: "BG", dial: "+359", flag: "🇧🇬", nameTr: "Bulgaristan", nameEn: "Bulgaria" },
  { iso: "BF", dial: "+226", flag: "🇧🇫", nameTr: "Burkina Faso", nameEn: "Burkina Faso" },
  { iso: "BI", dial: "+257", flag: "🇧🇮", nameTr: "Burundi", nameEn: "Burundi" },
  { iso: "KH", dial: "+855", flag: "🇰🇭", nameTr: "Kamboçya", nameEn: "Cambodia" },
  { iso: "CM", dial: "+237", flag: "🇨🇲", nameTr: "Kamerun", nameEn: "Cameroon" },
  { iso: "CA", dial: "+1", flag: "🇨🇦", nameTr: "Kanada", nameEn: "Canada" },
  { iso: "CV", dial: "+238", flag: "🇨🇻", nameTr: "Yeşil Burun", nameEn: "Cape Verde" },
  { iso: "CL", dial: "+56", flag: "🇨🇱", nameTr: "Şili", nameEn: "Chile" },
  { iso: "CN", dial: "+86", flag: "🇨🇳", nameTr: "Çin", nameEn: "China" },
  { iso: "CO", dial: "+57", flag: "🇨🇴", nameTr: "Kolombiya", nameEn: "Colombia" },
  { iso: "CR", dial: "+506", flag: "🇨🇷", nameTr: "Kosta Rika", nameEn: "Costa Rica" },
  { iso: "HR", dial: "+385", flag: "🇭🇷", nameTr: "Hırvatistan", nameEn: "Croatia" },
  { iso: "CY", dial: "+357", flag: "🇨🇾", nameTr: "Kıbrıs", nameEn: "Cyprus" },
  { iso: "CZ", dial: "+420", flag: "🇨🇿", nameTr: "Çekya", nameEn: "Czechia" },
  { iso: "DK", dial: "+45", flag: "🇩🇰", nameTr: "Danimarka", nameEn: "Denmark" },
  { iso: "DO", dial: "+1", flag: "🇩🇴", nameTr: "Dominik Cumhuriyeti", nameEn: "Dominican Republic" },
  { iso: "EC", dial: "+593", flag: "🇪🇨", nameTr: "Ekvador", nameEn: "Ecuador" },
  { iso: "EG", dial: "+20", flag: "🇪🇬", nameTr: "Mısır", nameEn: "Egypt" },
  { iso: "SV", dial: "+503", flag: "🇸🇻", nameTr: "El Salvador", nameEn: "El Salvador" },
  { iso: "EE", dial: "+372", flag: "🇪🇪", nameTr: "Estonya", nameEn: "Estonia" },
  { iso: "SZ", dial: "+268", flag: "🇸🇿", nameTr: "Esvatini", nameEn: "Eswatini" },
  { iso: "ET", dial: "+251", flag: "🇪🇹", nameTr: "Etiyopya", nameEn: "Ethiopia" },
  { iso: "FI", dial: "+358", flag: "🇫🇮", nameTr: "Finlandiya", nameEn: "Finland" },
  { iso: "FR", dial: "+33", flag: "🇫🇷", nameTr: "Fransa", nameEn: "France" },
  { iso: "GE", dial: "+995", flag: "🇬🇪", nameTr: "Gürcistan", nameEn: "Georgia" },
  { iso: "DE", dial: "+49", flag: "🇩🇪", nameTr: "Almanya", nameEn: "Germany" },
  { iso: "GH", dial: "+233", flag: "🇬🇭", nameTr: "Gana", nameEn: "Ghana" },
  { iso: "GR", dial: "+30", flag: "🇬🇷", nameTr: "Yunanistan", nameEn: "Greece" },
  { iso: "GT", dial: "+502", flag: "🇬🇹", nameTr: "Guatemala", nameEn: "Guatemala" },
  { iso: "HN", dial: "+504", flag: "🇭🇳", nameTr: "Honduras", nameEn: "Honduras" },
  { iso: "HK", dial: "+852", flag: "🇭🇰", nameTr: "Hong Kong", nameEn: "Hong Kong" },
  { iso: "HU", dial: "+36", flag: "🇭🇺", nameTr: "Macaristan", nameEn: "Hungary" },
  { iso: "IS", dial: "+354", flag: "🇮🇸", nameTr: "İzlanda", nameEn: "Iceland" },
  { iso: "IN", dial: "+91", flag: "🇮🇳", nameTr: "Hindistan", nameEn: "India" },
  { iso: "ID", dial: "+62", flag: "🇮🇩", nameTr: "Endonezya", nameEn: "Indonesia" },
  { iso: "IR", dial: "+98", flag: "🇮🇷", nameTr: "İran", nameEn: "Iran" },
  { iso: "IQ", dial: "+964", flag: "🇮🇶", nameTr: "Irak", nameEn: "Iraq" },
  { iso: "IE", dial: "+353", flag: "🇮🇪", nameTr: "İrlanda", nameEn: "Ireland" },
  { iso: "IL", dial: "+972", flag: "🇮🇱", nameTr: "İsrail", nameEn: "Israel" },
  { iso: "IT", dial: "+39", flag: "🇮🇹", nameTr: "İtalya", nameEn: "Italy" },
  { iso: "CI", dial: "+225", flag: "🇨🇮", nameTr: "Fildişi Sahili", nameEn: "Ivory Coast" },
  { iso: "JM", dial: "+1", flag: "🇯🇲", nameTr: "Jamaika", nameEn: "Jamaica" },
  { iso: "JP", dial: "+81", flag: "🇯🇵", nameTr: "Japonya", nameEn: "Japan" },
  { iso: "JO", dial: "+962", flag: "🇯🇴", nameTr: "Ürdün", nameEn: "Jordan" },
  { iso: "KZ", dial: "+7", flag: "🇰🇿", nameTr: "Kazakistan", nameEn: "Kazakhstan" },
  { iso: "KE", dial: "+254", flag: "🇰🇪", nameTr: "Kenya", nameEn: "Kenya" },
  { iso: "XK", dial: "+383", flag: "🇽🇰", nameTr: "Kosova", nameEn: "Kosovo" },
  { iso: "KW", dial: "+965", flag: "🇰🇼", nameTr: "Kuveyt", nameEn: "Kuwait" },
  { iso: "KG", dial: "+996", flag: "🇰🇬", nameTr: "Kırgızistan", nameEn: "Kyrgyzstan" },
  { iso: "LA", dial: "+856", flag: "🇱🇦", nameTr: "Laos", nameEn: "Laos" },
  { iso: "LV", dial: "+371", flag: "🇱🇻", nameTr: "Letonya", nameEn: "Latvia" },
  { iso: "LB", dial: "+961", flag: "🇱🇧", nameTr: "Lübnan", nameEn: "Lebanon" },
  { iso: "LY", dial: "+218", flag: "🇱🇾", nameTr: "Libya", nameEn: "Libya" },
  { iso: "LI", dial: "+423", flag: "🇱🇮", nameTr: "Liechtenstein", nameEn: "Liechtenstein" },
  { iso: "LT", dial: "+370", flag: "🇱🇹", nameTr: "Litvanya", nameEn: "Lithuania" },
  { iso: "LU", dial: "+352", flag: "🇱🇺", nameTr: "Lüksemburg", nameEn: "Luxembourg" },
  { iso: "MO", dial: "+853", flag: "🇲🇴", nameTr: "Makao", nameEn: "Macau" },
  { iso: "MG", dial: "+261", flag: "🇲🇬", nameTr: "Madagaskar", nameEn: "Madagascar" },
  { iso: "MW", dial: "+265", flag: "🇲🇼", nameTr: "Malavi", nameEn: "Malawi" },
  { iso: "MY", dial: "+60", flag: "🇲🇾", nameTr: "Malezya", nameEn: "Malaysia" },
  { iso: "MV", dial: "+960", flag: "🇲🇻", nameTr: "Maldivler", nameEn: "Maldives" },
  { iso: "ML", dial: "+223", flag: "🇲🇱", nameTr: "Mali", nameEn: "Mali" },
  { iso: "MT", dial: "+356", flag: "🇲🇹", nameTr: "Malta", nameEn: "Malta" },
  { iso: "MR", dial: "+222", flag: "🇲🇷", nameTr: "Moritanya", nameEn: "Mauritania" },
  { iso: "MU", dial: "+230", flag: "🇲🇺", nameTr: "Mauritius", nameEn: "Mauritius" },
  { iso: "MX", dial: "+52", flag: "🇲🇽", nameTr: "Meksika", nameEn: "Mexico" },
  { iso: "MD", dial: "+373", flag: "🇲🇩", nameTr: "Moldova", nameEn: "Moldova" },
  { iso: "MC", dial: "+377", flag: "🇲🇨", nameTr: "Monako", nameEn: "Monaco" },
  { iso: "MN", dial: "+976", flag: "🇲🇳", nameTr: "Moğolistan", nameEn: "Mongolia" },
  { iso: "ME", dial: "+382", flag: "🇲🇪", nameTr: "Karadağ", nameEn: "Montenegro" },
  { iso: "MA", dial: "+212", flag: "🇲🇦", nameTr: "Fas", nameEn: "Morocco" },
  { iso: "MZ", dial: "+258", flag: "🇲🇿", nameTr: "Mozambik", nameEn: "Mozambique" },
  { iso: "MM", dial: "+95", flag: "🇲🇲", nameTr: "Myanmar", nameEn: "Myanmar" },
  { iso: "NA", dial: "+264", flag: "🇳🇦", nameTr: "Namibya", nameEn: "Namibia" },
  { iso: "NP", dial: "+977", flag: "🇳🇵", nameTr: "Nepal", nameEn: "Nepal" },
  { iso: "NL", dial: "+31", flag: "🇳🇱", nameTr: "Hollanda", nameEn: "Netherlands" },
  { iso: "NZ", dial: "+64", flag: "🇳🇿", nameTr: "Yeni Zelanda", nameEn: "New Zealand" },
  { iso: "NI", dial: "+505", flag: "🇳🇮", nameTr: "Nikaragua", nameEn: "Nicaragua" },
  { iso: "NE", dial: "+227", flag: "🇳🇪", nameTr: "Nijer", nameEn: "Niger" },
  { iso: "NG", dial: "+234", flag: "🇳🇬", nameTr: "Nijerya", nameEn: "Nigeria" },
  { iso: "MK", dial: "+389", flag: "🇲🇰", nameTr: "Kuzey Makedonya", nameEn: "North Macedonia" },
  { iso: "NO", dial: "+47", flag: "🇳🇴", nameTr: "Norveç", nameEn: "Norway" },
  { iso: "OM", dial: "+968", flag: "🇴🇲", nameTr: "Umman", nameEn: "Oman" },
  { iso: "PK", dial: "+92", flag: "🇵🇰", nameTr: "Pakistan", nameEn: "Pakistan" },
  { iso: "PS", dial: "+970", flag: "🇵🇸", nameTr: "Filistin", nameEn: "Palestine" },
  { iso: "PA", dial: "+507", flag: "🇵🇦", nameTr: "Panama", nameEn: "Panama" },
  { iso: "PY", dial: "+595", flag: "🇵🇾", nameTr: "Paraguay", nameEn: "Paraguay" },
  { iso: "PE", dial: "+51", flag: "🇵🇪", nameTr: "Peru", nameEn: "Peru" },
  { iso: "PH", dial: "+63", flag: "🇵🇭", nameTr: "Filipinler", nameEn: "Philippines" },
  { iso: "PL", dial: "+48", flag: "🇵🇱", nameTr: "Polonya", nameEn: "Poland" },
  { iso: "PT", dial: "+351", flag: "🇵🇹", nameTr: "Portekiz", nameEn: "Portugal" },
  { iso: "PR", dial: "+1", flag: "🇵🇷", nameTr: "Porto Riko", nameEn: "Puerto Rico" },
  { iso: "QA", dial: "+974", flag: "🇶🇦", nameTr: "Katar", nameEn: "Qatar" },
  { iso: "RO", dial: "+40", flag: "🇷🇴", nameTr: "Romanya", nameEn: "Romania" },
  { iso: "RU", dial: "+7", flag: "🇷🇺", nameTr: "Rusya", nameEn: "Russia" },
  { iso: "RW", dial: "+250", flag: "🇷🇼", nameTr: "Ruanda", nameEn: "Rwanda" },
  { iso: "SA", dial: "+966", flag: "🇸🇦", nameTr: "Suudi Arabistan", nameEn: "Saudi Arabia" },
  { iso: "SN", dial: "+221", flag: "🇸🇳", nameTr: "Senegal", nameEn: "Senegal" },
  { iso: "RS", dial: "+381", flag: "🇷🇸", nameTr: "Sırbistan", nameEn: "Serbia" },
  { iso: "SC", dial: "+248", flag: "🇸🇨", nameTr: "Seyşeller", nameEn: "Seychelles" },
  { iso: "SG", dial: "+65", flag: "🇸🇬", nameTr: "Singapur", nameEn: "Singapore" },
  { iso: "SK", dial: "+421", flag: "🇸🇰", nameTr: "Slovakya", nameEn: "Slovakia" },
  { iso: "SI", dial: "+386", flag: "🇸🇮", nameTr: "Slovenya", nameEn: "Slovenia" },
  { iso: "ZA", dial: "+27", flag: "🇿🇦", nameTr: "Güney Afrika", nameEn: "South Africa" },
  { iso: "KR", dial: "+82", flag: "🇰🇷", nameTr: "Güney Kore", nameEn: "South Korea" },
  { iso: "SS", dial: "+211", flag: "🇸🇸", nameTr: "Güney Sudan", nameEn: "South Sudan" },
  { iso: "ES", dial: "+34", flag: "🇪🇸", nameTr: "İspanya", nameEn: "Spain" },
  { iso: "LK", dial: "+94", flag: "🇱🇰", nameTr: "Sri Lanka", nameEn: "Sri Lanka" },
  { iso: "SD", dial: "+249", flag: "🇸🇩", nameTr: "Sudan", nameEn: "Sudan" },
  { iso: "SE", dial: "+46", flag: "🇸🇪", nameTr: "İsveç", nameEn: "Sweden" },
  { iso: "CH", dial: "+41", flag: "🇨🇭", nameTr: "İsviçre", nameEn: "Switzerland" },
  { iso: "SY", dial: "+963", flag: "🇸🇾", nameTr: "Suriye", nameEn: "Syria" },
  { iso: "TW", dial: "+886", flag: "🇹🇼", nameTr: "Tayvan", nameEn: "Taiwan" },
  { iso: "TJ", dial: "+992", flag: "🇹🇯", nameTr: "Tacikistan", nameEn: "Tajikistan" },
  { iso: "TZ", dial: "+255", flag: "🇹🇿", nameTr: "Tanzanya", nameEn: "Tanzania" },
  { iso: "TH", dial: "+66", flag: "🇹🇭", nameTr: "Tayland", nameEn: "Thailand" },
  { iso: "TT", dial: "+1", flag: "🇹🇹", nameTr: "Trinidad ve Tobago", nameEn: "Trinidad and Tobago" },
  { iso: "TN", dial: "+216", flag: "🇹🇳", nameTr: "Tunus", nameEn: "Tunisia" },
  { iso: "TM", dial: "+993", flag: "🇹🇲", nameTr: "Türkmenistan", nameEn: "Turkmenistan" },
  { iso: "UG", dial: "+256", flag: "🇺🇬", nameTr: "Uganda", nameEn: "Uganda" },
  { iso: "UA", dial: "+380", flag: "🇺🇦", nameTr: "Ukrayna", nameEn: "Ukraine" },
  { iso: "AE", dial: "+971", flag: "🇦🇪", nameTr: "BAE", nameEn: "United Arab Emirates" },
  { iso: "GB", dial: "+44", flag: "🇬🇧", nameTr: "Birleşik Krallık", nameEn: "United Kingdom" },
  { iso: "US", dial: "+1", flag: "🇺🇸", nameTr: "ABD", nameEn: "United States" },
  { iso: "UY", dial: "+598", flag: "🇺🇾", nameTr: "Uruguay", nameEn: "Uruguay" },
  { iso: "UZ", dial: "+998", flag: "🇺🇿", nameTr: "Özbekistan", nameEn: "Uzbekistan" },
  { iso: "VE", dial: "+58", flag: "🇻🇪", nameTr: "Venezuela", nameEn: "Venezuela" },
  { iso: "VN", dial: "+84", flag: "🇻🇳", nameTr: "Vietnam", nameEn: "Vietnam" },
  { iso: "YE", dial: "+967", flag: "🇾🇪", nameTr: "Yemen", nameEn: "Yemen" },
  { iso: "ZM", dial: "+260", flag: "🇿🇲", nameTr: "Zambiya", nameEn: "Zambia" },
  { iso: "ZW", dial: "+263", flag: "🇿🇼", nameTr: "Zimbabve", nameEn: "Zimbabwe" },
];

const dialUsageCount: Record<string, number> = PHONE_COUNTRIES.reduce(
  (acc, c) => {
    acc[c.dial] = (acc[c.dial] ?? 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

/** Açılır listede yalnızca kod; aynı kodu paylaşan ülkelerde ayırt etmek için "+1 (US)" gibi */
export function phoneCountrySelectLabel(c: PhoneCountry): string {
  return (dialUsageCount[c.dial] ?? 1) > 1 ? `${c.dial} (${c.iso})` : c.dial;
}

export function getPhoneCountry(iso: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.iso === iso);
}

export function countryLabel(c: PhoneCountry, locale: Locale): string {
  return locale === "en" ? c.nameEn : c.nameTr;
}

/** Ulusal numara ile ülke kodunu birleştirir (E.164 benzeri, + ile) */
export function combineInternationalPhone(dial: string, national: string): string {
  const dialDigits = dial.replace(/\D/g, "");
  let nat = national.replace(/\D/g, "");
  if (nat.startsWith("0")) nat = nat.replace(/^0+/, "");
  return `+${dialDigits}${nat}`;
}

export function countNationalDigits(national: string): number {
  return national.replace(/\D/g, "").replace(/^0+/, "").length;
}
