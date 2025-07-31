import { useEditorStore } from '@/store/editorStore';
import { Layer, BlendMode } from '@/types/editor';
import { useState } from 'react';

export default function LayersPanel() {
  const { 
    documents, 
    activeDocumentId, 
    addLayer, 
    removeLayer, 
    updateLayer, 
    setActiveLayer,
    reorderLayers 
  } = useEditorStore();
  
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  
  const activeDocument = documents.find(doc => doc.id === activeDocumentId);
  const layers = activeDocument?.layers || [];
  const activeLayerId = activeDocument?.activeLayerId;

  const handleAddLayer = () => {
    const newLayer: Omit<Layer, 'id'> = {
      name: `Layer ${layers.length + 1}`,
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      data: null,
    };
    addLayer(newLayer);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length > 1) { // Don't delete the last layer
      removeLayer(layerId);
    }
  };

  const handleToggleVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  };

  const handleToggleLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity });
  };

  const handleBlendModeChange = (layerId: string, blendMode: BlendMode) => {
    updateLayer(layerId, { blendMode });
  };

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    
    if (!draggedLayer || draggedLayer === targetLayerId) {
      setDraggedLayer(null);
      return;
    }

    const draggedIndex = layers.findIndex(l => l.id === draggedLayer);
    const targetIndex = layers.findIndex(l => l.id === targetLayerId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      reorderLayers(draggedIndex, targetIndex);
    }
    
    setDraggedLayer(null);
  };

  const renderLayer = (layer: Layer, index: number) => {
    const isActive = layer.id === activeLayerId;
    const isDragging = draggedLayer === layer.id;
    
    return (
      <div
        key={layer.id}
        className={`flex items-center p-2 border-b border-gray-500 cursor-pointer transition-colors
          ${isActive ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-550'}
          ${isDragging ? 'opacity-50' : ''}
        `}
        onClick={() => setActiveLayer(layer.id)}
        draggable
        onDragStart={(e) => handleDragStart(e, layer.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, layer.id)}
      >
        {/* Visibility toggle */}
        <button
          className={`mr-2 w-4 h-4 flex items-center justify-center
            ${layer.visible ? 'text-white' : 'text-gray-400'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleVisibility(layer.id);
          }}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          <i className={`fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} text-xs`}></i>
        </button>

        {/* Layer thumbnail */}
        <div className="w-8 h-6 bg-white mr-2 border border-gray-400 rounded-sm flex items-center justify-center">
          {layer.type === 'text' ? (
            <i className="fas fa-font text-xs text-gray-600"></i>
          ) : layer.type === 'vector' ? (
            <i className="fas fa-bezier-curve text-xs text-gray-600"></i>
          ) : layer.type === 'adjustment' ? (
            <i className="fas fa-adjust text-xs text-gray-600"></i>
          ) : (
            <i className="fas fa-image text-xs text-gray-600"></i>
          )}
        </div>

        {/* Layer name */}
        <span className="text-white text-xs flex-1 truncate">{layer.name}</span>

        {/* Opacity display */}
        {layer.opacity < 100 && (
          <span className="text-gray-300 text-xs mr-2">{layer.opacity}%</span>
        )}

        {/* Lock indicator */}
        {layer.locked && (
          <button
            className="text-gray-300 hover:text-white w-4 h-4 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock(layer.id);
            }}
            title="Unlock layer"
          >
            <i className="fas fa-lock text-xs"></i>
          </button>
        )}
      </div>
    );
  };

  if (!activeDocument) {
    return (
      <div className="p-4 text-center text-gray-400">
        <i className="fas fa-layer-group text-2xl mb-2"></i>
        <p className="text-xs">No document open</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Layer controls */}
      <div className="p-2 space-y-2 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <select 
            className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-xs text-white"
            value={layers.find(l => l.id === activeLayerId)?.blendMode || 'normal'}
            onChange={(e) => {
              if (activeLayerId) {
                handleBlendModeChange(activeLayerId, e.target.value as BlendMode);
              }
            }}
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="soft-light">Soft Light</option>
            <option value="hard-light">Hard Light</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
            <option value="difference">Difference</option>
            <option value="exclusion">Exclusion</option>
          </select>
          
          <span className="text-gray-400 text-xs">Opacity:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={layers.find(l => l.id === activeLayerId)?.opacity || 100}
            className="w-16"
            onChange={(e) => {
              if (activeLayerId) {
                handleOpacityChange(activeLayerId, parseInt(e.target.value));
              }
            }}
          />
          <span className="text-gray-300 text-xs w-8">
            {layers.find(l => l.id === activeLayerId)?.opacity || 100}%
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-xs">Lock:</span>
          <button 
            className={`${
              layers.find(l => l.id === activeLayerId)?.locked ? 'text-white' : 'text-gray-400'
            } hover:text-white`}
            onClick={() => {
              if (activeLayerId) {
                handleToggleLock(activeLayerId);
              }
            }}
          >
            <i className="fas fa-lock text-xs"></i>
          </button>
          
          <div className="flex-1"></div>
          
          <span className="text-gray-400 text-xs">Fill:</span>
          <span className="text-gray-300 text-xs">100%</span>
        </div>
      </div>
      
      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.slice().reverse().map((layer, index) => renderLayer(layer, layers.length - 1 - index))}
      </div>

      {/* Layer action buttons */}
      <div className="border-t border-gray-600 p-2 bg-gray-800">
        <div className="flex justify-center space-x-2">
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={handleAddLayer}
            title="Add new layer"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={() => {
              if (activeLayerId && layers.length > 1) {
                handleDeleteLayer(activeLayerId);
              }
            }}
            title="Delete layer"
            disabled={layers.length <= 1}
          >
            <i className="fas fa-trash text-xs"></i>
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            title="Duplicate layer"
            onClick={() => {
              const activeLayer = layers.find(l => l.id === activeLayerId);
              if (activeLayer) {
                const duplicatedLayer: Omit<Layer, 'id'> = {
                  ...activeLayer,
                  name: `${activeLayer.name} copy`,
                };
                addLayer(duplicatedLayer);
              }
            }}
          >
            <i className="fas fa-copy text-xs"></i>
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            title="Layer effects"
          >
            <i className="fas fa-magic text-xs"></i>
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            title="Add layer mask"
          >
            <i className="fas fa-mask text-xs"></i>
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            title="Create new group"
          >
            <i className="fas fa-folder text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
}