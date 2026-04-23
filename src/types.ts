export interface Luminaire {
  model: string;
  price: number;
  power: number;
  photo: string | null;
  specsData?: Record<string, any>;
  [key: string]: any;
}

export interface Accessory {
  model: string;
  category: string;
  price: number;
  photo: string | null;
  specsData?: Record<string, any>;
  [key: string]: any;
}

export type MountingType = 'Surface' | 'Pendant' | 'Trimless' | 'Recessed';
export type LayoutType = 'Straight' | 'L-Shape' | 'T-Shape' | 'Rectangle';

export interface ConfigState {
  mounting: MountingType;
  layout: LayoutType;
  totalLength: number; // in Metres
  selectedLuminaires: {
    item: Luminaire;
    quantity: number;
  }[];
}

export interface BOMItem {
  model: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  photo: string | null;
}
