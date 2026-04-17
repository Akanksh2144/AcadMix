// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL BOOKING — TypeScript Interfaces
// ═══════════════════════════════════════════════════════════════════════════════

export interface HostelBuilding {
  id: string;
  name: string;
  gender_type: 'male' | 'female' | 'coed';
  total_floors: number;
  total_capacity: number;
  available_beds: number;
  premium_beds: number;
  total_beds: number;
  metadata?: HostelMetadata;
}

export interface HostelMetadata {
  floor_layout?: Record<string, FloorLayout>;
}

export interface FloorLayout {
  corridor: 'horizontal' | 'vertical';
  north: string[];
  south: string[];
  exit?: string;
}

export interface RoomSummary {
  id: string;
  room_number: string;
  floor: number;
  capacity: number;
  available_count: number;
  premium_count: number;
  template_name?: string;
  metadata?: RoomMetadata;
}

export interface RoomMetadata {
  ac?: boolean;
  attached_bathroom?: boolean;
  amenities?: string[];
  wing?: string;
  room_decorators?: RoomDecorators;
}

export interface RoomDecorators {
  window_wall?: 'top' | 'bottom' | 'left' | 'right';
  door_position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  bathroom_corner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface BedGridItem {
  id: string;
  bed_identifier: string;
  grid_row: number;
  grid_col: number;
  category?: string;
  is_premium: boolean;
  selection_fee: number;
  status: BedStatus;
}

export type BedStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'MAINTENANCE';

export interface RoomGridData {
  room_id: string;
  room_number: string;
  hostel_name: string;
  grid_rows: number;
  grid_cols: number;
  beds: BedGridItem[];
  metadata?: RoomMetadata;
}

export interface BedLockData {
  bed_id: string;
  bed_identifier: string;
  selection_fee: number;
  is_premium: boolean;
  lock_expires_at: string;
}

export interface AllocationData {
  allocation_id: string;
  academic_year: string;
  hostel_name: string;
  room_number: string;
  bed_identifier: string;
  is_premium: boolean;
  selection_fee_paid: number;
  allocated_at?: string;
}

export interface BedLayoutItem {
  identifier: string;
  row: number;
  col: number;
  category: string;
  is_premium: boolean;
  base_fee: number;
}

export interface TemplateData {
  id: string;
  name: string;
  total_capacity: number;
  grid_rows: number;
  grid_cols: number;
  bed_layout: BedLayoutItem[];
  metadata?: RoomMetadata;
  is_global?: boolean;
}

// Filter state for the hostel picker
export interface HostelFilters {
  occupancy: number | null;     // null = all, 1/2/3/4+ = specific
  ac: boolean | null;            // null = any, true/false = specific
  availability: boolean;         // true = available only (default)
  bedCategory: string[];         // multi-select
  priceRange: [number, number] | null;
  attachedBathroom: boolean | null;
  amenities: string[];
}

export const DEFAULT_FILTERS: HostelFilters = {
  occupancy: null,
  ac: null,
  availability: true,
  bedCategory: [],
  priceRange: null,
  attachedBathroom: null,
  amenities: [],
};
