import React from 'react';
import { Stack, Eye, EyeSlash, PenNib } from '@phosphor-icons/react';

export type PCBLayer = 'TopLayer' | 'BottomLayer' | 'TopSilkLayer' | 'BoardOutline';

interface Props {
  activeLayer: PCBLayer;
  setActiveLayer: (layer: PCBLayer) => void;
  layerVisibility: Record<PCBLayer, boolean>;
  toggleVisibility: (layer: PCBLayer) => void;
  className?: string;
}

const LAYER_CONFIGS = [
  { id: 'TopLayer', name: 'Top Layer', color: '#ff0000', canRoute: true },
  { id: 'BottomLayer', name: 'Bottom Layer', color: '#0000ff', canRoute: true },
  { id: 'TopSilkLayer', name: 'Top Silk', color: '#facc15', canRoute: false },
  { id: 'BoardOutline', name: 'Board Outline', color: '#06301A', canRoute: false },
] as const;

export default function LayerManagerPanel({ activeLayer, setActiveLayer, layerVisibility, toggleVisibility, className }: Props) {
  return (
    <div className={`w-56 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 ${className || ''}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-700/50">
        <Stack size={16} weight="bold" className="text-gray-400" />
        <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">Layers & Objects</span>
      </div>

      <div className="p-2 space-y-1">
        {LAYER_CONFIGS.map((layer) => {
          const isActive = activeLayer === layer.id;
          const isVisible = layerVisibility[layer.id];

          return (
            <div
              key={layer.id}
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'bg-gray-800/80' : 'hover:bg-gray-800/40'
              }`}
              onClick={() => {
                if (layer.canRoute) setActiveLayer(layer.id as PCBLayer);
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm border border-gray-600"
                  style={{ backgroundColor: layer.color }}
                />
                <span className={`text-[11px] font-mono ${isActive ? 'text-white font-bold' : 'text-gray-400'}`}>
                  {layer.name}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {isActive && <PenNib size={12} weight="bold" className="text-emerald-400 mr-1" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id as PCBLayer);
                  }}
                  className="p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-gray-300"
                >
                  {isVisible ? <Eye size={14} weight="bold" /> : <EyeSlash size={14} weight="bold" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
