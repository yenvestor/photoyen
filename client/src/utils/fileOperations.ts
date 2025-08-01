import { useEditorStore } from '@/store/editorStore';

export interface FileImportOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface FileExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'gif';
  quality?: number; // 0-1 for jpeg/webp
  backgroundColor?: string; // For formats that don't support transparency
}

/**
 * Import an image file and create a new document or add to existing document
 */
export async function importImageFile(
  file: File, 
  options: FileImportOptions = {}
): Promise<{ success: boolean; message: string; documentId?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const { maxWidth = 4000, maxHeight = 4000 } = options;
          
          // Calculate dimensions
          let { width, height } = img;
          
          // Resize if too large
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Create a canvas to process the image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve({ success: false, message: 'Failed to create canvas context' });
            return;
          }
          
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Create document using store
          const store = useEditorStore.getState();
          const documentName = file.name.replace(/\.[^/.]+$/, '') || 'Imported Image';
          store.createDocument(documentName, width, height);
          
          // Get the active document and canvas
          const activeDoc = store.documents.find(doc => doc.id === store.activeDocumentId);
          if (activeDoc) {
            // Find the editor canvas and copy our processed image to it
            setTimeout(() => {
              const editorCanvas = document.querySelector('canvas') as HTMLCanvasElement;
              if (editorCanvas && editorCanvas.getContext('2d')) {
                const editorCtx = editorCanvas.getContext('2d')!;
                editorCanvas.width = width;
                editorCanvas.height = height;
                editorCtx.drawImage(canvas, 0, 0);
              }
            }, 100);
            
            resolve({ 
              success: true, 
              message: `Imported ${file.name} (${width}×${height})`,
              documentId: activeDoc.id 
            });
          } else {
            resolve({ success: false, message: 'Failed to create document' });
          }
        } catch (error) {
          resolve({ success: false, message: `Error processing image: ${error}` });
        }
      };
      
      img.onerror = () => {
        resolve({ success: false, message: 'Failed to load image file' });
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read file' });
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Export the current canvas as an image file
 */
export function exportCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string,
  options: FileExportOptions
): void {
  try {
    const { format, quality = 0.9, backgroundColor = '#ffffff' } = options;
    
    let exportCanvas = canvas;
    let ctx = canvas.getContext('2d');
    
    // For formats that don't support transparency, add background
    if ((format === 'jpeg' || format === 'gif') && backgroundColor) {
      exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      ctx = exportCanvas.getContext('2d');
      
      if (ctx) {
        // Fill background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        
        // Draw original canvas on top
        ctx.drawImage(canvas, 0, 0);
      }
    }
    
    // Determine MIME type
    let mimeType: string;
    switch (format) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      default:
        mimeType = 'image/png';
    }
    
    // Convert to blob and download
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, mimeType, quality);
    
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export image');
  }
}

/**
 * Open file picker for image import
 */
export function openImageFilePicker(
  options: FileImportOptions = {},
  multiple: boolean = false
): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      resolve(files);
    };
    
    input.oncancel = () => {
      resolve([]);
    };
    
    input.click();
  });
}

/**
 * Save current document as PSD-like format (JSON for now)
 */
export function saveDocumentAsProject(documentId: string): void {
  const store = useEditorStore.getState();
  const document = store.documents.find(doc => doc.id === documentId);
  
  if (!document) {
    alert('No document to save');
    return;
  }
  
  try {
    // Create project data
    const projectData = {
      version: '1.0',
      document: {
        ...document,
        // Add canvas data
        canvasData: getCanvasDataURL(),
      },
      history: store.history,
      metadata: {
        created: Date.now(),
        application: 'PhotoEditor',
        version: '1.0'
      }
    };
    
    // Convert to JSON and download
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name}.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save document');
  }
}

/**
 * Load a project file
 */
export async function loadProjectFile(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const projectData = JSON.parse(event.target?.result as string);
        
        if (!projectData.document) {
          resolve({ success: false, message: 'Invalid project file' });
          return;
        }
        
        const store = useEditorStore.getState();
        
        // Create new document from project data
        const doc = projectData.document;
        store.createDocument(doc.name, doc.width, doc.height);
        
        // Restore layers and other properties
        if (store.activeDocumentId) {
          store.updateDocument(store.activeDocumentId, {
            layers: doc.layers,
            zoom: doc.zoom,
            pan: doc.pan
          });
          
          // Restore canvas if available
          if (projectData.document.canvasData) {
            setTimeout(() => {
              restoreCanvasFromDataURL(projectData.document.canvasData);
            }, 100);
          }
        }
        
        resolve({ success: true, message: `Loaded project: ${doc.name}` });
        
      } catch (error) {
        resolve({ success: false, message: 'Failed to parse project file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read project file' });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Get current canvas as data URL
 */
function getCanvasDataURL(): string {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  return canvas ? canvas.toDataURL() : '';
}

/**
 * Restore canvas from data URL
 */
function restoreCanvasFromDataURL(dataURL: string): void {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataURL;
}

/**
 * Quick export functions for common formats
 */
export const quickExport = {
  png: (canvas: HTMLCanvasElement, filename: string) => {
    exportCanvasAsImage(canvas, `${filename}.png`, { format: 'png' });
  },
  
  jpeg: (canvas: HTMLCanvasElement, filename: string, quality: number = 0.9) => {
    exportCanvasAsImage(canvas, `${filename}.jpg`, { 
      format: 'jpeg', 
      quality,
      backgroundColor: '#ffffff'
    });
  },
  
  webp: (canvas: HTMLCanvasElement, filename: string, quality: number = 0.9) => {
    exportCanvasAsImage(canvas, `${filename}.webp`, { format: 'webp', quality });
  }
};
