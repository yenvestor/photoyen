import { ToolId } from '@/types/editor';
import { floodFill, hexToRgb, gaussianBlur, sharpen, denoise, adjustBrightnessContrast, toGrayscale } from './imageProcessing';
import { TextTool } from './textTool';

export interface ToolHandler {
  onActivate: (canvas: HTMLCanvasElement) => void;
  onDeactivate: (canvas: HTMLCanvasElement) => void;
  onMouseDown?: (event: MouseEvent, canvas: HTMLCanvasElement, toolOptions?: any) => void;
  onMouseMove?: (event: MouseEvent, canvas: HTMLCanvasElement, toolOptions?: any) => void;
  onMouseUp?: (event: MouseEvent, canvas: HTMLCanvasElement, toolOptions?: any) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

// Tool name mappings for history
export const TOOL_NAMES: Record<ToolId, string> = {
  // Movement tools
  'move': 'Move Tool',

  
  // Selection tools
  'rectangle-select': 'Rectangle Select Tool',
  'ellipse-select': 'Ellipse Select Tool',
  'lasso-select': 'Lasso Select Tool',
  'magic-wand': 'Magic Wand Tool',
  'quick-selection': 'Quick Selection Tool',
  'object-selection': 'Object Selection Tool',
  
  // Transformation tools
  'crop': 'Crop Tool',
  
  // Color tools
  'eyedropper': 'Eyedropper Tool',
  'color-sampler': 'Color Sampler Tool',
  'ruler': 'Ruler Tool',
  
  // Retouching tools
  'spot-healing': 'Spot Healing Brush Tool',
  'healing-brush': 'Healing Brush Tool',
  'patch': 'Patch Tool',
  'red-eye': 'Red Eye Tool',
  
  // Painting tools
  'brush': 'Brush Tool',
  'pencil': 'Pencil Tool',
  'color-replacement': 'Color Replacement Tool',
  'clone': 'Clone Stamp Tool',
  'eraser': 'Eraser Tool',
  'paint-bucket': 'Paint Bucket Tool',
  'gradient': 'Gradient Tool',
  
  // Filter tools
  'blur': 'Blur Tool',
  'sharpen': 'Sharpen Tool',
  'smudge': 'Smudge Tool',
  'dodge': 'Dodge Tool',
  'burn': 'Burn Tool',
  'sponge': 'Sponge Tool',
  
  // Type tools
  'type': 'Type Tool',
  'vertical-type': 'Vertical Type Tool',
  
  // Path tools
  'pen': 'Pen Tool',
  'free-pen': 'Free Pen Tool',
  'add-anchor': 'Add Anchor Point Tool',
  'delete-anchor': 'Delete Anchor Point Tool',
  'convert-anchor': 'Convert Anchor Point Tool',
  'path-select': 'Path Selection Tool',
  'direct-select': 'Direct Selection Tool',
  
  // Shape tools
  'rectangle': 'Rectangle Tool',
  'ellipse': 'Ellipse Tool',
  'line': 'Line Tool',
  'parametric-shape': 'Parametric Shape Tool',
  'custom-shape': 'Custom Shape Tool',
  
  // Navigation tools
  'hand': 'Hand Tool',
  'rotate-view': 'Rotate View Tool',
  'zoom': 'Zoom Tool',
};

// Basic tool handlers
export const toolHandlers: Record<ToolId, ToolHandler> = {
  // Movement tools
  'move': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'move';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Check if there's a selection to move
      if (canvas.dataset.hasSelection === 'true' && canvas.dataset.selectionBounds) {
        const selectionBounds = JSON.parse(canvas.dataset.selectionBounds);
        
        // Check if click is within selection bounds
        if (x >= selectionBounds.x && x <= selectionBounds.x + selectionBounds.width &&
            y >= selectionBounds.y && y <= selectionBounds.y + selectionBounds.height) {
          
          // Extract selected area content
          const selectedImageData = ctx.getImageData(
            selectionBounds.x, selectionBounds.y, 
            selectionBounds.width, selectionBounds.height
          );
          
          // Clear the selected area from main canvas
          ctx.clearRect(selectionBounds.x, selectionBounds.y, selectionBounds.width, selectionBounds.height);
          
          // Store the extracted content
          canvas._moveSelection = {
            imageData: selectedImageData,
            bounds: selectionBounds
          };
          
          canvas.dataset.moveStartX = x.toString();
          canvas.dataset.moveStartY = y.toString();
          canvas.dataset.moving = 'true';
          canvas.style.cursor = 'grabbing';
          
          console.log('Move tool: moving selection', selectionBounds);
          return;
        }
      }
      
      // Fall back to moving entire canvas content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = Array.from(imageData.data).some((value, index) => {
        return index % 4 !== 3 && value !== 0;
      });
      
      console.log('Move tool: canvas has content:', hasContent);
      
      if (hasContent) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
          canvas._moveBackup = tempCanvas;
        }
      }
      
      canvas.dataset.moveStartX = x.toString();
      canvas.dataset.moveStartY = y.toString();
      canvas.dataset.moving = 'true';
      canvas.style.cursor = 'grabbing';
      
      console.log('Move tool: starting move at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      // Do nothing during move to prevent corruption
      if (canvas.dataset.moving !== 'true') return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.moveStartX || '0');
      const startY = parseInt(canvas.dataset.moveStartY || '0');
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      console.log('Move tool: moving', { deltaX, deltaY });
    },
    onMouseUp: (event, canvas) => {
      if (canvas.dataset.moving !== 'true') return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.moveStartX || '0');
      const startY = parseInt(canvas.dataset.moveStartY || '0');
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Handle moving a selection
      if (canvas._moveSelection && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
        const selection = canvas._moveSelection;
        const newX = selection.bounds.x + deltaX;
        const newY = selection.bounds.y + deltaY;
        
        // Draw the selection at the new position
        ctx.putImageData(selection.imageData, newX, newY);
        
        // Update selection bounds
        const newSelectionBounds = {
          x: newX,
          y: newY,
          width: selection.bounds.width,
          height: selection.bounds.height
        };
        
        canvas.dataset.selectionBounds = JSON.stringify(newSelectionBounds);
        
        // Update selection overlay
        const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
        if (overlay) {
          const overlayCtx = overlay.getContext('2d');
          if (overlayCtx) {
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            overlayCtx.strokeStyle = '#007ACC';
            overlayCtx.lineWidth = 1;
            overlayCtx.setLineDash([3, 3]);
            overlayCtx.strokeRect(newX, newY, newSelectionBounds.width, newSelectionBounds.height);
          }
        }
        
        console.log('Move tool: moved selection to', newSelectionBounds);
        delete canvas._moveSelection;
      }
      // Handle moving entire canvas content
      else if (canvas._moveBackup && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas._moveBackup, deltaX, deltaY);
        console.log('Move tool: moved entire canvas', { deltaX, deltaY });
        delete canvas._moveBackup;
      }
      
      // Clean up
      canvas.dataset.moving = 'false';
      canvas.style.cursor = 'move';
      
      console.log('Move tool: move completed');
    },
  },
  

  // Selection tools
  'rectangle-select': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
      // Clear any selection overlay
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (overlay) overlay.remove();
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.dataset.selectStartX = x.toString();
      canvas.dataset.selectStartY = y.toString();
      canvas.dataset.selecting = 'true';
      
      // Create overlay canvas for selection visualization
      let overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (!overlay) {
        overlay = document.createElement('canvas');
        overlay.className = 'selection-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        canvas.parentElement?.appendChild(overlay);
      }
      
      console.log('Rectangle select: starting selection at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.selecting !== 'true') return;
      
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (!overlay) return;
      
      const overlayCtx = overlay.getContext('2d');
      if (!overlayCtx) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.selectStartX || '0');
      const startY = parseInt(canvas.dataset.selectStartY || '0');
      
      // Clear overlay
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
      
      // Draw selection rectangle on overlay
      overlayCtx.strokeStyle = '#007ACC';
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([3, 3]);
      overlayCtx.strokeRect(
        Math.min(startX, currentX),
        Math.min(startY, currentY),
        Math.abs(currentX - startX),
        Math.abs(currentY - startY)
      );
      overlayCtx.setLineDash([]);
    },
    onMouseUp: (event, canvas) => {
      if (canvas.dataset.selecting !== 'true') return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.selectStartX || '0');
      const startY = parseInt(canvas.dataset.selectStartY || '0');
      
      // Store selection bounds for move tool to use
      const selectionBounds = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY)
      };
      
      if (selectionBounds.width > 5 && selectionBounds.height > 5) {
        canvas.dataset.selectionBounds = JSON.stringify(selectionBounds);
        canvas.dataset.hasSelection = 'true';
        console.log('Rectangle select: selection created', selectionBounds);
      }
      
      canvas.dataset.selecting = 'false';
      
      // Keep selection visible
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (overlay) {
        const overlayCtx = overlay.getContext('2d');
        if (overlayCtx && selectionBounds.width > 5 && selectionBounds.height > 5) {
          overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
          overlayCtx.strokeStyle = '#007ACC';
          overlayCtx.lineWidth = 1;
          overlayCtx.setLineDash([3, 3]);
          overlayCtx.strokeRect(selectionBounds.x, selectionBounds.y, selectionBounds.width, selectionBounds.height);
        }
      }
    },
  },
  
  'ellipse-select': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
      // Clear any selection overlay
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (overlay) overlay.remove();
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.dataset.selectStartX = x.toString();
      canvas.dataset.selectStartY = y.toString();
      canvas.dataset.selecting = 'true';
      
      // Create overlay canvas for selection visualization
      let overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (!overlay) {
        overlay = document.createElement('canvas');
        overlay.className = 'selection-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        canvas.parentElement?.appendChild(overlay);
      }
      
      console.log('Ellipse select: starting selection at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.selecting !== 'true') return;
      
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (!overlay) return;
      
      const overlayCtx = overlay.getContext('2d');
      if (!overlayCtx) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.selectStartX || '0');
      const startY = parseInt(canvas.dataset.selectStartY || '0');
      
      // Clear overlay
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
      
      // Calculate ellipse parameters
      const centerX = (startX + currentX) / 2;
      const centerY = (startY + currentY) / 2;
      const radiusX = Math.abs(currentX - startX) / 2;
      const radiusY = Math.abs(currentY - startY) / 2;
      
      // Draw ellipse selection on overlay
      overlayCtx.strokeStyle = '#007ACC';
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([3, 3]);
      overlayCtx.beginPath();
      overlayCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);
    },
    onMouseUp: (event, canvas) => {
      canvas.dataset.selecting = 'false';
      
      // Keep selection visible briefly, then fade
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (overlay) {
        setTimeout(() => {
          const overlayCtx = overlay.getContext('2d');
          if (overlayCtx) overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        }, 2000);
      }
      
      console.log('Ellipse select: ending selection');
    },
  },
  
  'magic-wand': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (overlay) overlay.remove();
    },
    onMouseDown: (event, canvas) => {
      console.log('Magic wand: Starting selection process');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Magic wand: No canvas context');
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(event.clientX - rect.left);
      const y = Math.floor(event.clientY - rect.top);
      
      console.log('Magic wand: Click at', { x, y, canvasSize: { width: canvas.width, height: canvas.height } });
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Get target color
      const targetIndex = (y * canvas.width + x) * 4;
      const targetColor = {
        r: data[targetIndex],
        g: data[targetIndex + 1],
        b: data[targetIndex + 2]
      };
      
      console.log('Magic wand: Target color', targetColor);
      
      // Simple working flood fill
      const visited = new Set<string>();
      const selected = new Set<string>();
      const tolerance = 30;
      const maxPixels = 50000;
      
      const isColorSimilar = (r: number, g: number, b: number) => {
        const diff = Math.abs(r - targetColor.r) + Math.abs(g - targetColor.g) + Math.abs(b - targetColor.b);
        return diff <= tolerance;
      };
      
      const stack = [{ x, y }];
      
      while (stack.length > 0 && selected.size < maxPixels) {
        const current = stack.pop()!;
        const key = `${current.x},${current.y}`;
        
        if (visited.has(key) || 
            current.x < 0 || current.x >= canvas.width || 
            current.y < 0 || current.y >= canvas.height) {
          continue;
        }
        
        visited.add(key);
        
        const pixelIndex = (current.y * canvas.width + current.x) * 4;
        const pixelColor = {
          r: data[pixelIndex],
          g: data[pixelIndex + 1],
          b: data[pixelIndex + 2]
        };
        
        if (isColorSimilar(pixelColor.r, pixelColor.g, pixelColor.b)) {
          selected.add(key);
          
          // Add neighbors
          stack.push({ x: current.x + 1, y: current.y });
          stack.push({ x: current.x - 1, y: current.y });
          stack.push({ x: current.x, y: current.y + 1 });
          stack.push({ x: current.x, y: current.y - 1 });
        }
      }
      
      console.log('Magic wand: Selected pixels count', selected.size);
      
      if (selected.size === 0) {
        console.log('Magic wand: No pixels selected');
        return;
      }
      
      // Convert to array format for paint bucket
      const selectionArray = new Array(canvas.width * canvas.height).fill(false);
      for (const key of selected) {
        const [px, py] = key.split(',').map(Number);
        selectionArray[py * canvas.width + px] = true;
      }
      
      canvas.dataset.magicWandSelection = JSON.stringify(selectionArray);
      
      // Create simple selection visualization
      let overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement; 
      if (!overlay) {
        overlay = document.createElement('canvas');
        overlay.className = 'selection-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        canvas.parentElement?.appendChild(overlay);
      }
      
      const overlayCtx = overlay.getContext('2d');
      if (overlayCtx) {
        // Find bounds
        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
        for (const key of selected) {
          const [px, py] = key.split(',').map(Number);
          minX = Math.min(minX, px);
          maxX = Math.max(maxX, px);
          minY = Math.min(minY, py);
          maxY = Math.max(maxY, py);
        }
        
        console.log('Magic wand: Selection bounds', { minX, minY, maxX, maxY });
        
        // Draw marching ants
        let offset = 0;
        const drawAnts = () => {
          overlayCtx.clearRect(0, 0, canvas.width, canvas.height);
          
          overlayCtx.strokeStyle = offset % 8 < 4 ? '#000' : '#FFF';
          overlayCtx.lineWidth = 1;
          overlayCtx.setLineDash([3, 3]);
          overlayCtx.lineDashOffset = offset;
          overlayCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
          
          offset += 0.5;
          if (offset < 100) requestAnimationFrame(drawAnts);
        };
        drawAnts();
      }
      
      console.log('Magic wand: Selection complete', {
        selectedPixels: selected.size,
        targetColor,
        tolerance
      });
    },
  },
  
  'quick-selection': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'object-selection': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'lasso-select': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
      // Clear any selection overlay
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (overlay) overlay.remove();
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.dataset.selecting = 'true';
      canvas.dataset.lassoPath = JSON.stringify([{ x, y }]);
      
      // Create overlay canvas for selection visualization
      let overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (!overlay) {
        overlay = document.createElement('canvas');
        overlay.className = 'selection-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        canvas.parentElement?.appendChild(overlay);
      }
      
      console.log('Lasso select: starting at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.selecting !== 'true') return;
      
      const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      if (!overlay) return;
      
      const overlayCtx = overlay.getContext('2d');
      if (!overlayCtx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get current path
      const pathData = JSON.parse(canvas.dataset.lassoPath || '[]');
      pathData.push({ x, y });
      canvas.dataset.lassoPath = JSON.stringify(pathData);
      
      // Draw the lasso path
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
      overlayCtx.strokeStyle = '#007ACC';
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([3, 3]);
      
      overlayCtx.beginPath();
      overlayCtx.moveTo(pathData[0].x, pathData[0].y);
      for (let i = 1; i < pathData.length; i++) {
        overlayCtx.lineTo(pathData[i].x, pathData[i].y);
      }
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);
    },
    onMouseUp: (event, canvas) => {
      if (canvas.dataset.selecting !== 'true') return;
      
      const pathData = JSON.parse(canvas.dataset.lassoPath || '[]');
      
      if (pathData.length > 3) {
        // Close the path and create selection
        const overlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
        if (overlay) {
          const overlayCtx = overlay.getContext('2d');
          if (overlayCtx) {
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            overlayCtx.strokeStyle = '#007ACC';
            overlayCtx.lineWidth = 1;
            overlayCtx.setLineDash([3, 3]);
            
            // Draw closed path
            overlayCtx.beginPath();
            overlayCtx.moveTo(pathData[0].x, pathData[0].y);
            for (let i = 1; i < pathData.length; i++) {
              overlayCtx.lineTo(pathData[i].x, pathData[i].y);
            }
            overlayCtx.closePath();
            overlayCtx.stroke();
            
            // Store selection data for other tools
            canvas.dataset.hasSelection = 'true';
            canvas.dataset.selectionPath = JSON.stringify(pathData);
          }
        }
        
        console.log('Lasso select: completed with', pathData.length, 'points');
      }
      
      canvas.dataset.selecting = 'false';
    },
  },
  
  // Transformation tools
  'crop': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      // Start crop selection
      console.log('Crop tool: starting crop area', event);
    },
  },
  
  // Color tools
  'eyedropper': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Sample pixel color
      const imageData = ctx.getImageData(x, y, 1, 1);
      const pixel = imageData.data;
      const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      
      // Show sampled color with visual feedback
      const canvasRect = canvas.getBoundingClientRect();
      const indicator = document.createElement('div');
      indicator.style.position = 'absolute';
      indicator.style.left = `${x + canvasRect.left}px`;
      indicator.style.top = `${y + canvasRect.top}px`;
      indicator.style.width = '30px';
      indicator.style.height = '30px';
      indicator.style.backgroundColor = rgb;
      indicator.style.border = '3px solid white';
      indicator.style.borderRadius = '50%';
      indicator.style.pointerEvents = 'none';
      indicator.style.zIndex = '1000';
      indicator.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      document.body.appendChild(indicator);
      
      // Also update cursor to show sampled color
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="${rgb}" stroke="white" stroke-width="2"/></svg>'), crosshair`;
      
      setTimeout(() => {
        if (document.body.contains(indicator)) document.body.removeChild(indicator);
        canvas.style.cursor = 'crosshair';
      }, 2000);
      
      console.log('Eyedropper: sampled color', { x, y, color: rgb });
    },
  },
  
  'color-sampler': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'ruler': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  // Retouching tools
  'spot-healing': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Simple healing by sampling nearby area and blending
      const radius = 20;
      const sourceX = x + radius + 10; // Sample from nearby area
      const sourceY = y;
      
      try {
        const sourceData = ctx.getImageData(sourceX, sourceY, radius * 2, radius * 2);
        ctx.globalAlpha = 0.7;
        ctx.putImageData(sourceData, x - radius, y - radius);
        ctx.globalAlpha = 1.0;
      } catch (e) {
        // If can't sample, just blur the area
        const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i + 3] *= 0.8; // Reduce alpha for healing effect
        }
        ctx.putImageData(imageData, x - radius, y - radius);
      }
      
      console.log('Spot healing: applied healing at', { x, y });
    },
  },
  
  'healing-brush': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'patch': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'red-eye': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  // Painting tools
  'brush': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas, toolOptions) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get tool options with defaults
      const size = toolOptions?.brushSize || 20;
      const opacity = toolOptions?.opacity || 100;
      const hardness = toolOptions?.hardness || 100;
      const blendMode = toolOptions?.blendMode || 'normal';
      
      // Get foreground color from color picker
      const colorPicker = document.querySelector('.foreground-color') as HTMLElement;
      const color = colorPicker?.style.backgroundColor || '#000000';
      
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.globalCompositeOperation = blendMode === 'normal' ? 'source-over' : blendMode;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      
      // Apply hardness by creating gradient if needed
      if (hardness < 100) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
        const alpha = hardness / 100;
        gradient.addColorStop(0, color);
        gradient.addColorStop(alpha, color);
        gradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = gradient;
      }
      
      canvas.dataset.drawing = 'true';
      canvas.dataset.lastX = x.toString();
      canvas.dataset.lastY = y.toString();
      
      // Draw initial dot
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      console.log('Brush: starting stroke at', { x, y, size, opacity, hardness });
    },
    onMouseMove: (event, canvas, toolOptions) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const lastX = parseFloat(canvas.dataset.lastX || '0');
      const lastY = parseFloat(canvas.dataset.lastY || '0');
      
      // Get tool options
      const size = toolOptions?.brushSize || 20;
      const opacity = toolOptions?.opacity || 100;
      const flow = toolOptions?.flow || 100;
      
      ctx.save();
      ctx.globalAlpha = (opacity * flow) / 10000; // Combine opacity and flow
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Update last position
      canvas.dataset.lastX = x.toString();
      canvas.dataset.lastY = y.toString();
      
      ctx.restore();
    },
    onMouseUp: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.restore(); // Restore context state
      }
      canvas.dataset.drawing = 'false';
      console.log('Brush: ending stroke');
    },
  },
  
  'pencil': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas, toolOptions) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get tool options with defaults
      const size = Math.max(1, (toolOptions?.brushSize || 20) / 10); // Pencil is thinner
      const opacity = toolOptions?.opacity || 100;
      
      // Get foreground color from color picker
      const colorPicker = document.querySelector('.foreground-color') as HTMLElement;
      const color = colorPicker?.style.backgroundColor || '#000000';
      
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = size;
      ctx.lineCap = 'square'; // Sharp pencil edge
      ctx.strokeStyle = color;
      
      canvas.dataset.drawing = 'true';
      canvas.dataset.lastX = x.toString();
      canvas.dataset.lastY = y.toString();
      
      console.log('Pencil: starting stroke at', { x, y, size, opacity });
    },
    onMouseMove: (event, canvas, toolOptions) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const lastX = parseFloat(canvas.dataset.lastX || '0');
      const lastY = parseFloat(canvas.dataset.lastY || '0');
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Update last position
      canvas.dataset.lastX = x.toString();
      canvas.dataset.lastY = y.toString();
    },
    onMouseUp: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.restore();
      }
      canvas.dataset.drawing = 'false';
      console.log('Pencil: ending stroke');
    },
  },
  
  'color-replacement': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'clone': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
      // Clear clone source indicator
      const indicator = document.querySelector('.clone-source-indicator');
      if (indicator) indicator.remove();
    },
    onMouseDown: (event, canvas, toolOptions) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get tool options
      const size = toolOptions?.brushSize || 50;
      const opacity = toolOptions?.opacity || 100;
      
      if (event.altKey) {
        // Alt+click to set clone source
        canvas.dataset.cloneSourceX = x.toString();
        canvas.dataset.cloneSourceY = y.toString();
        
        // Show visual indicator for clone source
        const indicator = document.createElement('div');
        indicator.className = 'clone-source-indicator';
        indicator.style.position = 'absolute';
        indicator.style.left = `${rect.left + x - 10}px`;
        indicator.style.top = `${rect.top + y - 10}px`;
        indicator.style.width = '20px';
        indicator.style.height = '20px';
        indicator.style.border = '2px solid #00ff00';
        indicator.style.borderRadius = '50%';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '1000';
        document.body.appendChild(indicator);
        
        console.log('Clone: source set at', { x, y });
        return;
      }
      
      // Regular clone operation
      const sourceX = parseFloat(canvas.dataset.cloneSourceX || '0');
      const sourceY = parseFloat(canvas.dataset.cloneSourceY || '0');
      
      if (!canvas.dataset.cloneSourceX) {
        console.log('Clone: no source set - use Alt+click to set source');
        return;
      }
      
      try {
        // Sample from source location
        const sourceData = ctx.getImageData(
          Math.max(0, sourceX - size/2), 
          Math.max(0, sourceY - size/2),
          Math.min(size, canvas.width - Math.max(0, sourceX - size/2)),
          Math.min(size, canvas.height - Math.max(0, sourceY - size/2))
        );
        
        // Apply to destination with opacity
        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.putImageData(
          sourceData, 
          x - size/2, 
          y - size/2
        );
        ctx.restore();
        
        console.log('Clone: applied from', { sourceX, sourceY }, 'to', { x, y });
      } catch (e) {
        console.error('Clone error:', e);
      }
    },
  },
  
  'eraser': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas, toolOptions) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get tool options with defaults
      const size = toolOptions?.brushSize || 30;
      const opacity = toolOptions?.opacity || 100;
      
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = opacity / 100;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      
      canvas.dataset.drawing = 'true';
      canvas.dataset.lastX = x.toString();
      canvas.dataset.lastY = y.toString();
      
      // Draw initial erase dot
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      console.log('Eraser: starting erase at', { x, y, size, opacity });
    },
    onMouseMove: (event, canvas, toolOptions) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const lastX = parseFloat(canvas.dataset.lastX || '0');
      const lastY = parseFloat(canvas.dataset.lastY || '0');
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Update last position
      canvas.dataset.lastX = x.toString();
      canvas.dataset.lastY = y.toString();
    },
    onMouseUp: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.restore(); // This will reset globalCompositeOperation
      }
      canvas.dataset.drawing = 'false';
      console.log('Eraser: ending erase');
    },
  },
  
  'paint-bucket': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(event.clientX - rect.left);
      const y = Math.floor(event.clientY - rect.top);
      
      // Check if there's a magic wand selection or rectangle selection
      const selectionOverlay = canvas.parentElement?.querySelector('.selection-overlay') as HTMLCanvasElement;
      const magicWandData = canvas.dataset.magicWandSelection;
      const rectangleBounds = canvas.dataset.selectionBounds;
      
      // Get foreground color from color picker
      const colorPicker = document.querySelector('.foreground-color') as HTMLElement;
      const fillColor = colorPicker?.style.backgroundColor || '#000000';
      
      if (magicWandData) {
        // Fill magic wand selection
        const selected = JSON.parse(magicWandData);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Parse hex color to RGB
        let r = 0, g = 0, b = 0;
        if (fillColor.startsWith('#')) {
          const hex = fillColor.slice(1);
          r = parseInt(hex.substr(0, 2), 16);
          g = parseInt(hex.substr(2, 2), 16);
          b = parseInt(hex.substr(4, 2), 16);
        }
        
        // Fill only the selected pixels
        for (let i = 0; i < selected.length; i++) {
          if (selected[i] === 1) {
            const dataIndex = i * 4;
            data[dataIndex] = r;     // R
            data[dataIndex + 1] = g; // G
            data[dataIndex + 2] = b; // B
            data[dataIndex + 3] = 255; // A
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Paint bucket: filled magic wand selection');
      } else if (selectionOverlay && rectangleBounds) {
        // Fill within rectangle selection bounds
        const bounds = JSON.parse(rectangleBounds);
        ctx.save();
        
        // Create clipping region for selection
        ctx.beginPath();
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.clip();
        
        // Fill the clipped area
        ctx.fillStyle = fillColor;
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        ctx.restore();
        console.log('Paint bucket: filled rectangle selection area', bounds);
      } else {
        // No selection - do flood fill from clicked point
        const colorPicker = document.querySelector('.foreground-color') as HTMLElement;
        const colorString = colorPicker?.style.backgroundColor || '#000000';
        
        // Convert color string to RGB values
        let fillColor = { r: 0, g: 0, b: 0, a: 255 };
        if (colorString.startsWith('#')) {
          const hex = colorString.slice(1);
          fillColor.r = parseInt(hex.substr(0, 2), 16);
          fillColor.g = parseInt(hex.substr(2, 2), 16);
          fillColor.b = parseInt(hex.substr(4, 2), 16);
        }
        
        floodFill(ctx, x, y, fillColor, canvas.width, canvas.height);
        console.log('Paint bucket: flood filled from', { x, y });
      }
    },
  },
  
  'gradient': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.dataset.gradientStartX = x.toString();
      canvas.dataset.gradientStartY = y.toString();
      canvas.dataset.drawing = 'true';
      
      console.log('Gradient: starting gradient at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.drawing !== 'true') return;
      // Show gradient preview while dragging
    },
    onMouseUp: (event, canvas) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const endX = event.clientX - rect.left;
      const endY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.gradientStartX || '0');
      const startY = parseInt(canvas.dataset.gradientStartY || '0');
      
      // Create linear gradient
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#ffffff');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      canvas.dataset.drawing = 'false';
      console.log('Gradient: applied gradient');
    },
  },
  
  // Filter tools
  'blur': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas, toolOptions) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get tool options
      const brushSize = toolOptions?.brushSize || 50;
      const intensity = (toolOptions?.opacity || 50) / 100;
      
      const radius = Math.max(brushSize, 20);
      
      try {
        // Get the image data for the area to blur
        const imageData = ctx.getImageData(
          Math.max(0, x - radius), 
          Math.max(0, y - radius), 
          Math.min(radius * 2, canvas.width - Math.max(0, x - radius)), 
          Math.min(radius * 2, canvas.height - Math.max(0, y - radius))
        );
        
        // Apply gaussian blur
        const blurRadius = Math.max(1, Math.floor(brushSize / 10));
        const blurredData = gaussianBlur(imageData, blurRadius);
        
        // Blend the blurred result back
        const originalData = ctx.getImageData(
          Math.max(0, x - radius), 
          Math.max(0, y - radius), 
          Math.min(radius * 2, canvas.width - Math.max(0, x - radius)), 
          Math.min(radius * 2, canvas.height - Math.max(0, y - radius))
        );
        
        // Blend original and blurred based on intensity
        for (let i = 0; i < blurredData.data.length; i += 4) {
          blurredData.data[i] = originalData.data[i] * (1 - intensity) + blurredData.data[i] * intensity;
          blurredData.data[i + 1] = originalData.data[i + 1] * (1 - intensity) + blurredData.data[i + 1] * intensity;
          blurredData.data[i + 2] = originalData.data[i + 2] * (1 - intensity) + blurredData.data[i + 2] * intensity;
        }
        
        ctx.putImageData(blurredData, Math.max(0, x - radius), Math.max(0, y - radius));
      } catch (e) {
        console.error('Blur error:', e);
        // Fallback: simple blur effect
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.globalAlpha = intensity;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
      }
      
      console.log('Blur: applied blur at', { x, y, brushSize, intensity });
    },
  },
  
  'sharpen': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas, toolOptions) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get tool options
      const brushSize = toolOptions?.brushSize || 50;
      const intensity = (toolOptions?.opacity || 50) / 100;
      
      const radius = Math.max(brushSize, 20);
      
      try {
        // Get the image data for the area to sharpen
        const imageData = ctx.getImageData(
          Math.max(0, x - radius), 
          Math.max(0, y - radius), 
          Math.min(radius * 2, canvas.width - Math.max(0, x - radius)), 
          Math.min(radius * 2, canvas.height - Math.max(0, y - radius))
        );
        
        // Apply sharpen filter
        const sharpenAmount = intensity * 2; // Scale intensity for sharpen
        const sharpenedData = sharpen(imageData, sharpenAmount);
        
        // Blend the sharpened result back with original
        const originalData = ctx.getImageData(
          Math.max(0, x - radius), 
          Math.max(0, y - radius), 
          Math.min(radius * 2, canvas.width - Math.max(0, x - radius)), 
          Math.min(radius * 2, canvas.height - Math.max(0, y - radius))
        );
        
        // Blend original and sharpened based on intensity
        for (let i = 0; i < sharpenedData.data.length; i += 4) {
          sharpenedData.data[i] = originalData.data[i] * (1 - intensity) + sharpenedData.data[i] * intensity;
          sharpenedData.data[i + 1] = originalData.data[i + 1] * (1 - intensity) + sharpenedData.data[i + 1] * intensity;
          sharpenedData.data[i + 2] = originalData.data[i + 2] * (1 - intensity) + sharpenedData.data[i + 2] * intensity;
        }
        
        ctx.putImageData(sharpenedData, Math.max(0, x - radius), Math.max(0, y - radius));
      } catch (e) {
        console.error('Sharpen error:', e);
        // Fallback: contrast enhancement
        ctx.globalAlpha = intensity * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      
      console.log('Sharpen: applied sharpen at', { x, y, brushSize, intensity });
    },
  },
  
  'smudge': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.dataset.smudgeStartX = x.toString();
      canvas.dataset.smudgeStartY = y.toString();
      canvas.dataset.drawing = 'true';
      
      console.log('Smudge: starting smudge at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.smudgeStartX || '0');
      const startY = parseInt(canvas.dataset.smudgeStartY || '0');
      
      // Smudge effect: copy pixels from start position to current position
      const radius = 15;
      try {
        const sourceData = ctx.getImageData(startX - radius, startY - radius, radius * 2, radius * 2);
        ctx.globalAlpha = 0.3;
        ctx.putImageData(sourceData, currentX - radius, currentY - radius);
        ctx.globalAlpha = 1.0;
        
        // Update start position for continuous smudging
        canvas.dataset.smudgeStartX = currentX.toString();
        canvas.dataset.smudgeStartY = currentY.toString();
      } catch (e) {
        // Fallback smudge effect
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    },
    onMouseUp: (event, canvas) => {
      canvas.dataset.drawing = 'false';
      console.log('Smudge: smudge completed');
    },
  },
  
  'dodge': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Dodge effect: lighten the area
      const radius = 25;
      try {
        const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        
        // Lighten pixels (dodge effect)
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.3); // R
          data[i + 1] = Math.min(255, data[i + 1] * 1.3); // G
          data[i + 2] = Math.min(255, data[i + 2] * 1.3); // B
        }
        
        ctx.putImageData(imageData, x - radius, y - radius);
      } catch (e) {
        // Fallback: add white overlay
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      
      console.log('Dodge: lightened area at', { x, y });
    },
  },
  
  'burn': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Burn effect: darken the area
      const radius = 25;
      try {
        const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        
        // Darken pixels (burn effect)
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.7); // R
          data[i + 1] = Math.max(0, data[i + 1] * 0.7); // G
          data[i + 2] = Math.max(0, data[i + 2] * 0.7); // B
        }
        
        ctx.putImageData(imageData, x - radius, y - radius);
      } catch (e) {
        // Fallback: add dark overlay
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      
      console.log('Burn: darkened area at', { x, y });
    },
  },
  
  'sponge': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Sponge effect: desaturate colors (remove saturation)
      const radius = 25;
      try {
        const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        
        // Convert to grayscale (desaturate)
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          data[i] = (data[i] + gray) / 2; // R
          data[i + 1] = (data[i + 1] + gray) / 2; // G
          data[i + 2] = (data[i + 2] + gray) / 2; // B
        }
        
        ctx.putImageData(imageData, x - radius, y - radius);
      } catch (e) {
        // Fallback: add gray overlay
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      
      console.log('Sponge: desaturated area at', { x, y });
    },
  },
  
  // Type tools
  'type': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'text';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Create a text input overlay for editing
      let textInput = document.getElementById('text-input-overlay') as HTMLInputElement;
      if (!textInput) {
        textInput = document.createElement('input');
        textInput.id = 'text-input-overlay';
        textInput.type = 'text';
        textInput.style.position = 'absolute';
        textInput.style.fontSize = '24px';
        textInput.style.fontFamily = 'Arial';
        textInput.style.border = '2px solid #007ACC';
        textInput.style.background = 'white';
        textInput.style.zIndex = '1000';
        textInput.placeholder = 'Enter text...';
        document.body.appendChild(textInput);
      }
      
      // Position the input at click location
      const canvasRect = canvas.getBoundingClientRect();
      textInput.style.left = `${x + canvasRect.left}px`;
      textInput.style.top = `${y + canvasRect.top - 30}px`;
      textInput.style.display = 'block';
      textInput.value = '';
      textInput.focus();
      
      // Handle text input completion
      const completeText = () => {
        const inputText = textInput.value || 'Sample Text';
        
        ctx.font = '24px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(inputText, x, y);
        
        textInput.style.display = 'none';
        console.log('Type: placed text', { x, y, text: inputText });
      };
      
      textInput.onblur = completeText;
      textInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          completeText();
        } else if (e.key === 'Escape') {
          textInput.style.display = 'none';
        }
      };
      
      console.log('Type: text input ready', { x, y });
    },
  },
  
  'vertical-type': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'text';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  // Path tools
  'pen': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      // Add path point
      console.log('Pen: adding path point', event);
    },
  },
  
  'free-pen': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'add-anchor': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'delete-anchor': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'convert-anchor': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'path-select': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'direct-select': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  // Shape tools
  'rectangle': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.dataset.shapeStartX = x.toString();
      canvas.dataset.shapeStartY = y.toString();
      canvas.dataset.drawing = 'true';
      
      console.log('Rectangle: starting shape at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.shapeStartX || '0');
      const startY = parseInt(canvas.dataset.shapeStartY || '0');
      
      // Don't clear - this was destroying content! Just draw preview over existing content
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#007ACC';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        Math.min(startX, currentX),
        Math.min(startY, currentY),
        Math.abs(currentX - startX),
        Math.abs(currentY - startY)
      );
      ctx.restore();
    },
    onMouseUp: (event, canvas) => {
      if (canvas.dataset.drawing !== 'true') return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.shapeStartX || '0');
      const startY = parseInt(canvas.dataset.shapeStartY || '0');
      
      // Just draw the final rectangle outline without clearing everything
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(
        Math.min(startX, currentX),
        Math.min(startY, currentY),
        Math.abs(currentX - startX),
        Math.abs(currentY - startY)
      );
      
      canvas.dataset.drawing = 'false';
      console.log('Rectangle: shape completed');
    },
  },
  
  'ellipse': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'line': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'parametric-shape': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'custom-shape': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'crosshair';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  // Navigation tools
  'hand': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'grab';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      canvas.style.cursor = 'grabbing';
      canvas.dataset.panStartX = x.toString();
      canvas.dataset.panStartY = y.toString();
      canvas.dataset.panning = 'true';
      
      console.log('Hand tool: starting pan at', { x, y });
    },
    onMouseMove: (event, canvas) => {
      if (canvas.dataset.panning !== 'true') return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      const startX = parseInt(canvas.dataset.panStartX || '0');
      const startY = parseInt(canvas.dataset.panStartY || '0');
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      // Pan the viewport (this would normally update the document pan state)
      console.log('Hand tool: panning', { deltaX, deltaY });
    },
    onMouseUp: (event, canvas) => {
      canvas.style.cursor = 'grab';
      canvas.dataset.panning = 'false';
      console.log('Hand tool: pan completed');
    },
  },
  
  'rotate-view': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'grab';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
  },
  
  'zoom': {
    onActivate: (canvas) => {
      canvas.style.cursor = 'zoom-in';
    },
    onDeactivate: (canvas) => {
      canvas.style.cursor = 'default';
    },
    onMouseDown: (event, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Simple zoom effect by scaling canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const currentTransform = ctx.getTransform();
      const newScale = event.shiftKey ? 0.8 : 1.25; // Shift+click to zoom out
      
      ctx.setTransform(
        currentTransform.a * newScale,
        currentTransform.b,
        currentTransform.c,
        currentTransform.d * newScale,
        currentTransform.e,
        currentTransform.f
      );
      
      // Visual feedback
      canvas.style.transform = `scale(${newScale})`;
      setTimeout(() => {
        canvas.style.transform = 'scale(1)';
      }, 200);
      
      console.log('Zoom: zoomed', { x, y, scale: newScale });
    },
  },
};