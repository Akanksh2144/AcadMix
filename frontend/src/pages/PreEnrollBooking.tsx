import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';

// Premium hostel components
import BlockSelector from '../components/hostel/BlockSelector';
import FloorPlanView from '../components/hostel/FloorPlanView';
import RoomLayoutView from '../components/hostel/RoomLayoutView';
import type { HostelBuilding, RoomSummary, RoomGridData, BedLockData, AllocationData } from '../components/hostel/types';

import { preEnrollAPI } from '../services/api';

type BookingStep = 'blocks' | 'floor-plan' | 'room-layout';

export default function PreEnrollBooking({ navigate }: { navigate: (p: string) => void }) {
  const token = sessionStorage.getItem('pre_enroll_token');

  // If no token, redirect immediately back to login
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [step, setStep] = useState<BookingStep>('blocks');
  const [selectedHostel, setSelectedHostel] = useState<HostelBuilding | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  // States
  const [hostels, setHostels] = useState<HostelBuilding[]>([]);
  const [loadingHostels, setLoadingHostels] = useState(true);
  
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [roomGrid, setRoomGrid] = useState<RoomGridData | null>(null);
  const [loadingGrid, setLoadingGrid] = useState(false);

  const [myAllocation, setMyAllocation] = useState<AllocationData | null>(null);

  // Data Fetching
  useEffect(() => {
    if (!token) return;
    preEnrollAPI.getAvailableBuildings(token).then(r => {
      setHostels(r.data?.data || []);
      setLoadingHostels(false);
    });
    preEnrollAPI.getMyAllocation(token).then(r => {
      setMyAllocation(r.data?.data || null);
    });
  }, [token]);

  useEffect(() => {
    if (!selectedHostel?.id || !token) return;
    setLoadingRooms(true);
    preEnrollAPI.getBuildingFloors(selectedHostel.id, token).then(r => {
      setRooms(r.data?.data || []);
      setLoadingRooms(false);
    });
  }, [selectedHostel, token]);

  useEffect(() => {
    if (step !== 'room-layout' || !selectedRoom?.id || !token) return;
    setLoadingGrid(true);
    preEnrollAPI.getRoomGrid(selectedRoom.id, token).then(r => {
      setRoomGrid(r.data?.data || null);
      setLoadingGrid(false);
    });
  }, [selectedRoom, step, token]);


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
    if (!token) throw new Error("No token");
    try {
      const result = await preEnrollAPI.lockBed(bedId, token);
      return result.data?.data as BedLockData;
    } catch (err: any) {
      setLockError(err?.response?.data?.detail || "Failed to lock bed");
      throw err;
    }
  }, [token]);

  const handleConfirmBooking = useCallback(async (bedId: string, paymentRef?: string) => {
    if (!token) throw new Error("No token");
    await preEnrollAPI.confirmBooking(bedId, paymentRef, token);
    
    // Refresh allocation
    const res = await preEnrollAPI.getMyAllocation(token);
    setMyAllocation(res.data?.data || null);
    setStep("blocks"); // send to front
  }, [token]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title="Pre-Enrollment Hostel Booking"
        subtitle="Secure your room before classes begin"
        navigate={navigate}
        user={{ name: "Guest Student", role: "guest" }}
      />

      <div className="max-w-6xl mx-auto px-4 pb-24 pt-6">
        <AnimatePresence mode="wait">
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
                      Your Confirmed Room Allocation
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
            {!myAllocation && step !== 'blocks' && (
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
              {!myAllocation && step === 'blocks' && (
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
              {!myAllocation && step === 'floor-plan' && selectedHostel && (
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
              {!myAllocation && step === 'room-layout' && roomGrid && (
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
                    userId={"admission_user"}
                  />
                </motion.div>
              )}

              {/* Loading grid */}
              {!myAllocation && step === 'room-layout' && !roomGrid && loadingGrid && (
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
        </AnimatePresence>
      </div>
    </div>
  );
}
