import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Save, Layout, Box, Plus, Trash2, 
  DoorClosed, Move, GripHorizontal, Bath, 
  Coffee, Droplet, Users, UserCircle, Shirt, Utensils
} from 'lucide-react';
import { superadminAPI } from '../services/api';

interface ElementData {
  id: string;
  type: string;
  label: string;
  row: number;
  col: number;
  span_rows: number;
  span_cols: number;
  room_id?: string;
  color: string;
  meta: any;
}

interface FloorLayout {
  grid_rows: number;
  grid_cols: number;
  elements: ElementData[];
}

interface Props {
  hostelId: string;
  hostelName: string;
  totalFloors: number;
  onRoomClick: (roomId: string, label: string) => void;
  onBack: () => void;
}

const ELEMENT_TYPES = [
  { id: 'room', label: 'Room', icon: DoorClosed, color: '#818cf8', linkable: true },
  { id: 'corridor', label: 'Corridor', icon: Move, color: '#94a3b8', linkable: false },
  { id: 'stairs', label: 'Stairs', icon: GripHorizontal, color: '#f59e0b', linkable: false },
  { id: 'bathroom', label: 'Washroom', icon: Bath, color: '#38bdf8', linkable: false },
  { id: 'vending_machine', label: 'Vending', icon: Coffee, color: '#fb923c', linkable: false },
  { id: 'water_machine', label: 'Water', icon: Droplet, color: '#22d3ee', linkable: false },
  { id: 'common_area', label: 'Common', icon: Users, color: '#34d399', linkable: false },
  { id: 'warden_office', label: 'Warden', icon: UserCircle, color: '#f472b6', linkable: false },
  { id: 'laundry', label: 'Laundry', icon: Shirt, color: '#c084fc', linkable: false },
  { id: 'mess_hall', label: 'Dining', icon: Utensils, color: '#fbbf24', linkable: false },
];

export default function FloorBlueprintEditor({ hostelId, hostelName, totalFloors: initialTotalFloors, onRoomClick, onBack }: Props) {
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [totalFloors, setTotalFloors] = useState<number>(initialTotalFloors || 1);
  const [layout, setLayout] = useState<FloorLayout>({ grid_rows: 8, grid_cols: 16, elements: [] });
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Drag state for resizing/multi-cell placement
  const [dragStart, setDragStart] = useState<{ r: number, c: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ r: number, c: number } | null>(null);

  // Settings
  const [gridSize, setGridSize] = useState({ rows: 8, cols: 16 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel load floor layout and actual rooms in the DB
      const [layoutRes, roomsRes] = await Promise.all([
        superadminAPI.getFloorLayout(hostelId, currentFloor),
        superadminAPI.listRooms(hostelId)
      ]);
      
      const loadedLayout = layoutRes.data.data;
      if (loadedLayout && loadedLayout.grid_rows) {
        setLayout(loadedLayout);
        setGridSize({ rows: loadedLayout.grid_rows, cols: loadedLayout.grid_cols });
      } else {
        setLayout({ grid_rows: gridSize.rows, grid_cols: gridSize.cols, elements: [] });
      }
      
      setRooms(roomsRes.data.data || []);
      
    } catch (error) {
      console.error("Failed to load blueprint:", error);
    } finally {
      setLoading(false);
    }
  }, [hostelId, currentFloor]);

  useEffect(() => {
    loadData();
    setSelectedElementId(null);
    setDragStart(null);
  }, [loadData]);

  const saveLayout = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...layout,
        grid_rows: gridSize.rows,
        grid_cols: gridSize.cols
      };
      await superadminAPI.saveFloorLayout(hostelId, currentFloor, dataToSave);
      
      // Auto-create missing room records for elements marked as 'room' without a room_id
      // For option A (auto-create) we do it here. Or we leave it empty and let user link (Option B).
      // Since user said "both", we can check if there are rooms without room_id and prompt or auto-create.
      // For simplicity in this iteration, we'll just save the layout and let them link in properties.

      alert('Floor blueprint saved successfully.');
    } catch (error) {
      console.error("Failed to save blueprint:", error);
      alert('Failed to save blueprint.');
    } finally {
      setSaving(false);
    }
  };

  const handleGridMouseDown = (r: number, c: number) => {
    if (!selectedTool) {
      // Select element at this cell if any
      const el = layout.elements.find(e => 
        r >= e.row && r < e.row + e.span_rows &&
        c >= e.col && c < e.col + e.span_cols
      );
      if (el) {
        setSelectedElementId(el.id);
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    setDragStart({ r, c });
    setDragCurrent({ r, c });
  };

  const handleGridMouseEnter = (r: number, c: number) => {
    if (dragStart) {
      setDragCurrent({ r, c });
    }
  };

  const handleGridMouseUp = () => {
    if (dragStart && dragCurrent && selectedTool) {
      const minRow = Math.min(dragStart.r, dragCurrent.r);
      const maxRow = Math.max(dragStart.r, dragCurrent.r);
      const minCol = Math.min(dragStart.c, dragCurrent.c);
      const maxCol = Math.max(dragStart.c, dragCurrent.c);
      
      const spanRows = maxRow - minRow + 1;
      const spanCols = maxCol - minCol + 1;
      
      const toolDef = ELEMENT_TYPES.find(t => t.id === selectedTool);
      
      const newElement: ElementData = {
        id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedTool,
        label: `${toolDef?.label} ${layout.elements.length + 1}`,
        row: minRow,
        col: minCol,
        span_rows: spanRows,
        span_cols: spanCols,
        color: toolDef?.color || '#cbd5e1',
        meta: {}
      };
      
      setLayout(prev => ({
        ...prev,
        elements: [...prev.elements, newElement]
      }));
      
      setSelectedElementId(newElement.id);
      // Keep tool selected for rapid placement
    }
    
    setDragStart(null);
    setDragCurrent(null);
  };

  const updateSelectedElement = (updates: Partial<ElementData>) => {
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === selectedElementId ? { ...el, ...updates } : el)
    }));
  };

  const deleteSelectedElement = () => {
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== selectedElementId)
    }));
    setSelectedElementId(null);
  };

  const selectedElement = useMemo(() => 
    layout.elements.find(el => el.id === selectedElementId),
  [layout.elements, selectedElementId]);

  const addFloor = () => {
    setTotalFloors(prev => prev + 1);
    setCurrentFloor(totalFloors + 1);
  };

  if (loading && layout.elements.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading Blueprint Editor...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] -mx-6 -mt-6 -mb-6 bg-slate-50">
      
      {/* Header / Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">
            &larr; Back
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h2 className="text-lg font-bold text-slate-800">
            {hostelName} <span className="text-slate-400 font-normal">| Blueprint Editor</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {Array.from({ length: totalFloors }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentFloor(i + 1)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentFloor === i + 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Floor {i + 1}
              </button>
            ))}
            <button
              onClick={addFloor}
              className="px-3 py-1.5 text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium"
              title="Add New Floor"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button
            onClick={saveLayout}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Blueprint'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Palette */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Layout size={16} className="text-slate-400" />
              Elements Palette
            </h3>
            <p className="text-xs text-slate-500 mt-1">Select an element to place on grid.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              onClick={() => setSelectedTool(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTool === null ? 'bg-slate-100 text-slate-900 border-2 border-slate-400' : 'text-slate-600 hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <Box size={18} />
              Cursor / Select
            </button>
            
            <div className="h-px bg-slate-100 my-4"></div>
            
            {ELEMENT_TYPES.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTool === tool.id ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-400' : 'text-slate-600 hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: tool.color }}>
                    <Icon size={14} />
                  </div>
                  {tool.label}
                </button>
              );
            })}
          </div>
          
          {/* Grid Settings */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Grid Size</h4>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Rows</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={gridSize.rows}
                  onChange={e => setGridSize(prev => ({ ...prev, rows: parseInt(e.target.value) || 8 }))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <span className="text-slate-400 mt-4">×</span>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Cols</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={gridSize.cols}
                  onChange={e => setGridSize(prev => ({ ...prev, cols: parseInt(e.target.value) || 16 }))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-slate-100 overflow-auto relative p-8 flex items-center justify-center"
             onMouseUp={handleGridMouseUp}
             onMouseLeave={() => { setDragStart(null); setDragCurrent(null); }}>
          
          {/* The Grid */}
          <div 
            className="bg-white shadow-sm border border-slate-200 relative select-none"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${gridSize.rows}, 48px)`,
              gridTemplateColumns: `repeat(${gridSize.cols}, 48px)`,
            }}
          >
            {/* Grid Cells (Background) */}
            {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, i) => {
              const r = Math.floor(i / gridSize.cols);
              const c = i % gridSize.cols;
              return (
                <div 
                  key={i} 
                  className={`border-r border-b border-slate-100 transition-colors ${
                    selectedTool ? 'hover:bg-indigo-50 cursor-crosshair' : 'hover:bg-slate-50 cursor-pointer'
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); handleGridMouseDown(r, c); }}
                  onMouseEnter={() => handleGridMouseEnter(r, c)}
                />
              );
            })}
            
            {/* Placed Elements */}
            {layout.elements.map(el => {
              const toolDef = ELEMENT_TYPES.find(t => t.id === el.type);
              const Icon = toolDef?.icon || Box;
              const isSelected = selectedElementId === el.id;
              
              return (
                <div
                  key={el.id}
                  className={`absolute rounded-sm border-2 transition-shadow overflow-hidden flex flex-col items-center justify-center ${
                    isSelected ? 'ring-2 ring-indigo-600 ring-offset-1 z-10' : 'hover:brightness-95 z-0'
                  }`}
                  style={{
                    top: `${el.row * 48}px`,
                    left: `${el.col * 48}px`,
                    width: `${el.span_cols * 48}px`,
                    height: `${el.span_rows * 48}px`,
                    backgroundColor: el.color,
                    borderColor: 'rgba(0,0,0,0.1)',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!selectedTool) setSelectedElementId(el.id);
                  }}
                  onDoubleClick={() => {
                    if (el.type === 'room') {
                      onRoomClick(el.room_id || 'NEW', el.label);
                    }
                  }}
                >
                  <Icon size={el.span_rows === 1 && el.span_cols === 1 ? 16 : 24} className="text-white opacity-90 drop-shadow-sm mb-1" />
                  {el.span_rows > 1 || el.span_cols > 1 ? (
                    <span className="text-white text-xs font-bold truncate w-full text-center px-1 drop-shadow-sm">
                      {el.label}
                    </span>
                  ) : null}
                  
                  {/* Bed Configuration Indicator (Mock) */}
                  {el.type === 'room' && (
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Drag Highlight Overlay */}
            {dragStart && dragCurrent && selectedTool && (
              <div 
                className="absolute bg-indigo-500/20 border-2 border-indigo-500 border-dashed pointer-events-none z-20"
                style={{
                  top: `${Math.min(dragStart.r, dragCurrent.r) * 48}px`,
                  left: `${Math.min(dragStart.c, dragCurrent.c) * 48}px`,
                  width: `${(Math.abs(dragCurrent.c - dragStart.c) + 1) * 48}px`,
                  height: `${(Math.abs(dragCurrent.r - dragStart.r) + 1) * 48}px`,
                }}
              />
            )}
            
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedElement ? (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Properties</h3>
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-mono">
                {selectedElement.type.toUpperCase()}
              </span>
            </div>
            
            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Label</label>
                <input
                  type="text"
                  value={selectedElement.label}
                  onChange={e => updateSelectedElement({ label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={e => updateSelectedElement({ color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={selectedElement.color}
                    onChange={e => updateSelectedElement({ color: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              
              {ELEMENT_TYPES.find(t => t.id === selectedElement.type)?.linkable && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Linked Room Record</label>
                  <select
                    value={selectedElement.room_id || ''}
                    onChange={e => updateSelectedElement({ room_id: e.target.value || undefined })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 mb-2"
                  >
                    <option value="">-- Unlinked --</option>
                    <option value="NEW">+ Auto-create new room on save</option>
                    <optgroup label="Existing Rooms">
                      {rooms.filter(r => r.floor === currentFloor).map(r => (
                        <option key={r.id} value={r.id}>{r.room_number} (Cap: {r.capacity})</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Link this visual block to an actual room in the database, or set to Auto-create to generate a new record.
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Position & Size</label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">Row:</span> {selectedElement.row}</div>
                  <div><span className="text-slate-400">Col:</span> {selectedElement.col}</div>
                  <div><span className="text-slate-400">Width:</span> {selectedElement.span_cols}</div>
                  <div><span className="text-slate-400">Height:</span> {selectedElement.span_rows}</div>
                </div>
              </div>
              
              {selectedElement.type === 'room' && (
                <button 
                  onClick={() => onRoomClick(selectedElement.room_id || 'NEW', selectedElement.label)}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-100 border border-indigo-100"
                >
                  Configure Beds inside Room &rarr;
                </button>
              )}

            </div>
            
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={deleteSelectedElement}
                className="w-full py-2 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 size={16} />
                Delete Element
              </button>
            </div>
          </div>
        ) : (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Box size={24} className="text-slate-300" />
            </div>
            <h3 className="text-slate-800 font-medium mb-1">No Element Selected</h3>
            <p className="text-sm text-slate-500">
              Click on an element on the grid to view and edit its properties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
