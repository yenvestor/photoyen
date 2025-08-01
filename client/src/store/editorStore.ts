import { create } from 'zustand';
import { EditorState, Document, Layer, Tool, HistoryStep, ToolId } from '@/types/editor';
import { TOOL_NAMES, toolHandlers } from '@/utils/toolHandlers';

interface EditorStore extends EditorState {
  // Document actions
  createDocument: (name: string, width: number, height: number) => void;
  closeDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  
  // Layer actions
  addLayer: (layer: Omit<Layer, 'id'>) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  setActiveLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  
  // Tool actions
  setActiveTool: (toolId: ToolId) => void;
  updateToolOptions: (options: Partial<EditorState['toolOptions']>) => void;
  
  // History actions
  addHistoryStep: (step: Omit<HistoryStep, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  
  // Canvas actions
  setCanvasRef: (ref: HTMLCanvasElement) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  
  // Drawing state
  setIsDrawing: (drawing: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  documents: [],
  activeDocumentId: null,
  activeTool: 'move',
  toolOptions: {
    brushSize: 20,
    opacity: 100,
    flow: 100,
    hardness: 100,
    blendMode: 'normal',
  },
  selection: {
    active: false,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    marching: false,
  },
  history: [],
  historyIndex: -1,
  isDrawing: false,
  canvasRef: null,

  // Document actions
  createDocument: (name, width, height) => {
    const id = crypto.randomUUID();
    const backgroundLayer: Layer = {
      id: crypto.randomUUID(),
      name: 'Background',
      type: 'raster',
      visible: true,
      locked: true,
      opacity: 100,
      blendMode: 'normal',
      data: null,
    };
    
    const document: Document = {
      id,
      name,
      width,
      height,
      layers: [backgroundLayer],
      activeLayerId: backgroundLayer.id,
      zoom: 100,
      pan: { x: 0, y: 0 },
      saved: false,
    };
    
    set(state => ({
      documents: [...state.documents, document],
      activeDocumentId: id,
    }));
  },

  closeDocument: (id) => {
    set(state => {
      const documents = state.documents.filter(doc => doc.id !== id);
      const activeDocumentId = state.activeDocumentId === id 
        ? (documents.length > 0 ? documents[0].id : null)
        : state.activeDocumentId;
      
      return { documents, activeDocumentId };
    });
  },

  setActiveDocument: (id) => {
    set({ activeDocumentId: id });
  },

  updateDocument: (id, updates) => {
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    }));
  },

  // Layer actions
  addLayer: (layer) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    const newLayer: Layer = {
      ...layer,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === activeDocumentId 
          ? { 
              ...doc, 
              layers: [...doc.layers, newLayer],
              activeLayerId: newLayer.id,
              saved: false,
            }
          : doc
      ),
    }));
  },

  removeLayer: (layerId) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === activeDocumentId 
          ? { 
              ...doc, 
              layers: doc.layers.filter(layer => layer.id !== layerId),
              saved: false,
            }
          : doc
      ),
    }));
  },

  updateLayer: (layerId, updates) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === activeDocumentId 
          ? { 
              ...doc, 
              layers: doc.layers.map(layer => 
                layer.id === layerId ? { ...layer, ...updates } : layer
              ),
              saved: false,
            }
          : doc
      ),
    }));
  },

  setActiveLayer: (layerId) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === activeDocumentId 
          ? { ...doc, activeLayerId: layerId }
          : doc
      ),
    }));
  },

  reorderLayers: (fromIndex, toIndex) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    set(state => ({
      documents: state.documents.map(doc => {
        if (doc.id === activeDocumentId) {
          const layers = [...doc.layers];
          const [removed] = layers.splice(fromIndex, 1);
          layers.splice(toIndex, 0, removed);
          return { ...doc, layers, saved: false };
        }
        return doc;
      }),
    }));
  },

  // Tool actions
  setActiveTool: (toolId) => {
    const state = get();
    const previousTool = state.activeTool as ToolId;
    
    // Deactivate previous tool
    if (state.canvasRef && previousTool && toolHandlers[previousTool]) {
      toolHandlers[previousTool].onDeactivate(state.canvasRef);
    }
    
    // Set new tool
    set({ activeTool: toolId });
    
    // Activate new tool
    if (state.canvasRef && toolHandlers[toolId]) {
      toolHandlers[toolId].onActivate(state.canvasRef);
    }
    
    // Add to history
    const toolName = TOOL_NAMES[toolId];
    state.addHistoryStep({
      action: `Selected ${toolName}`,
      data: { tool: toolId, previousTool },
    });
  },

  updateToolOptions: (options) => {
    set(state => ({
      toolOptions: { ...state.toolOptions, ...options },
    }));
  },

  // History actions
  addHistoryStep: (step) => {
    const historyStep: HistoryStep = {
      ...step,
      timestamp: Date.now(),
    };
    
    set(state => {
      const history = state.history.slice(0, state.historyIndex + 1);
      return {
        history: [...history, historyStep],
        historyIndex: history.length,
      };
    });
  },

  undo: () => {
    set(state => ({
      historyIndex: Math.max(-1, state.historyIndex - 1),
    }));
  },

  redo: () => {
    set(state => ({
      historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1),
    }));
  },

  // Canvas actions
  setCanvasRef: (ref) => {
    set({ canvasRef: ref });
  },

  setZoom: (zoom) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === activeDocumentId ? { ...doc, zoom } : doc
      ),
    }));
  },

  setPan: (pan) => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;
    
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === activeDocumentId ? { ...doc, pan } : doc
      ),
    }));
  },

  setIsDrawing: (drawing) => {
    set({ isDrawing: drawing });
  },
}));
