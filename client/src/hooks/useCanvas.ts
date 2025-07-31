import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { CanvasRenderer } from '@/utils/canvas';
import { toolHandlers } from '@/utils/toolHandlers';
import { ToolId } from '@/types/editor';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  
  const {
    activeDocumentId,
    documents,
    setCanvasRef,
    activeTool,
    toolOptions,
    isDrawing,
    setIsDrawing,
  } = useEditorStore();

  const activeDocument = documents.find(doc => doc.id === activeDocumentId);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasRef(canvasRef.current);
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
  }, [setCanvasRef]);

  useEffect(() => {
    if (rendererRef.current && activeDocument && canvasRef.current) {
      const renderer = rendererRef.current;
      // Only initialize once per document - keep canvas white by default
      if (!canvasRef.current.dataset.initialized) {
        // Don't draw checkerboard - keep white background
        canvasRef.current.dataset.initialized = 'true';
      }
    }
  }, [activeDocument?.id]);

  const renderDocument = () => {
    if (!rendererRef.current || !activeDocument) return;

    const renderer = rendererRef.current;
    // Don't clear everything automatically - preserve user drawings
    
    // Only render layers (background layers, etc.)
    activeDocument.layers.forEach(layer => {
      if (layer.visible && layer.data) {
        renderer.drawLayer(layer, layer.opacity);
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const mouseEvent = e.nativeEvent as MouseEvent;
    
    setIsDrawing(true);

    // Use tool handlers for mouse down
    const toolId = activeTool as ToolId;
    if (toolHandlers[toolId]?.onMouseDown) {
      toolHandlers[toolId].onMouseDown!(mouseEvent, canvas, toolOptions);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const mouseEvent = e.nativeEvent as MouseEvent;

    // Use tool handlers for mouse move (both drawing and hovering)
    const toolId = activeTool as ToolId;
    if (toolHandlers[toolId]?.onMouseMove) {
      toolHandlers[toolId].onMouseMove!(mouseEvent, canvas, toolOptions);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const mouseEvent = e.nativeEvent as MouseEvent;
    
    setIsDrawing(false);

    // Use tool handlers for mouse up
    const toolId = activeTool as ToolId;
    if (toolHandlers[toolId]?.onMouseUp) {
      toolHandlers[toolId].onMouseUp!(mouseEvent, canvas, toolOptions);
    }
  };

  // Tool activation/deactivation when canvas is ready
  useEffect(() => {
    if (canvasRef.current && activeTool) {
      const toolId = activeTool as ToolId;
      if (toolHandlers[toolId]) {
        toolHandlers[toolId].onActivate(canvasRef.current);
      }
    }
  }, [activeTool]);

  return {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    renderDocument,
  };
}
