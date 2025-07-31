/**
 * Clipboard utilities for copy, cut, paste operations
 */

export interface ClipboardData {
  imageData: ImageData;
  width: number;
  height: number;
  timestamp: number;
}

export class CanvasClipboard {
  private static clipboardData: ClipboardData | null = null;

  /**
   * Copy selection or entire canvas to clipboard
   */
  static copy(
    canvas: HTMLCanvasElement,
    selectionBounds?: { x: number; y: number; width: number; height: number }
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let imageData: ImageData;
    let width: number;
    let height: number;

    if (selectionBounds) {
      // Copy selection
      imageData = ctx.getImageData(
        selectionBounds.x,
        selectionBounds.y,
        selectionBounds.width,
        selectionBounds.height
      );
      width = selectionBounds.width;
      height = selectionBounds.height;
    } else {
      // Copy entire canvas
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      width = canvas.width;
      height = canvas.height;
    }

    this.clipboardData = {
      imageData: this.cloneImageData(imageData),
      width,
      height,
      timestamp: Date.now()
    };

    // Also try to copy to system clipboard
    this.copyToSystemClipboard(canvas, selectionBounds);
  }

  /**
   * Cut selection (copy + clear)
   */
  static cut(
    canvas: HTMLCanvasElement,
    selectionBounds?: { x: number; y: number; width: number; height: number }
  ): void {
    this.copy(canvas, selectionBounds);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectionBounds) {
      // Clear selection area
      ctx.clearRect(
        selectionBounds.x,
        selectionBounds.y,
        selectionBounds.width,
        selectionBounds.height
      );
    } else {
      // Clear entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Paste clipboard data to canvas
   */
  static paste(
    canvas: HTMLCanvasElement,
    x?: number,
    y?: number
  ): boolean {
    if (!this.clipboardData) {
      // Try to paste from system clipboard
      return this.pasteFromSystemClipboard(canvas, x, y);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const pasteX = x ?? 0;
    const pasteY = y ?? 0;

    // Create temporary canvas for the clipboard data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.clipboardData.width;
    tempCanvas.height = this.clipboardData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return false;

    tempCtx.putImageData(this.clipboardData.imageData, 0, 0);

    // Draw to main canvas
    ctx.drawImage(tempCanvas, pasteX, pasteY);

    return true;
  }

  /**
   * Paste and center on canvas
   */
  static pasteCenter(canvas: HTMLCanvasElement): boolean {
    if (!this.clipboardData) return false;

    const centerX = (canvas.width - this.clipboardData.width) / 2;
    const centerY = (canvas.height - this.clipboardData.height) / 2;

    return this.paste(canvas, centerX, centerY);
  }

  /**
   * Check if clipboard has data
   */
  static hasData(): boolean {
    return this.clipboardData !== null;
  }

  /**
   * Clear clipboard
   */
  static clear(): void {
    this.clipboardData = null;
  }

  /**
   * Get clipboard data info
   */
  static getDataInfo(): { width: number; height: number; timestamp: number } | null {
    if (!this.clipboardData) return null;
    
    return {
      width: this.clipboardData.width,
      height: this.clipboardData.height,
      timestamp: this.clipboardData.timestamp
    };
  }

  /**
   * Clone ImageData object
   */
  private static cloneImageData(imageData: ImageData): ImageData {
    const clonedData = new Uint8ClampedArray(imageData.data);
    return new ImageData(clonedData, imageData.width, imageData.height);
  }

  /**
   * Copy to system clipboard as image
   */
  private static async copyToSystemClipboard(
    canvas: HTMLCanvasElement,
    selectionBounds?: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) return;

      let sourceCanvas = canvas;

      // If we have a selection, create a temporary canvas with just the selection
      if (selectionBounds) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = selectionBounds.width;
        tempCanvas.height = selectionBounds.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        const imageData = canvas.getContext('2d')?.getImageData(
          selectionBounds.x,
          selectionBounds.y,
          selectionBounds.width,
          selectionBounds.height
        );
        if (imageData) {
          tempCtx.putImageData(imageData, 0, 0);
          sourceCanvas = tempCanvas;
        }
      }

      // Convert canvas to blob
      sourceCanvas.toBlob(async (blob) => {
        if (!blob) return;

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        } catch (error) {
          console.warn('Failed to write to system clipboard:', error);
        }
      }, 'image/png');
    } catch (error) {
      console.warn('System clipboard not supported:', error);
    }
  }

  /**
   * Paste from system clipboard
   */
  private static async pasteFromSystemClipboard(
    canvas: HTMLCanvasElement,
    x?: number,
    y?: number
  ): Promise<boolean> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return false;

      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (!imageType) continue;

          const blob = await item.getType(imageType);
          const img = new Image();
          
          return new Promise((resolve) => {
            img.onload = () => {
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(false);
                return;
              }

              const pasteX = x ?? 0;
              const pasteY = y ?? 0;
              ctx.drawImage(img, pasteX, pasteY);
              resolve(true);
            };
            
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(blob);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to read from system clipboard:', error);
    }

    return false;
  }

  /**
   * Duplicate selection or layer
   */
  static duplicate(
    canvas: HTMLCanvasElement,
    selectionBounds?: { x: number; y: number; width: number; height: number },
    offsetX: number = 10,
    offsetY: number = 10
  ): void {
    this.copy(canvas, selectionBounds);
    
    if (selectionBounds) {
      this.paste(canvas, selectionBounds.x + offsetX, selectionBounds.y + offsetY);
    } else {
      this.paste(canvas, offsetX, offsetY);
    }
  }

  /**
   * Fill selection with color
   */
  static fill(
    canvas: HTMLCanvasElement,
    color: string,
    selectionBounds?: { x: number; y: number; width: number; height: number }
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = color;

    if (selectionBounds) {
      ctx.fillRect(
        selectionBounds.x,
        selectionBounds.y,
        selectionBounds.width,
        selectionBounds.height
      );
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Stroke selection outline
   */
  static stroke(
    canvas: HTMLCanvasElement,
    color: string,
    width: number = 1,
    selectionBounds?: { x: number; y: number; width: number; height: number }
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    if (selectionBounds) {
      ctx.strokeRect(
        selectionBounds.x,
        selectionBounds.y,
        selectionBounds.width,
        selectionBounds.height
      );
    } else {
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Clear selection or entire canvas
   */
  static clear(
    canvas: HTMLCanvasElement,
    selectionBounds?: { x: number; y: number; width: number; height: number }
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectionBounds) {
      ctx.clearRect(
        selectionBounds.x,
        selectionBounds.y,
        selectionBounds.width,
        selectionBounds.height
      );
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Select all (return bounds of entire canvas)
   */
  static selectAll(canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } {
    return {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    };
  }

  /**
   * Deselect (clear selection)
   */
  static deselect(): void {
    // This would typically update the selection state in the editor store
    // For now, just a placeholder that can be called from menu actions
  }
}