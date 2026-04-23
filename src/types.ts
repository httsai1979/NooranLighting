export type TrackCategory = 
  | 'Track_Group_A' 
  | 'Track_Group_Concealed' 
  | 'Track_Group_Film' 
  | 'Lighting_Grille' 
  | 'Lighting_Flood' 
  | 'Lighting_Spot' 
  | 'Lighting_Decorative' 
  | 'Power_Integrated' 
  | 'Power_External' 
  | 'Accessory_Required' 
  | 'Protocol_Control';

export interface Luminaire {
  model: string;
  price: number;
  power: number;
  photo: string | null;
  category: TrackCategory;
  beamAngle?: string;
  color?: string;
  specsData?: Record<string, any>;
  [key: string]: any;
}

export interface Accessory {
  model: string;
  category: TrackCategory | string;
  price: number;
  photo: string | null;
  logicLabel?: string;
  specsData?: Record<string, any>;
  [key: string]: any;
}

export type MountingType = 
  | 'Surface/Hanging' 
  | 'Embedded concealed' 
  | 'Batch ash track' 
  | 'Spring fixed' 
  | 'Ceiling soft film';

export type LayoutType = 'Straight' | 'L-Shape' | 'T-Shape' | 'Rectangle';

export interface Project {
  id: number;
  name: string;
  location: string;
  image: string;
  description: string;
}

export interface ConfigState {
  mounting: MountingType;
  layout: LayoutType;
  totalLength: number; // in Millimeters (mm) - Engineering Standard
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
  alert?: string;
  specs?: Record<string, string>;
}


