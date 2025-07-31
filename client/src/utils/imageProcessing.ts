export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Flood fill algorithm for paint bucket tool
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: Color,
  canvasWidth: number,
  canvasHeight: number,
  tolerance: number = 0
): void {
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  
  // Get target color at start position
  const startIndex = (startY * canvasWidth + startX) * 4;
  const targetColor: Color = {
    r: data[startIndex],
    g: data[startIndex + 1],
    b: data[startIndex + 2],
    a: data[startIndex + 3]
  };
  
  // If target color is same as fill color, no need to fill
  if (colorsEqual(targetColor, fillColor)) {
    return;
  }
  
  const visited = new Set<string>();
  const stack: Point[] = [{ x: startX, y: startY }];
  
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;
    
    // Skip if already visited or out of bounds
    if (visited.has(key) || x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) {
      continue;
    }
    
    visited.add(key);
    
    // Get current pixel color
    const pixelIndex = (y * canvasWidth + x) * 4;
    const currentColor: Color = {
      r: data[pixelIndex],
      g: data[pixelIndex + 1],
      b: data[pixelIndex + 2],
      a: data[pixelIndex + 3]
    };
    
    // Check if current color matches target color within tolerance
    if (!colorMatches(currentColor, targetColor, tolerance)) {
      continue;
    }
    
    // Fill this pixel
    data[pixelIndex] = fillColor.r;
    data[pixelIndex + 1] = fillColor.g;
    data[pixelIndex + 2] = fillColor.b;
    data[pixelIndex + 3] = fillColor.a;
    
    // Add neighboring pixels to stack
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Check if two colors are exactly equal
 */
export function colorsEqual(color1: Color, color2: Color): boolean {
  return color1.r === color2.r && 
         color1.g === color2.g && 
         color1.b === color2.b && 
         color1.a === color2.a;
}

/**
 * Check if two colors match within tolerance
 */
export function colorMatches(color1: Color, color2: Color, tolerance: number): boolean {
  const diff = Math.abs(color1.r - color2.r) + 
               Math.abs(color1.g - color2.g) + 
               Math.abs(color1.b - color2.b) + 
               Math.abs(color1.a - color2.a);
  return diff <= tolerance;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 255
  } : { r: 0, g: 0, b: 0, a: 255 };
}

/**
 * Apply gaussian blur to image data
 */
export function gaussianBlur(
  imageData: ImageData,
  radius: number = 3
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  
  // Create gaussian kernel
  const kernel = createGaussianKernel(radius);
  const kernelSize = kernel.length;
  const half = Math.floor(kernelSize / 2);
  
  // Apply horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let kx = 0; kx < kernelSize; kx++) {
        const px = Math.min(Math.max(x + kx - half, 0), width - 1);
        const index = (y * width + px) * 4;
        const weight = kernel[kx];
        
        r += imageData.data[index] * weight;
        g += imageData.data[index + 1] * weight;
        b += imageData.data[index + 2] * weight;
        a += imageData.data[index + 3] * weight;
      }
      
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;
    }
  }
  
  // Apply vertical pass
  const result = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let ky = 0; ky < kernelSize; ky++) {
        const py = Math.min(Math.max(y + ky - half, 0), height - 1);
        const index = (py * width + x) * 4;
        const weight = kernel[ky];
        
        r += data[index] * weight;
        g += data[index + 1] * weight;
        b += data[index + 2] * weight;
        a += data[index + 3] * weight;
      }
      
      const index = (y * width + x) * 4;
      result[index] = Math.round(r);
      result[index + 1] = Math.round(g);
      result[index + 2] = Math.round(b);
      result[index + 3] = Math.round(a);
    }
  }
  
  return new ImageData(result, width, height);
}

/**
 * Create gaussian kernel for blur
 */
function createGaussianKernel(radius: number): number[] {
  const size = radius * 2 + 1;
  const kernel = new Array(size);
  const sigma = radius / 3;
  const norm = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  const coeff = -1 / (2 * sigma * sigma);
  
  let total = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = norm * Math.exp(coeff * x * x);
    total += kernel[i];
  }
  
  // Normalize kernel
  for (let i = 0; i < size; i++) {
    kernel[i] /= total;
  }
  
  return kernel;
}

/**
 * Apply noise reduction filter
 */
export function denoise(imageData: ImageData, strength: number = 0.5): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0;
        let count = 0;
        
        // Average with neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const index = ((y + dy) * width + (x + dx)) * 4 + channel;
            sum += imageData.data[index];
            count++;
          }
        }
        
        const average = sum / count;
        const originalIndex = (y * width + x) * 4 + channel;
        const original = imageData.data[originalIndex];
        
        // Blend original with denoised version
        data[originalIndex] = Math.round(original * (1 - strength) + average * strength);
      }
      
      // Keep alpha channel unchanged
      const alphaIndex = (y * width + x) * 4 + 3;
      data[alphaIndex] = imageData.data[alphaIndex];
    }
  }
  
  return new ImageData(data, width, height);
}

/**
 * Apply sharpen filter using unsharp mask
 */
export function sharpen(imageData: ImageData, amount: number = 1.0): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  
  // Sharpen kernel
  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const index = ((y + ky) * width + (x + kx)) * 4 + channel;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += imageData.data[index] * kernel[kernelIndex];
          }
        }
        
        const index = (y * width + x) * 4 + channel;
        data[index] = Math.max(0, Math.min(255, Math.round(sum)));
      }
      
      // Keep alpha channel unchanged
      const alphaIndex = (y * width + x) * 4 + 3;
      data[alphaIndex] = imageData.data[alphaIndex];
    }
  }
  
  return new ImageData(data, width, height);
}

/**
 * Adjust brightness and contrast
 */
export function adjustBrightnessContrast(
  imageData: ImageData,
  brightness: number = 0,
  contrast: number = 1
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness and contrast to RGB channels
    for (let channel = 0; channel < 3; channel++) {
      let value = data[i + channel];
      
      // Apply contrast
      value = (value - 128) * contrast + 128;
      
      // Apply brightness
      value += brightness;
      
      // Clamp to valid range
      data[i + channel] = Math.max(0, Math.min(255, Math.round(value)));
    }
    
    // Keep alpha channel unchanged
    data[i + 3] = imageData.data[i + 3];
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Convert to grayscale
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 +     // Red
      data[i + 1] * 0.587 + // Green
      data[i + 2] * 0.114   // Blue
    );
    
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha remains unchanged
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}