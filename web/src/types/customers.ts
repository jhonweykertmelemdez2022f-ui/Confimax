export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  rif?: string;
  tax_id?: string;
  person_type?: 'V' | 'E' | 'J' | 'G';
}

export const ITEMS_PER_PAGE = 9;
export const PERSON_TYPES = ['V', 'E', 'J', 'G'];
export const TAX_ID_LENGTH = { min: 8, max: 9 };