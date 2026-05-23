export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  rif?: string;
}

export const ITEMS_PER_PAGE = 9;