import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import LayersPanel from './LayersPanel';

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState('layers');
  const {
    documents,
    activeDocumentId,
    addLayer,
    removeLayer,
    updateLayer,
    setActiveLayer,
    history,
    undo,
    redo,
  } = useEditorStore();

  const activeDocument = documents.find(doc => doc.id === activeDocumentId);
  const activeLayer = activeDocument?.layers.find(layer => layer.id === activeDocument.activeLayerId);

  const handleAddLayer = () => {
    if (activeDocumentId) {
      addLayer(activeDocumentId, {
        name: `Layer ${(activeDocument?.layers.length || 0) + 1}`,
        type: 'raster',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        data: null,
      });
    }
  };

  const handleDeleteLayer = () => {
    if (activeLayer && activeDocument && activeDocumentId && activeDocument.layers.length > 1) {
      removeLayer(activeDocumentId, activeLayer.id);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    const layer = activeDocument?.layers.find(l => l.id === layerId);
    if (layer && activeDocumentId) {
      updateLayer(activeDocumentId, layerId, { visible: !layer.visible });
    }
  };

  const swatchColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
    '#9999FF', '#993366', '#FFFFCC', '#CCFFFF', '#660066', '#FF8080', '#0066CC', '#CCCCFF',
    '#000080', '#FF00FF', '#FFFF00', '#00FFFF', '#800080', '#800000', '#008080', '#0000FF'
  ];

  const channels = ['RGB', 'Red', 'Green', 'Blue', 'Alpha'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'layers':
        return renderLayersPanel();
      case 'channels':
        return renderChannelsPanel();
      case 'paths':
        return renderPathsPanel();
      case 'swatches':
        return renderSwatchesPanel();
      case 'history':
        return renderHistoryPanel();
      case 'navigator':
        return renderNavigatorPanel();
      default:
        return renderLayersPanel();
    }
  };

  const renderLayersPanel = () => (
    <>
      {/* Layer Blend Mode */}
      {activeLayer && (
        <div className="px-3 pb-2 pt-2">
          <select 
            className="w-full bg-tertiary-dark border border-quaternary-dark rounded px-2 py-1 text-sm"
            value={activeLayer.blendMode}
            onChange={(e) => activeDocumentId && updateLayer(activeDocumentId, activeLayer.id, { blendMode: e.target.value as any })}
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="soft-light">Soft Light</option>
            <option value="hard-light">Hard Light</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
          </select>
        </div>
      )}

      {/* Layer Opacity */}
      {activeLayer && (
        <div className="px-3 pb-3 flex items-center space-x-2">
          <span className="text-xs text-text-secondary">Opacity:</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={activeLayer.opacity}
            className="flex-1 h-2 bg-tertiary-dark rounded-lg"
            onChange={(e) => activeDocumentId && updateLayer(activeDocumentId, activeLayer.id, { opacity: parseInt(e.target.value) })}
          />
          <span className="text-xs w-8">{activeLayer.opacity}%</span>
        </div>
      )}

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {activeDocument?.layers.slice().reverse().map((layer, index) => (
          <div
            key={layer.id}
            className={`p-2 flex items-center cursor-pointer border-b border-tertiary-dark hover:bg-tertiary-dark ${
              layer.id === activeDocument.activeLayerId ? 'bg-accent-blue' : ''
            }`}
            onClick={() => activeDocumentId && setActiveLayer(activeDocumentId, layer.id)}
          >
            <div className="w-4 h-4 mr-2 flex items-center justify-center">
              <button onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisibility(layer.id);
              }}>
                <i className={`fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} text-xs ${
                  layer.visible ? 'text-accent-blue' : 'text-text-tertiary'
                }`}></i>
              </button>
            </div>
            <div className="w-12 h-12 bg-tertiary-dark rounded mr-3 flex items-center justify-center">
              <i className="fas fa-image text-text-tertiary"></i>
            </div>
            <div className="flex-1">
              <div className="text-sm">{layer.name}</div>
              <div className="text-xs text-text-tertiary capitalize">{layer.type}</div>
            </div>
            {layer.locked && (
              <div className="w-4 h-4 ml-2">
                <i className="fas fa-lock text-xs text-text-tertiary"></i>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderChannelsPanel = () => (
    <div className="p-3">
      {channels.map((channel, index) => (
        <div key={channel} className="flex items-center p-2 hover:bg-tertiary-dark rounded cursor-pointer">
          <div className="w-4 h-4 mr-3">
            <i className="fas fa-eye text-accent-blue text-xs"></i>
          </div>
          <div className="w-8 h-8 bg-tertiary-dark rounded mr-3 flex items-center justify-center">
            <span className="text-xs font-mono">{channel === 'RGB' ? 'RGB' : channel[0]}</span>
          </div>
          <span className="text-sm">{channel}</span>
        </div>
      ))}
    </div>
  );

  const renderPathsPanel = () => (
    <div className="p-3">
      <div className="text-sm text-text-secondary text-center py-8">
        No paths created yet
      </div>
      <div className="flex space-x-1 mt-2">
        <button className="flex-1 p-2 bg-tertiary-dark hover:bg-quaternary-dark rounded text-xs" title="New Path">
          <i className="fas fa-plus"></i>
        </button>
        <button className="flex-1 p-2 bg-tertiary-dark hover:bg-quaternary-dark rounded text-xs" title="Delete Path">
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  const renderSwatchesPanel = () => (
    <div className="p-2">
      <div className="grid grid-cols-10 gap-1">
        {swatchColors.map((color, index) => (
          <div
            key={index}
            className="w-4 h-4 border border-gray-500 cursor-pointer hover:border-white"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );

  const renderHistoryPanel = () => (
    <div className="p-3">
      <div className="flex-1 overflow-y-auto">
        {history.slice(-10).map((step, index) => (
          <div 
            key={index}
            className="flex items-center p-1 hover:bg-tertiary-dark rounded cursor-pointer text-sm"
            onClick={() => {
              // Implement step navigation
            }}
          >
            <i className="fas fa-paintbrush text-xs mr-2 text-text-tertiary"></i>
            <span>{step.action}</span>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-xs text-text-tertiary p-2">No history</div>
        )}
      </div>
    </div>
  );

  const renderNavigatorPanel = () => (
    <div className="p-3">
      <div className="bg-tertiary-dark h-32 rounded flex items-center justify-center">
        <i className="fas fa-image text-text-tertiary text-2xl"></i>
      </div>
      <div className="mt-2 text-xs text-text-secondary">
        Navigator preview
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-gray-700 border-l border-gray-600 flex flex-col h-full text-xs">
      {/* Top Section - History and Swatches tabs */}
      <div className="h-48 border-b border-gray-600">
        <div className="flex bg-gray-800">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-2 py-1 text-xs ${
              activeTab === 'history' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-history mr-1"></i>
            History
          </button>
          <button
            onClick={() => setActiveTab('swatches')}
            className={`flex-1 px-2 py-1 text-xs ${
              activeTab === 'swatches' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-palette mr-1"></i>
            Swatches
          </button>
          <button className="px-2 py-1 text-gray-400 hover:text-white">
            <i className="fas fa-bars text-xs"></i>
          </button>
        </div>
        
        {/* Top panel content */}
        <div className="flex-1 p-2 bg-gray-700 overflow-y-auto">
          {activeTab === 'history' && (
            <div className="space-y-1">
              <div className="text-white text-xs py-1">Rectangle Select</div>
              <div className="text-white text-xs py-1">Deselect</div>
              <div className="text-white text-xs py-1">Rectangle Select</div>
              <div className="text-white text-xs py-1">Rectangle Select</div>
              <div className="text-white text-xs py-1">Deselect</div>
              <div className="text-white text-xs py-1">Deselect</div>
            </div>
          )}
          {activeTab === 'swatches' && renderSwatchesPanel()}
        </div>
      </div>

      {/* Bottom Section - Layers, Channels, Paths tabs */}
      <div className="flex-1 flex flex-col">
        <div className="flex bg-gray-800">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 px-2 py-1 text-xs ${
              activeTab === 'layers' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-layer-group mr-1"></i>
            Layers
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 px-2 py-1 text-xs ${
              activeTab === 'channels' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-sliders-h mr-1"></i>
            Channels
          </button>
          <button
            onClick={() => setActiveTab('paths')}
            className={`flex-1 px-2 py-1 text-xs ${
              activeTab === 'paths' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-bezier-curve mr-1"></i>
            Paths
          </button>
          <button className="px-2 py-1 text-gray-400 hover:text-white">
            <i className="fas fa-bars text-xs"></i>
          </button>
        </div>

        {/* Bottom panel content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'layers' && <LayersPanel />}
          
          {activeTab === 'channels' && renderChannelsPanel()}
          {activeTab === 'paths' && renderPathsPanel()}
        </div>


      </div>
    </div>
  );
}
