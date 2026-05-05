import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CursorClick, Plus, Trash, Tree, List, CaretLeft, Check, FloppyDisk, Car,
  House, Trophy, BookOpen, Buildings, Lightning, Microphone, ForkKnife, Wrench, SoccerBall, DoorOpen, Crown,
  Minus, X
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '../../services/api';

const GRID_COLS = 24;
const GRID_ROWS = 48;

const ICON_MAP = {
  Buildings, Crown, House, Trophy, ForkKnife, Car, Wrench, SoccerBall, BookOpen, Lightning, Microphone, DoorOpen
};

const BUILDING_TYPES = [
  { id: 'academic', label: 'Academic Block', color: '#6366f1', icon: 'Buildings' },
  { id: 'admin', label: 'Admin Block', color: '#8b5cf6', icon: 'Crown' },
  { id: 'hostel', label: 'Hostel', color: '#ec4899', icon: 'House' },
  { id: 'sports', label: 'Sports Complex', color: '#22c55e', icon: 'Trophy' },
  { id: 'canteen', label: 'Canteen', color: '#f97316', icon: 'ForkKnife' },
  { id: 'parking', label: 'Parking Lot', color: '#94a3b8', icon: 'Car' },
  { id: 'utility', label: 'Utility/Power', color: '#64748b', icon: 'Wrench' },
  { id: 'garden', label: 'Garden/Park', color: '#10b981', icon: 'SoccerBall' },
  { id: 'library', label: 'Library', color: '#06b6d4', icon: 'BookOpen' },
  { id: 'medical', label: 'Medical Center', color: '#ef4444', icon: 'Lightning' },
  { id: 'amphitheatre', label: 'Amphitheatre', color: '#a855f7', icon: 'Microphone' },
  { id: 'entrance', label: 'Entrance Gate', color: '#78716c', icon: 'DoorOpen' },
];

export default function CampusLayoutDesigner({ onPreviewToggle }) {
  const [layout, setLayout] = useState({ horizontal_roads: [], vertical_roads: [], trees: [], auto_trees: true });
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [activeTool, setActiveTool] = useState('select'); // select, h-road, v-road, building, tree, eraser
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  // New building drag state
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [layoutRes, buildingsRes] = await Promise.all([
        api.get('/campus/layout'),
        api.get('/campus/buildings')
      ]);
      setLayout(layoutRes.data);
      setBuildings(buildingsRes.data);
    } catch (err) {
      toast.error('Failed to load campus data');
    }
    setLoading(false);
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      await api.put('/campus/layout', layout);
      toast.success('Layout saved successfully');
    } catch (err) {
      toast.error('Failed to save layout');
    }
    setSaving(false);
  };

  // --- Grid Interactions ---
  const handleCellClick = async (col, row) => {
    if (activeTool === 'h-road') {
      const isRoad = layout.horizontal_roads.some(r => r.row === row);
      if (isRoad) {
        setLayout(prev => ({ ...prev, horizontal_roads: prev.horizontal_roads.filter(r => r.row !== row) }));
      } else {
        setLayout(prev => ({ ...prev, horizontal_roads: [...prev.horizontal_roads, { row, label: `Road Row ${row}` }] }));
      }
    } else if (activeTool === 'v-road') {
      const isRoad = layout.vertical_roads.some(r => r.col === col);
      if (isRoad) {
        setLayout(prev => ({ ...prev, vertical_roads: prev.vertical_roads.filter(r => r.col !== col) }));
      } else {
        setLayout(prev => ({ ...prev, vertical_roads: [...prev.vertical_roads, { col, label: `Road Col ${col}` }] }));
      }
    } else if (activeTool === 'tree') {
      const isTree = layout.trees.some(t => t.x === col && t.y === row);
      if (isTree) {
        setLayout(prev => ({ ...prev, trees: prev.trees.filter(t => !(t.x === col && t.y === row)) }));
      } else {
        setLayout(prev => ({ ...prev, trees: [...prev.trees, { x: col, y: row }] }));
      }
    } else if (activeTool === 'eraser') {
      setLayout(prev => ({
        ...prev,
        horizontal_roads: prev.horizontal_roads.filter(r => r.row !== row),
        vertical_roads: prev.vertical_roads.filter(r => r.col !== col),
        trees: prev.trees.filter(t => !(t.x === col && t.y === row))
      }));
    }
  };

  const handleMouseDown = (col, row, e) => {
    if (activeTool === 'building') {
      setDragStart({ x: col, y: row });
      setDragCurrent({ x: col, y: row });
    }
  };

  const handleMouseEnter = (col, row) => {
    setHoverCell({ x: col, y: row });
    if (activeTool === 'building' && dragStart) {
      setDragCurrent({ x: col, y: row });
    }
  };

  const handleMouseUp = async () => {
    if (activeTool === 'building' && dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x) + 1;
      const h = Math.abs(dragCurrent.y - dragStart.y) + 1;

      // Check overlap
      const overlaps = buildings.some(b => 
        x < b.grid_x + b.grid_w && x + w > b.grid_x &&
        y < b.grid_y + b.grid_h && y + h > b.grid_y
      );

      if (overlaps) {
        toast.error('Buildings cannot overlap');
      } else {
        // Create building
        try {
          const res = await api.post('/campus/buildings', {
            name: 'New Building',
            short_name: 'NEW',
            building_type: 'academic',
            floor_count: 1,
            grid_x: x,
            grid_y: y,
            grid_w: w,
            grid_h: h,
            color: '#6366f1',
            icon: 'Buildings'
          });
          setBuildings(prev => [...prev, res.data]);
          setSelectedBuilding(res.data);
          setActiveTool('select');
        } catch (err) {
          toast.error('Failed to create building');
        }
      }
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleBuildingClick = (b, e) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      setSelectedBuilding(b);
    } else if (activeTool === 'eraser') {
      handleDeleteBuilding(b.id);
    }
  };

  const handleUpdateBuilding = async (updates) => {
    if (!selectedBuilding) return;
    const optimistic = { ...selectedBuilding, ...updates };
    setBuildings(prev => prev.map(b => b.id === optimistic.id ? optimistic : b));
    setSelectedBuilding(optimistic);

    try {
      await api.put(`/campus/buildings/${optimistic.id}`, updates);
    } catch (err) {
      toast.error('Failed to update building');
      fetchData(); // Revert
    }
  };

  const handleDeleteBuilding = async (id) => {
    try {
      await api.delete(`/campus/buildings/${id}`);
      setBuildings(prev => prev.filter(b => b.id !== id));
      if (selectedBuilding?.id === id) setSelectedBuilding(null);
      toast.success('Building deleted');
    } catch (err) {
      toast.error('Failed to delete building');
    }
  };

  const renderGridCells = () => {
    const cells = [];
    for (let r = 0; r < layout.grid_rows; r++) {
      for (let c = 0; c < layout.grid_cols; c++) {
        // determine if road
        const isHRoad = layout.horizontal_roads.some(road => road.row === r);
        const isVRoad = layout.vertical_roads.some(road => road.col === c);
        const isRoad = isHRoad || isVRoad;

        // determine if tree
        const isTree = layout.trees.some(t => t.x === c && t.y === r);

        // draw drag box
        let inDragBox = false;
        if (dragStart && dragCurrent) {
          const minX = Math.min(dragStart.x, dragCurrent.x);
          const maxX = Math.max(dragStart.x, dragCurrent.x);
          const minY = Math.min(dragStart.y, dragCurrent.y);
          const maxY = Math.max(dragStart.y, dragCurrent.y);
          inDragBox = c >= minX && c <= maxX && r >= minY && r <= maxY;
        }

        const isHover = hoverCell?.x === c && hoverCell?.y === r && activeTool !== 'select';

        cells.push(
          <div
            key={`${c}-${r}`}
            className="border-r border-b border-slate-200 dark:border-slate-800/50"
            style={{
              gridColumn: c + 1, gridRow: r + 1,
              backgroundColor: inDragBox ? 'rgba(99, 102, 241, 0.4)' : isHover ? 'rgba(99, 102, 241, 0.2)' : isRoad ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'crosshair',
              borderStyle: isRoad ? 'dashed' : 'solid',
              borderColor: isRoad ? 'rgba(250, 204, 21, 0.3)' : '',
            }}
            onMouseDown={(e) => handleMouseDown(c, r, e)}
            onMouseEnter={() => handleMouseEnter(c, r)}
            onClick={() => handleCellClick(c, r)}
          >
            {isTree && '🌳'}
          </div>
        );
      }
    }
    return cells;
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-96"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const tools = [
    { id: 'select', icon: CursorClick, label: 'Select' },
    { id: 'h-road', icon: Minus, label: 'H-Road' },
    { id: 'v-road', icon: Minus, label: 'V-Road', rotate: true },
    { id: 'building', icon: Buildings, label: 'Building' },
    { id: 'tree', icon: Tree, label: 'Tree' },
    { id: 'eraser', icon: X, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#F8FAFC] dark:bg-[#0B0F19] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-xl" onMouseUp={handleMouseUp}>
      {/* Top Toolbar */}
      <div className="h-16 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1A202C] flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full">
          {tools.map(t => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} weight={isActive ? "fill" : "duotone"} style={t.rotate ? { transform: 'rotate(90deg)' } : {}} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl cursor-pointer">
            <input type="checkbox" checked={layout.auto_trees} onChange={(e) => setLayout(prev => ({ ...prev, auto_trees: e.target.checked }))} className="rounded text-indigo-500 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
            Auto-fill Trees
          </label>
          <button onClick={saveLayout} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
            <FloppyDisk size={18} weight="duotone" /> {saving ? 'Saving...' : 'Save Layout'}
          </button>
          <button onClick={onPreviewToggle} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-xl text-sm font-bold transition-colors">
            Preview View
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-100/50 dark:bg-[#0B0F19] relative hide-scrollbar p-10">
          <div className="inline-block bg-white dark:bg-[#1A202C] shadow-2xl rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 mx-auto" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.grid_cols}, 30px)`,
            gridTemplateRows: `repeat(${layout.grid_rows}, 30px)`,
          }}>
            {/* 1. Base Grid Cells & Roads & Trees */}
            {renderGridCells()}

            {/* 2. Buildings */}
            {buildings.map(b => {
              const IconComp = ICON_MAP[b.icon || 'Buildings'] || Buildings;
              const isSelected = selectedBuilding?.id === b.id;
              return (
                <div key={b.id}
                  onMouseDown={(e) => { e.stopPropagation(); handleBuildingClick(b, e); }}
                  className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer transition-shadow ${isSelected ? 'z-20' : 'z-10'}`}
                  style={{
                    gridColumn: `${b.grid_x + 1} / span ${b.grid_w}`,
                    gridRow: `${b.grid_y + 1} / span ${b.grid_h}`,
                    background: isSelected ? `${b.color}50` : `${b.color || '#6366f1'}30`,
                    boxShadow: isSelected ? `inset 0 0 0 2px ${b.color || '#6366f1'}90, 0 10px 25px -5px rgba(0,0,0,0.2)` : 'inset 0 0 0 0px transparent',
                  }}
                >
                  <IconComp size={16} weight="duotone" style={{ color: b.color || '#6366f1', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', lineHeight: 1.1, color: 'var(--text-primary, #1e293b)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.short_name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Property Panel */}
        <AnimatePresence>
          {selectedBuilding && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-200 dark:border-white/5 bg-white dark:bg-[#1A202C] flex flex-col shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="h-16 p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Wrench weight="duotone" className="text-indigo-500" /> Building Props</h3>
                <button onClick={() => setSelectedBuilding(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={16} weight="bold" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input type="text" value={selectedBuilding.name} onChange={e => handleUpdateBuilding({ name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Short Name</label>
                    <input type="text" value={selectedBuilding.short_name || ''} onChange={e => handleUpdateBuilding({ short_name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Appearance */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Type & Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUILDING_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => handleUpdateBuilding({ building_type: type.id, color: type.color, icon: type.icon })}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${selectedBuilding.building_type === type.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }}></div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Dimensions */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Grid Coordinates & Size</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">X Pos (Col)</span>
                      <input type="number" min="0" max={layout.grid_cols - selectedBuilding.grid_w} value={selectedBuilding.grid_x} onChange={e => handleUpdateBuilding({ grid_x: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-center" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Y Pos (Row)</span>
                      <input type="number" min="0" max={layout.grid_rows - selectedBuilding.grid_h} value={selectedBuilding.grid_y} onChange={e => handleUpdateBuilding({ grid_y: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-center" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Width</span>
                      <input type="number" min="1" max={layout.grid_cols} value={selectedBuilding.grid_w} onChange={e => handleUpdateBuilding({ grid_w: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-center" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Height</span>
                      <input type="number" min="1" max={layout.grid_rows} value={selectedBuilding.grid_h} onChange={e => handleUpdateBuilding({ grid_h: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-center" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 shrink-0">
                <button onClick={() => { if(window.confirm('Delete this building?')) handleDeleteBuilding(selectedBuilding.id); }} className="w-full flex justify-center items-center gap-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                  <Trash size={16} weight="bold" /> Delete Building
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
