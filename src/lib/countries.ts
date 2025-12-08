export interface Country {
  code: string // ISO 2-letter code
  name: string
  dialCode: string
  flag: string // Emoji flag
}

export const countries: Country[] = [
  // African countries (most relevant for Cave Express)
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'ET', name: 'Éthiopie', dialCode: '+251', flag: '🇪🇹' },
  { code: 'UG', name: 'Ouganda', dialCode: '+256', flag: '🇺🇬' },

  // Europe
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },

  // Americas
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },

  // Asia
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'AE', name: 'Émirats arabes unis', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Arabie saoudite', dialCode: '+966', flag: '🇸🇦' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
  { code: 'IL', name: 'Israël', dialCode: '+972', flag: '🇮🇱' },
  { code: 'LB', name: 'Liban', dialCode: '+961', flag: '🇱🇧' },
]

// Default country (Côte d'Ivoire)
export const defaultCountry = countries[0]

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code)
}

// Get country by dial code
export function getCountryByDialCode(dialCode: string): Country | undefined {
  return countries.find(c => c.dialCode === dialCode)
}

// Format phone number with country code
export function formatPhoneWithCountry(phone: string, dialCode: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Remove leading + if present
  cleaned = cleaned.replace(/^\+/, '')

  // Remove country code if already present
  if (cleaned.startsWith(dialCode.replace('+', ''))) {
    cleaned = cleaned.substring(dialCode.replace('+', '').length)
  }

  // Return formatted number with country code
  return `${dialCode}${cleaned}`
}
