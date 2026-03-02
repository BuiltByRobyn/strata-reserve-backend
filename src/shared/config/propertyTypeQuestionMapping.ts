const ALL_PROPERTY_TYPES = [
  'Bare Land', 'Bare Land with Septic', 'Bare Land with Clubhouse',
  'Townhomes', 'Townhomes with Septic', 'Townhomes with Clubhouse',
  'Apartments', 'Apartments with Clubhouse',
  'Mixed-Use: Apt over Retail', 'Mixed-Use: Commercial',
  'Industrial', 'Air Parcel', 'Other',
];

const CLUBHOUSE_TYPES = ['Bare Land with Clubhouse', 'Townhomes with Clubhouse', 'Apartments with Clubhouse'];
const SEPTIC_TYPES = ['Bare Land with Septic', 'Townhomes with Septic'];
const BARE_LAND_TYPES = ['Bare Land', 'Bare Land with Septic', 'Bare Land with Clubhouse'];
const APT_TH_COMM_TYPES = [
  'Apartments', 'Apartments with Clubhouse',
  'Townhomes', 'Townhomes with Septic', 'Townhomes with Clubhouse',
  'Mixed-Use: Apt over Retail', 'Mixed-Use: Commercial',
];

export const TEMPLATE_TO_PROPERTY_TYPES: Record<string, string[]> = {
  'Apartments': APT_TH_COMM_TYPES,
  'Townhomes': APT_TH_COMM_TYPES,
  'Mixed-Use: Commercial': APT_TH_COMM_TYPES,
  'Amenity Room': CLUBHOUSE_TYPES,
  'Clubhouse': CLUBHOUSE_TYPES,
  'Common Septic Field': SEPTIC_TYPES,
  'Bare Land': BARE_LAND_TYPES,
  'Industrial': ['Industrial'],
  'Administration': ALL_PROPERTY_TYPES,
};

export function resolvePropertyTypeNames(templateGroups: string[]): string[] {
  const names = new Set<string>();
  for (const group of templateGroups) {
    const mapped = TEMPLATE_TO_PROPERTY_TYPES[group];
    if (mapped) mapped.forEach(n => names.add(n));
  }
  return [...names];
}
