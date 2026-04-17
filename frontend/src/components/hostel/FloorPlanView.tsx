import React, { useMemo, useState } from 'react';
import FloorSwitcher from './FloorSwitcher';
import FilterBar from './FilterBar';
import MoreFiltersDrawer from './MoreFiltersDrawer';
import RoomCard from './RoomCard';
import type { RoomSummary, HostelFilters, HostelBuilding } from './types';
import { DEFAULT_FILTERS } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// FLOOR PLAN VIEW — Bird's-eye floor plan with corridor + room card grid
// ═══════════════════════════════════════════════════════════════════════════════

interface FloorPlanViewProps {
  hostel: HostelBuilding;
  rooms: RoomSummary[];
  loading: boolean;
  currentFloor: number;
  onFloorChange: (floor: number) => void;
  onRoomSelect: (room: RoomSummary) => void;
  selectedRoomId: string | null;
}

export default function FloorPlanView({
  hostel,
  rooms,
  loading,
  currentFloor,
  onFloorChange,
  onRoomSelect,
  selectedRoomId,
}: FloorPlanViewProps) {
  const [filters, setFilters] = useState<HostelFilters>(DEFAULT_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);

  // Get floor layout from hostel metadata (if available)
  const floorLayout = hostel.meta_data?.floor_layout?.[String(currentFloor)];

  // Room count per floor for the floor switcher
  const roomCountPerFloor = useMemo(() => {
    const counts: Record<number, number> = {};
    rooms.forEach(r => {
      counts[r.floor] = (counts[r.floor] || 0) + 1;
    });
    return counts;
  }, [rooms]);

  // Filter rooms on the current floor
  const floorRooms = useMemo(() => {
    return rooms.filter(r => r.floor === currentFloor);
  }, [rooms, currentFloor]);

  // Apply client-side filters
  const filteredRooms = useMemo(() => {
    return floorRooms.filter(r => {
      // Availability filter
      if (filters.availability && r.available_count === 0) return false;

      // Occupancy filter
      if (filters.occupancy !== null) {
        if (filters.occupancy === 4) {
          if (r.capacity < 4) return false;
        } else {
          if (r.capacity !== filters.occupancy) return false;
        }
      }

      // AC filter
      if (filters.ac !== null) {
        const roomAC = r.meta_data?.ac ?? false;
        if (filters.ac !== roomAC) return false;
      }

      // Attached bathroom
      if (filters.attachedBathroom !== null) {
        const hasBathroom = r.meta_data?.attached_bathroom ?? false;
        if (filters.attachedBathroom !== hasBathroom) return false;
      }

      // Amenities
      if (filters.amenities.length > 0) {
        const roomAmenities = r.meta_data?.amenities || [];
        const hasAll = filters.amenities.every(a =>
          roomAmenities.some(ra => ra.toLowerCase().includes(a.toLowerCase()))
        );
        if (!hasAll) return false;
      }

      return true;
    });
  }, [floorRooms, filters]);

  // Count active tier 2 filters
  const tier2Active = (filters.bedCategory.length > 0 ? 1 : 0)
    + (filters.attachedBathroom !== null ? 1 : 0)
    + (filters.amenities.length > 0 ? 1 : 0)
    + (filters.priceRange !== null ? 1 : 0);

  // Split rooms into north/south wings based on floor layout metadata
  const { northRooms, southRooms, hasWings } = useMemo(() => {
    if (!floorLayout) {
      return { northRooms: filteredRooms, southRooms: [] as RoomSummary[], hasWings: false };
    }

    const northSet = new Set(floorLayout.north || []);
    const southSet = new Set(floorLayout.south || []);

    const north = filteredRooms.filter(r => northSet.has(r.room_number));
    const south = filteredRooms.filter(r => southSet.has(r.room_number));

    // Any rooms not assigned to a wing go into north
    const assignedIds = new Set([...north.map(r => r.id), ...south.map(r => r.id)]);
    const unassigned = filteredRooms.filter(r => !assignedIds.has(r.id));

    return {
      northRooms: [...north, ...unassigned],
      southRooms: south,
      hasWings: south.length > 0,
    };
  }, [filteredRooms, floorLayout]);

  return (
    <div className="space-y-4">
      {/* Floor switcher */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 truncate">
            {hostel.name}
          </h3>
        </div>
        <FloorSwitcher
          totalFloors={hostel.total_floors}
          currentFloor={currentFloor}
          onFloorChange={onFloorChange}
          roomCountPerFloor={roomCountPerFloor}
        />
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        matchCount={filteredRooms.length}
        onOpenMore={() => setMoreOpen(true)}
        tier2ActiveCount={tier2Active}
      />

      {/* Floor plan */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton-shimmer h-[100px] rounded-xl" />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-12 soft-card">
          <p className="text-4xl mb-3">{floorRooms.length === 0 ? '🏗️' : '🔍'}</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {floorRooms.length === 0
              ? 'No rooms on this floor yet'
              : 'No rooms match your filters'
            }
          </p>
          {floorRooms.length > 0 && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs font-bold text-indigo-500 mt-2 hover:text-indigo-600"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {/* North wing rooms */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {northRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onRoomSelect}
                isSelected={selectedRoomId === room.id}
              />
            ))}
          </div>

          {/* Corridor divider (only when wings exist) */}
          {hasWings && (
            <div className="room-corridor flex items-center justify-center py-3 my-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-900 px-4">
                Corridor
              </span>
            </div>
          )}

          {/* South wing rooms */}
          {hasWings && southRooms.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {southRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onSelect={onRoomSelect}
                  isSelected={selectedRoomId === room.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* More filters drawer */}
      <MoreFiltersDrawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
