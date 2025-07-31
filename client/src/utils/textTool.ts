/**
 * Advanced text tool with font support and formatting
 */

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  textDecoration: 'none' | 'underline' | 'line-through';
  textShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Common web-safe and Google Fonts
 */
export const AVAILABLE_FONTS = [
  // Web-safe fonts
  'Arial',
  'Arial Black',
  'Helvetica',
  'Times New Roman',
  'Times',
  'Courier New',
  'Courier',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Bookman',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Narrow',
  'Brush Script MT',
  'Impact',
  
  // Google Fonts (commonly available)
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Raleway',
  'PT Sans',
  'Lora',
  'Merriweather',
  'Playfair Display',
  'Oswald',
  'Ubuntu',
  'Nunito',
  'Poppins',
  'Fira Sans',
  'Inter',
  'Work Sans',
  'Crimson Text',
  'Libre Baskerville',
  'PT Serif'
];

/**
 * Default text style
 */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  textAlign: 'left',
  verticalAlign: 'top',
  lineHeight: 1.2,
  letterSpacing: 0,
  textDecoration: 'none'
};

/**
 * Text tool class for managing text input and rendering
 */
export class TextTool {
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement | null = null;
  private textInput: HTMLTextAreaElement | null = null;
  private currentStyle: TextStyle = { ...DEFAULT_TEXT_STYLE };
  private currentBounds: TextBounds | null = null;
  private isEditing = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Start text editing at specified position
   */
  startEditing(x: number, y: number, style: Partial<TextStyle> = {}): void {
    this.currentStyle = { ...DEFAULT_TEXT_STYLE, ...style };
    this.currentBounds = { x, y, width: 200, height: 100 };
    this.createTextInput();
    this.isEditing = true;
  }

  /**
   * Update text style
   */
  updateStyle(style: Partial<TextStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
    if (this.textInput) {
      this.applyStyleToInput();
    }
  }

  /**
   * Finish editing and render text to canvas
   */
  finishEditing(): void {
    if (!this.textInput || !this.currentBounds) return;

    const text = this.textInput.value;
    if (text.trim()) {
      this.renderTextToCanvas(text, this.currentBounds, this.currentStyle);
    }

    this.cleanup();
    this.isEditing = false;
  }

  /**
   * Cancel editing without saving
   */
  cancelEditing(): void {
    this.cleanup();
    this.isEditing = false;
  }

  /**
   * Create text input overlay
   */
  private createTextInput(): void {
    if (!this.currentBounds) return;

    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.left = this.currentBounds.x + 'px';
    this.overlay.style.top = this.currentBounds.y + 'px';
    this.overlay.style.width = this.currentBounds.width + 'px';
    this.overlay.style.height = this.currentBounds.height + 'px';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.zIndex = '1000';

    // Create text input
    this.textInput = document.createElement('textarea');
    this.textInput.style.position = 'absolute';
    this.textInput.style.left = '0';
    this.textInput.style.top = '0';
    this.textInput.style.width = '100%';
    this.textInput.style.height = '100%';
    this.textInput.style.border = '2px dashed #007bff';
    this.textInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    this.textInput.style.resize = 'both';
    this.textInput.style.outline = 'none';
    this.textInput.style.pointerEvents = 'auto';
    this.textInput.placeholder = 'Enter text...';

    this.applyStyleToInput();

    // Add event listeners
    this.textInput.addEventListener('blur', () => {
      setTimeout(() => this.finishEditing(), 100);
    });

    this.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cancelEditing();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.finishEditing();
      }
    });

    // Observe resize
    const resizeObserver = new ResizeObserver(() => {
      if (this.textInput && this.currentBounds) {
        this.currentBounds.width = this.textInput.offsetWidth;
        this.currentBounds.height = this.textInput.offsetHeight;
      }
    });
    resizeObserver.observe(this.textInput);

    this.overlay.appendChild(this.textInput);
    
    // Find canvas container and append overlay
    const canvasContainer = this.canvas.parentElement;
    if (canvasContainer) {
      canvasContainer.style.position = 'relative';
      canvasContainer.appendChild(this.overlay);
    }

    // Focus and select all text
    this.textInput.focus();
    this.textInput.select();
  }

  /**
   * Apply current style to text input
   */
  private applyStyleToInput(): void {
    if (!this.textInput) return;

    const style = this.currentStyle;
    this.textInput.style.fontFamily = style.fontFamily;
    this.textInput.style.fontSize = style.fontSize + 'px';
    this.textInput.style.fontWeight = style.fontWeight;
    this.textInput.style.fontStyle = style.fontStyle;
    this.textInput.style.color = style.color;
    this.textInput.style.textAlign = style.textAlign;
    this.textInput.style.lineHeight = style.lineHeight.toString();
    this.textInput.style.letterSpacing = style.letterSpacing + 'px';
    this.textInput.style.textDecoration = style.textDecoration;

    if (style.textShadow) {
      const shadow = style.textShadow;
      this.textInput.style.textShadow = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
    }
  }

  /**
   * Render text to canvas
   */
  private renderTextToCanvas(text: string, bounds: TextBounds, style: TextStyle): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Set font
    const fontString = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.font = fontString;
    ctx.textBaseline = 'top';

    // Split text into lines
    const lines = this.wrapText(ctx, text, bounds.width);

    // Calculate vertical positioning
    const lineHeight = style.fontSize * style.lineHeight;
    const totalTextHeight = lines.length * lineHeight;
    
    let startY = bounds.y;
    switch (style.verticalAlign) {
      case 'middle':
        startY = bounds.y + (bounds.height - totalTextHeight) / 2;
        break;
      case 'bottom':
        startY = bounds.y + bounds.height - totalTextHeight;
        break;
    }

    // Render each line
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      
      // Calculate horizontal positioning
      let x = bounds.x;
      const textWidth = ctx.measureText(line).width;
      
      switch (style.textAlign) {
        case 'center':
          x = bounds.x + (bounds.width - textWidth) / 2;
          break;
        case 'right':
          x = bounds.x + bounds.width - textWidth;
          break;
      }

      // Apply text shadow
      if (style.textShadow) {
        ctx.save();
        ctx.fillStyle = style.textShadow.color;
        ctx.filter = `blur(${style.textShadow.blur}px)`;
        ctx.fillText(line, x + style.textShadow.offsetX, y + style.textShadow.offsetY);
        ctx.restore();
      }

      // Render stroke
      if (style.strokeColor && style.strokeWidth) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeText(line, x, y);
      }

      // Render fill
      ctx.fillStyle = style.color;
      ctx.fillText(line, x, y);

      // Render text decoration
      if (style.textDecoration !== 'none') {
        this.renderTextDecoration(ctx, line, x, y, style);
      }
    });

    ctx.restore();
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraph => {
      if (paragraph.trim() === '') {
        lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }
    });

    return lines;
  }

  /**
   * Render text decoration (underline, strikethrough)
   */
  private renderTextDecoration(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    style: TextStyle
  ): void {
    const textWidth = ctx.measureText(text).width;
    const fontSize = style.fontSize;

    ctx.strokeStyle = style.color;
    ctx.lineWidth = Math.max(1, fontSize / 20);

    ctx.beginPath();
    
    switch (style.textDecoration) {
      case 'underline':
        const underlineY = y + fontSize + 2;
        ctx.moveTo(x, underlineY);
        ctx.lineTo(x + textWidth, underlineY);
        break;
      case 'line-through':
        const strikeY = y + fontSize / 2;
        ctx.moveTo(x, strikeY);
        ctx.lineTo(x + textWidth, strikeY);
        break;
    }
    
    ctx.stroke();
  }

  /**
   * Clean up text input overlay
   */
  private cleanup(): void {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
    this.overlay = null;
    this.textInput = null;
    this.currentBounds = null;
  }

  /**
   * Check if font is available
   */
  static isFontAvailable(fontFamily: string): boolean {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const fallbackFont = 'monospace';
    
    ctx.font = `72px ${fallbackFont}`;
    const fallbackWidth = ctx.measureText(testString).width;
    
    ctx.font = `72px ${fontFamily}, ${fallbackFont}`;
    const testWidth = ctx.measureText(testString).width;
    
    return testWidth !== fallbackWidth;
  }

  /**
   * Get available fonts from the predefined list
   */
  static getAvailableFonts(): string[] {
    return AVAILABLE_FONTS.filter(font => TextTool.isFontAvailable(font));
  }

  get editing(): boolean {
    return this.isEditing;
  }
}