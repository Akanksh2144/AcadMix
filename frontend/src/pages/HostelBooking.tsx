import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';

// New premium hostel components
import BlockSelector from '../components/hostel/BlockSelector';
import FloorPlanView from '../components/hostel/FloorPlanView';
import RoomLayoutView from '../components/hostel/RoomLayoutView';
import GatepassPanel from '../components/hostel/GatepassPanel';
import type { HostelBuilding, RoomSummary, RoomGridData, BedLockData, AllocationData } from '../components/hostel/types';

// TanStack Query hooks
import {
  useAvailableHostels,
  useFloorRooms,
  useRoomGrid,
  useMyAllocation,
  useBedLock,
  useConfirmBooking,
} from '../hooks/queries/useHostelQueries';

// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL BOOKING — Premium Floor Plan + Bed Picker Experience
// ═══════════════════════════════════════════════════════════════════════════════
//
// Navigation flow:
//   blocks → floor-plan → room-layout → (lock → confirm → success)
//   gatepass (always accessible via tab)
//
// Surgical extraction: this file replaces the booking funnel with the new
// component tree. Gatepass logic is now in GatepassPanel.tsx.
// ═══════════════════════════════════════════════════════════════════════════════

type BookingStep = 'blocks' | 'floor-plan' | 'room-layout';

interface HostelBookingProps {
  navigate: (page: string, data?: any) => void;
  user: any;
}

export default function HostelBooking({ navigate, user }: HostelBookingProps) {
  const [activeTab, setActiveTab] = useState<'booking' | 'gatepass'>('booking');

  // Booking navigation state
  const [step, setStep] = useState<BookingStep>('blocks');
  const [selectedHostel, setSelectedHostel] = useState<HostelBuilding | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: hostelsData, isLoading: loadingHostels } = useAvailableHostels();
  const { data: roomsData, isLoading: loadingRooms } = useFloorRooms(selectedHostel?.id || null);
  const { data: gridData, isLoading: loadingGrid } = useRoomGrid(
    step === 'room-layout' ? selectedRoom?.id || null : null
  );
  const { data: allocation } = useMyAllocation();
  const bedLockMutation = useBedLock();
  const confirmMutation = useConfirmBooking();

  // Flatten data from envelope
  const hostels: HostelBuilding[] = useMemo(() => {
    if (!hostelsData) return [];
    const d = hostelsData as any;
    if ('data' in d) return d.data || [];
    return d || [];
  }, [hostelsData]);

  const rooms: RoomSummary[] = useMemo(() => {
    if (!roomsData) return [];
    const d = roomsData as any;
    if ('data' in d) return d.data || [];
    return d || [];
  }, [roomsData]);

  const roomGrid: RoomGridData | null = useMemo(() => {
    if (!gridData) return null;
    const d = gridData as any;
    if ('data' in d) return d.data;
    return d;
  }, [gridData]);

  const myAllocation: AllocationData | null = useMemo(() => {
    if (!allocation) return null;
    const d = allocation as any;
    if ('data' in d) return d.data;
    return d;
  }, [allocation]);

  // ── Navigation handlers ─────────────────────────────────────────────────────
  const handleBlockSelect = useCallback((hostel: HostelBuilding) => {
    setSelectedHostel(hostel);
    setCurrentFloor(1);
    setSelectedRoom(null);
    setStep('floor-plan');
  }, []);

  const handleRoomSelect = useCallback((room: RoomSummary) => {
    setSelectedRoom(room);
    setStep('room-layout');
  }, []);

  const handleBackToFloorPlan = useCallback(() => {
    setSelectedRoom(null);
    setStep('floor-plan');
    setLockError(null);
  }, []);

  const handleBackToBlocks = useCallback(() => {
    setSelectedHostel(null);
    setSelectedRoom(null);
    setStep('blocks');
  }, []);

  const handleLockBed = useCallback(async (bedId: string): Promise<BedLockData> => {
    setLockError(null);
    const result = await bedLockMutation.mutateAsync({
      bed_id: bedId,
      academic_year: '2025-26',
    });
    const d = (result as any)?.data || result;
    return d as BedLockData;
  }, [bedLockMutation]);

  const handleConfirmBooking = useCallback(async (bedId: string, paymentRef?: string) => {
    await confirmMutation.mutateAsync({
      bed_id: bedId,
      academic_year: '2025-26',
      payment_reference: paymentRef,
    });
  }, [confirmMutation]);

  // ── Tab config ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'booking' as const, label: myAllocation ? '🏠 My Room' : '🛏️ Book a Bed' },
    { id: 'gatepass' as const, label: '🎫 Gate Pass' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title="Hostel Booking"
        subtitle="Find your perfect room"
        navigate={navigate}
        user={user}
      />

      <div className="max-w-6xl mx-auto px-4 pb-24 pt-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-6 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`hostel-tab-${tab.id}`}
              className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent relative ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm dark:border-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── BOOKING TAB ── */}
          {activeTab === 'booking' && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Current allocation badge */}
              {myAllocation && (
                <div className="mb-6 soft-card p-5 glow-indigo">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🏠</span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-base">
                        Your Allocated Room
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {myAllocation.hostel_name} → Room {myAllocation.room_number} → Bed {myAllocation.bed_identifier}
                        {myAllocation.is_premium && (
                          <span className="ml-2 text-amber-500 font-bold">★ Premium</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Breadcrumb */}
              {step !== 'blocks' && (
                <div className="flex items-center gap-2 mb-4 text-xs">
                  <button
                    onClick={handleBackToBlocks}
                    className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    Hostels
                  </button>
                  {step === 'floor-plan' && selectedHostel && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">›</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">{selectedHostel.name}</span>
                    </>
                  )}
                  {step === 'room-layout' && selectedRoom && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">›</span>
                      <button
                        onClick={handleBackToFloorPlan}
                        className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        {selectedHostel?.name}
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">›</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">Room {selectedRoom.room_number}</span>
                    </>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* Step 1: Block Selection */}
                {step === 'blocks' && (
                  <motion.div
                    key="blocks"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BlockSelector
                      hostels={hostels}
                      selectedId={selectedHostel?.id || null}
                      onSelect={handleBlockSelect}
                      loading={loadingHostels}
                    />
                  </motion.div>
                )}

                {/* Step 2: Floor Plan */}
                {step === 'floor-plan' && selectedHostel && (
                  <motion.div
                    key="floor-plan"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <FloorPlanView
                      hostel={selectedHostel}
                      rooms={rooms}
                      loading={loadingRooms}
                      currentFloor={currentFloor}
                      onFloorChange={setCurrentFloor}
                      onRoomSelect={handleRoomSelect}
                      selectedRoomId={selectedRoom?.id || null}
                    />
                  </motion.div>
                )}

                {/* Step 3: Room Layout */}
                {step === 'room-layout' && roomGrid && (
                  <motion.div
                    key="room-layout"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <RoomLayoutView
                      gridData={roomGrid}
                      loading={loadingGrid}
                      onBack={handleBackToFloorPlan}
                      onLockBed={handleLockBed}
                      onConfirmBooking={handleConfirmBooking}
                      lockError={lockError}
                      userId={user?.id}
                    />
                  </motion.div>
                )}

                {/* Loading grid (between room select and data load) */}
                {step === 'room-layout' && !roomGrid && loadingGrid && (
                  <motion.div
                    key="loading-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <DashboardSkeleton variant="content-cards" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── GATEPASS TAB ── */}
          {activeTab === 'gatepass' && (
            <motion.div
              key="gatepass"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <GatepassPanel hostelId={selectedHostel?.id || null} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
