import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ToolId } from '@/types/editor';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const { 
    setActiveTool, 
    activeTool, 
    undo, 
    redo, 
    createDocument,
    toolOptions,
    updateToolOptions 
  } = useEditorStore();

  const shortcuts: KeyboardShortcut[] = [
    // Tool shortcuts
    { key: 'v', action: () => setActiveTool('move'), description: 'Move Tool' },
    { key: 'm', action: () => setActiveTool('rectangle-select'), description: 'Rectangle Select' },
    { key: 'l', action: () => setActiveTool('lasso-select'), description: 'Lasso Select' },
    { key: 'w', action: () => setActiveTool('magic-wand'), description: 'Magic Wand' },
    { key: 'b', action: () => setActiveTool('brush'), description: 'Brush Tool' },
    { key: 'e', action: () => setActiveTool('eraser'), description: 'Eraser Tool' },
    { key: 'g', action: () => setActiveTool('paint-bucket'), description: 'Paint Bucket' },
    { key: 's', action: () => setActiveTool('clone'), description: 'Clone Stamp' },
    { key: 'h', action: () => setActiveTool('hand'), description: 'Hand Tool' },
    { key: 'z', action: () => setActiveTool('zoom'), description: 'Zoom Tool' },
    { key: 'c', action: () => setActiveTool('crop'), description: 'Crop Tool' },
    { key: 'i', action: () => setActiveTool('eyedropper'), description: 'Eyedropper' },
    { key: 't', action: () => setActiveTool('type'), description: 'Text Tool' },
    { key: 'p', action: () => setActiveTool('pen'), description: 'Pen Tool' },
    { key: 'u', action: () => setActiveTool('rectangle'), description: 'Rectangle Shape' },
    { key: 'j', action: () => setActiveTool('spot-healing'), description: 'Healing Brush' },
    { key: 'r', action: () => setActiveTool('blur'), description: 'Blur Tool' },
    { key: 'o', action: () => setActiveTool('dodge'), description: 'Dodge Tool' },
    
    // Edit shortcuts
    { key: 'z', ctrlKey: true, action: () => undo(), description: 'Undo' },
    { key: 'y', ctrlKey: true, action: () => redo(), description: 'Redo' },
    { key: 'z', ctrlKey: true, shiftKey: true, action: () => redo(), description: 'Redo (Alt)' },
    
    // File shortcuts
    { key: 'n', ctrlKey: true, action: () => createDocument('New Document', 800, 600), description: 'New Document' },
    
    // Brush size shortcuts
    { key: '[', action: () => {
        const newSize = Math.max(1, toolOptions.brushSize - 5);
        updateToolOptions({ brushSize: newSize });
      }, description: 'Decrease Brush Size' 
    },
    { key: ']', action: () => {
        const newSize = Math.min(300, toolOptions.brushSize + 5);
        updateToolOptions({ brushSize: newSize });
      }, description: 'Increase Brush Size' 
    },
    
    // Opacity shortcuts
    { key: '1', action: () => updateToolOptions({ opacity: 10 }), description: '10% Opacity' },
    { key: '2', action: () => updateToolOptions({ opacity: 20 }), description: '20% Opacity' },
    { key: '3', action: () => updateToolOptions({ opacity: 30 }), description: '30% Opacity' },
    { key: '4', action: () => updateToolOptions({ opacity: 40 }), description: '40% Opacity' },
    { key: '5', action: () => updateToolOptions({ opacity: 50 }), description: '50% Opacity' },
    { key: '6', action: () => updateToolOptions({ opacity: 60 }), description: '60% Opacity' },
    { key: '7', action: () => updateToolOptions({ opacity: 70 }), description: '70% Opacity' },
    { key: '8', action: () => updateToolOptions({ opacity: 80 }), description: '80% Opacity' },
    { key: '9', action: () => updateToolOptions({ opacity: 90 }), description: '90% Opacity' },
    { key: '0', action: () => updateToolOptions({ opacity: 100 }), description: '100% Opacity' },
    
    // Color shortcuts
    { key: 'd', action: () => {
        // Reset colors to default (black/white)
        const foreground = document.querySelector('.foreground-color') as HTMLElement;
        const background = document.querySelector('.background-color') as HTMLElement;
        if (foreground) foreground.style.backgroundColor = '#000000';
        if (background) background.style.backgroundColor = '#ffffff';
      }, description: 'Default Colors' 
    },
    { key: 'x', action: () => {
        // Swap foreground and background colors
        const foreground = document.querySelector('.foreground-color') as HTMLElement;
        const background = document.querySelector('.background-color') as HTMLElement;
        if (foreground && background) {
          const fgColor = foreground.style.backgroundColor;
          const bgColor = background.style.backgroundColor;
          foreground.style.backgroundColor = bgColor;
          background.style.backgroundColor = fgColor;
        }
      }, description: 'Swap Colors' 
    },
    
    // View shortcuts
    { key: '=', ctrlKey: true, action: () => {
        // Zoom in
        const zoomButton = document.querySelector('[title="Zoom In"]') as HTMLButtonElement;
        if (zoomButton) zoomButton.click();
      }, description: 'Zoom In' 
    },
    { key: '-', ctrlKey: true, action: () => {
        // Zoom out
        const zoomButton = document.querySelector('[title="Zoom Out"]') as HTMLButtonElement;
        if (zoomButton) zoomButton.click();
      }, description: 'Zoom Out' 
    },
    { key: '0', ctrlKey: true, action: () => {
        // Fit to screen
        const fitButton = document.querySelector('[title="Fit to Screen"]') as HTMLButtonElement;
        if (fitButton) fitButton.click();
      }, description: 'Fit to Screen' 
    },
    
    // Space bar for temporary hand tool
    { key: ' ', action: () => {
        if (activeTool !== 'hand') {
          // Temporarily switch to hand tool
          (window as any).previousTool = activeTool;
          setActiveTool('hand');
        }
      }, description: 'Hand Tool (Hold)' 
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.contentEditable === 'true') {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlKey = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
      const altKey = event.altKey;
      const shiftKey = event.shiftKey;

      const shortcut = shortcuts.find(s => 
        s.key === key &&
        (s.ctrlKey === undefined || s.ctrlKey === ctrlKey) &&
        (s.altKey === undefined || s.altKey === altKey) &&
        (s.shiftKey === undefined || s.shiftKey === shiftKey)
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Handle space bar release to return to previous tool
      if (event.key === ' ' && (window as any).previousTool) {
        setActiveTool((window as any).previousTool);
        (window as any).previousTool = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts, activeTool]);

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      ctrlKey: s.ctrlKey,
      altKey: s.altKey,
      shiftKey: s.shiftKey,
      description: s.description
    }))
  };
}