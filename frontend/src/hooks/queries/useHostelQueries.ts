import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelAPI } from '../../services/api';
import type { RoomGridData, AllocationData, HostelBuilding, RoomSummary } from '../../components/hostel/types';

// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL TANSTACK QUERY HOOKS — All hostel data fetching + mutations
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetch available hostels for the student */
export function useAvailableHostels() {
  return useQuery<{ data: HostelBuilding[] }>({
    queryKey: ['hostel', 'available'],
    queryFn: () => hostelAPI.getAvailableHostels().then(r => r.data),
    staleTime: 60_000, // 1 min
  });
}

/** Fetch rooms for a specific floor of a hostel */
export function useFloorRooms(hostelId: string | null, floor?: number) {
  return useQuery<{ data: RoomSummary[] }>({
    queryKey: ['hostel', 'rooms', hostelId, floor],
    queryFn: () => hostelAPI.getRooms(hostelId!, floor).then(r => r.data),
    enabled: !!hostelId,
    staleTime: 30_000,
  });
}

/** Fetch bed grid for a specific room — polls every 30s when focused */
export function useRoomGrid(roomId: string | null) {
  return useQuery<{ data: RoomGridData }>({
    queryKey: ['hostel', 'room-grid', roomId],
    queryFn: () => hostelAPI.getRoomGrid(roomId!).then(r => r.data),
    enabled: !!roomId,
    staleTime: 10_000,           // 10s before considered stale
    refetchInterval: 30_000,     // Poll every 30s while user is on room view
    refetchIntervalInBackground: false,  // Stop polling when tab is hidden
  });
}

/** Fetch the student's current allocation */
export function useMyAllocation() {
  return useQuery<{ data: AllocationData | null }>({
    queryKey: ['hostel', 'my-allocation'],
    queryFn: () => hostelAPI.getMyAllocation().then(r => r.data),
    staleTime: 60_000,
    retry: 1,
  });
}

/** Lock a bed — optimistically updates the grid */
export function useBedLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bed_id: string; academic_year: string }) =>
      hostelAPI.lockBed(data).then(r => r.data),
    onSuccess: (_data, variables) => {
      // Invalidate all room grids to reflect the lock
      queryClient.invalidateQueries({ queryKey: ['hostel', 'room-grid'] });
    },
  });
}

/** Confirm booking after lock */
export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bed_id: string; academic_year: string; payment_reference?: string }) =>
      hostelAPI.confirmBooking(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel'] });
    },
  });
}

/** Fetch gatepasses for the student */
export function useMyGatepasses() {
  return useQuery({
    queryKey: ['hostel', 'my-gatepasses'],
    queryFn: () => hostelAPI.myGatepasses().then(r => r.data),
    staleTime: 30_000,
  });
}

/** Apply for a gatepass */
export function useApplyGatepass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string; requested_exit: string; expected_return: string }) =>
      hostelAPI.applyGatepass(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel', 'my-gatepasses'] });
    },
  });
}
