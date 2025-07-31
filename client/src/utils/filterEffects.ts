/**
 * Professional filter effects
 */

export interface MotionBlurOptions {
  angle: number;    // 0-360 degrees
  distance: number; // 1-100 pixels
}

export interface RadialBlurOptions {
  amount: number;   // 1-100
  centerX: number;  // 0-1 (relative to canvas width)
  centerY: number;  // 0-1 (relative to canvas height)
  type: 'spin' | 'zoom';
}

/**
 * Apply motion blur effect
 */
export function applyMotionBlur(
  canvas: HTMLCanvasElement,
  options: MotionBlurOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { angle, distance } = options;
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians) * distance;
  const dy = Math.sin(radians) * distance;

  const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const resultData = ctx.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      // Sample along the motion blur line
      const steps = Math.floor(distance);
      for (let step = -steps / 2; step <= steps / 2; step++) {
        const sampleX = Math.round(x + (dx * step) / steps);
        const sampleY = Math.round(y + (dy * step) / steps);

        if (sampleX >= 0 && sampleX < canvas.width && sampleY >= 0 && sampleY < canvas.height) {
          const idx = (sampleY * canvas.width + sampleX) * 4;
          r += originalData.data[idx];
          g += originalData.data[idx + 1];
          b += originalData.data[idx + 2];
          a += originalData.data[idx + 3];
          count++;
        }
      }

      const resultIdx = (y * canvas.width + x) * 4;
      if (count > 0) {
        resultData.data[resultIdx] = r / count;
        resultData.data[resultIdx + 1] = g / count;
        resultData.data[resultIdx + 2] = b / count;
        resultData.data[resultIdx + 3] = a / count;
      }
    }
  }

  ctx.putImageData(resultData, 0, 0);
}

/**
 * Apply oil painting effect
 */
export function applyOilPainting(
  canvas: HTMLCanvasElement,
  radius: number = 5,
  levels: number = 20
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const result = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const intensityCount = new Array(levels).fill(0);
      const avgR = new Array(levels).fill(0);
      const avgG = new Array(levels).fill(0);
      const avgB = new Array(levels).fill(0);

      // Sample neighborhood
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const intensity = Math.floor((r + g + b) / 3 / 255 * (levels - 1));
            intensityCount[intensity]++;
            avgR[intensity] += r;
            avgG[intensity] += g;
            avgB[intensity] += b;
          }
        }
      }

      // Find most frequent intensity
      let maxCount = 0;
      let maxIndex = 0;
      for (let i = 0; i < levels; i++) {
        if (intensityCount[i] > maxCount) {
          maxCount = intensityCount[i];
          maxIndex = i;
        }
      }

      const resultIdx = (y * width + x) * 4;
      if (maxCount > 0) {
        result[resultIdx] = avgR[maxIndex] / maxCount;
        result[resultIdx + 1] = avgG[maxIndex] / maxCount;
        result[resultIdx + 2] = avgB[maxIndex] / maxCount;
        result[resultIdx + 3] = data[resultIdx + 3];
      } else {
        result[resultIdx] = data[resultIdx];
        result[resultIdx + 1] = data[resultIdx + 1];
        result[resultIdx + 2] = data[resultIdx + 2];
        result[resultIdx + 3] = data[resultIdx + 3];
      }
    }
  }

  const resultImageData = new ImageData(result, width, height);
  ctx.putImageData(resultImageData, 0, 0);
}

/**
 * Apply watercolor effect
 */
export function applyWatercolor(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Apply multiple blur and edge-preserving operations
  const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // First pass: blur
  const blurredData = gaussianBlurImageData(originalImageData, 3);
  ctx.putImageData(blurredData, 0, 0);
  
  // Second pass: reduce colors
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Quantize colors
    data[i] = Math.floor(data[i] / 32) * 32;
    data[i + 1] = Math.floor(data[i + 1] / 32) * 32;
    data[i + 2] = Math.floor(data[i + 2] / 32) * 32;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply emboss effect
 */
export function applyEmboss(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Emboss kernel
  const kernel = [
    -2, -1,  0,
    -1,  1,  1,
     0,  1,  2
  ];

  const result = new Uint8ClampedArray(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          const weight = kernel[kernelIdx];

          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }
      }

      const resultIdx = (y * width + x) * 4;
      result[resultIdx] = Math.max(0, Math.min(255, r + 128));
      result[resultIdx + 1] = Math.max(0, Math.min(255, g + 128));
      result[resultIdx + 2] = Math.max(0, Math.min(255, b + 128));
      result[resultIdx + 3] = data[resultIdx + 3];
    }
  }

  const resultImageData = new ImageData(result, width, height);
  ctx.putImageData(resultImageData, 0, 0);
}

/**
 * Apply edge detection
 */
export function applyEdgeDetection(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Sobel edge detection kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  const result = new Uint8ClampedArray(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gxR = 0, gyR = 0, gxG = 0, gyG = 0, gxB = 0, gyB = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);

          gxR += data[idx] * sobelX[kernelIdx];
          gyR += data[idx] * sobelY[kernelIdx];
          gxG += data[idx + 1] * sobelX[kernelIdx];
          gyG += data[idx + 1] * sobelY[kernelIdx];
          gxB += data[idx + 2] * sobelX[kernelIdx];
          gyB += data[idx + 2] * sobelY[kernelIdx];
        }
      }

      const magnitudeR = Math.sqrt(gxR * gxR + gyR * gyR);
      const magnitudeG = Math.sqrt(gxG * gxG + gyG * gyG);
      const magnitudeB = Math.sqrt(gxB * gxB + gyB * gyB);

      const resultIdx = (y * width + x) * 4;
      result[resultIdx] = Math.min(255, magnitudeR);
      result[resultIdx + 1] = Math.min(255, magnitudeG);
      result[resultIdx + 2] = Math.min(255, magnitudeB);
      result[resultIdx + 3] = data[resultIdx + 3];
    }
  }

  const resultImageData = new ImageData(result, width, height);
  ctx.putImageData(resultImageData, 0, 0);
}

/**
 * Apply pinch distortion
 */
export function applyPinch(
  canvas: HTMLCanvasElement,
  amount: number = 0.5, // -1 to 1
  centerX: number = 0.5,
  centerY: number = 0.5
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const result = new Uint8ClampedArray(data.length);

  const cX = centerX * width;
  const cY = centerY * height;
  const radius = Math.min(width, height) * 0.4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cX;
      const dy = y - cY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const factor = Math.pow(distance / radius, amount);
        const newDistance = distance * factor;
        const angle = Math.atan2(dy, dx);

        const sourceX = Math.round(cX + newDistance * Math.cos(angle));
        const sourceY = Math.round(cY + newDistance * Math.sin(angle));

        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const sourceIdx = (sourceY * width + sourceX) * 4;
          const targetIdx = (y * width + x) * 4;

          result[targetIdx] = data[sourceIdx];
          result[targetIdx + 1] = data[sourceIdx + 1];
          result[targetIdx + 2] = data[sourceIdx + 2];
          result[targetIdx + 3] = data[sourceIdx + 3];
        }
      } else {
        const targetIdx = (y * width + x) * 4;
        result[targetIdx] = data[targetIdx];
        result[targetIdx + 1] = data[targetIdx + 1];
        result[targetIdx + 2] = data[targetIdx + 2];
        result[targetIdx + 3] = data[targetIdx + 3];
      }
    }
  }

  const resultImageData = new ImageData(result, width, height);
  ctx.putImageData(resultImageData, 0, 0);
}

/**
 * Apply spherize distortion
 */
export function applySpherize(
  canvas: HTMLCanvasElement,
  amount: number = 100, // 0-200
  centerX: number = 0.5,
  centerY: number = 0.5
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const result = new Uint8ClampedArray(data.length);

  const cX = centerX * width;
  const cY = centerY * height;
  const radius = Math.min(width, height) * 0.4;
  const strength = amount / 100;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cX) / radius;
      const dy = (y - cY) / radius;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 1) {
        const factor = Math.pow(Math.sin(distance * Math.PI * 0.5), strength);
        const sourceX = Math.round(cX + dx * factor * radius);
        const sourceY = Math.round(cY + dy * factor * radius);

        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const sourceIdx = (sourceY * width + sourceX) * 4;
          const targetIdx = (y * width + x) * 4;

          result[targetIdx] = data[sourceIdx];
          result[targetIdx + 1] = data[sourceIdx + 1];
          result[targetIdx + 2] = data[sourceIdx + 2];
          result[targetIdx + 3] = data[sourceIdx + 3];
        }
      } else {
        const targetIdx = (y * width + x) * 4;
        result[targetIdx] = data[targetIdx];
        result[targetIdx + 1] = data[targetIdx + 1];
        result[targetIdx + 2] = data[targetIdx + 2];
        result[targetIdx + 3] = data[targetIdx + 3];
      }
    }
  }

  const resultImageData = new ImageData(result, width, height);
  ctx.putImageData(resultImageData, 0, 0);
}

/**
 * Helper function for gaussian blur on image data
 */
function gaussianBlurImageData(imageData: ImageData, radius: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;

  // Create gaussian kernel
  const kernel = [];
  const sigma = radius / 3;
  const norm = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  const coeff = -1 / (2 * sigma * sigma);
  
  let total = 0;
  for (let i = -radius; i <= radius; i++) {
    const value = norm * Math.exp(coeff * i * i);
    kernel.push(value);
    total += value;
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= total;
  }

  // Apply horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0;
        for (let kx = -radius; kx <= radius; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const idx = (y * width + px) * 4 + channel;
          sum += data[idx] * kernel[kx + radius];
        }
        temp[(y * width + x) * 4 + channel] = sum;
      }
      temp[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]; // Alpha
    }
  }

  // Apply vertical pass
  const result = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = (py * width + x) * 4 + channel;
          sum += temp[idx] * kernel[ky + radius];
        }
        result[(y * width + x) * 4 + channel] = Math.round(sum);
      }
      result[(y * width + x) * 4 + 3] = temp[(y * width + x) * 4 + 3]; // Alpha
    }
  }

  return new ImageData(result, width, height);
}