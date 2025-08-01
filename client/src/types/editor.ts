export type ToolId = 
  | 'move'
  | 'rectangle-select' | 'ellipse-select' | 'lasso-select'
  | 'magic-wand' | 'quick-selection' | 'quick-select' | 'object-selection'
  | 'crop'
  | 'eyedropper' | 'color-sampler' | 'ruler'
  | 'spot-healing' | 'healing-brush' | 'healing' | 'patch' | 'red-eye'
  | 'brush' | 'pencil' | 'color-replacement'
  | 'clone'
  | 'eraser'
  | 'paint-bucket' | 'gradient'
  | 'blur' | 'sharpen' | 'smudge'
  | 'dodge' | 'burn' | 'sponge'
  | 'type' | 'text' | 'vertical-type'
  | 'pen' | 'free-pen' | 'add-anchor' | 'delete-anchor' | 'convert-anchor'
  | 'path-select' | 'direct-select'
  | 'rectangle' | 'ellipse' | 'line' | 'parametric-shape' | 'custom-shape' | 'shape'
  | 'hand' | 'rotate-view'
  | 'zoom';

export interface Tool {
  id: ToolId;
  name: string;
  icon: string;
  shortcut: string;
  category: 'selection' | 'painting' | 'retouching' | 'drawing' | 'navigation' | 'transformation';
}

export interface MenuItem {
  label: string;
  action: () => void;
  shortcut?: string;
  submenu?: MenuItem[];
  checked?: boolean;
}

export interface MenuSeparator {
  type: 'separator';
}

export interface Layer {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'text' | 'adjustment';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  data: any;
  thumbnail?: string;
}

export type BlendMode = 
  | 'normal' 
  | 'multiply' 
  | 'screen' 
  | 'overlay' 
  | 'soft-light' 
  | 'hard-light' 
  | 'color-dodge' 
  | 'color-burn' 
  | 'darken' 
  | 'lighten' 
  | 'difference' 
  | 'exclusion';

export interface Document {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
  activeLayerId: string;
  zoom: number;
  pan: { x: number; y: number };
  saved: boolean;
}

export interface ToolOptions {
  brushSize: number;
  opacity: number;
  flow: number;
  hardness: number;
  blendMode: BlendMode;
}

export interface Selection {
  active: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  marching: boolean;
}

export interface HistoryStep {
  action: string;
  timestamp: number;
  data: any;
}

export interface EditorState {
  documents: Document[];
  activeDocumentId: string | null;
  activeTool: string;
  toolOptions: ToolOptions;
  selection: Selection;
  history: HistoryStep[];
  historyIndex: number;
  isDrawing: boolean;
  canvasRef: HTMLCanvasElement | null;
}
