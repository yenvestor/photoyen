/**
 * Professional image adjustment utilities
 */

export interface BrightnessContrastOptions {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
}

export interface LevelsOptions {
  inputBlack: number;    // 0-255
  inputWhite: number;    // 0-255
  gamma: number;         // 0.1-10
  outputBlack: number;   // 0-255
  outputWhite: number;   // 0-255
}

export interface HueSaturationOptions {
  hue: number;        // -180 to 180
  saturation: number; // -100 to 100
  lightness: number;  // -100 to 100
}

export interface ColorBalanceOptions {
  shadows: { cyan: number; magenta: number; yellow: number };
  midtones: { cyan: number; magenta: number; yellow: number };
  highlights: { cyan: number; magenta: number; yellow: number };
}

/**
 * Apply brightness and contrast adjustment
 */
export function applyBrightnessContrast(
  canvas: HTMLCanvasElement,
  options: BrightnessContrastOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const brightness = options.brightness;
  const contrast = (options.contrast + 100) / 100;

  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast
    data[i] = ((data[i] - 128) * contrast + 128);     // Red
    data[i + 1] = ((data[i + 1] - 128) * contrast + 128); // Green
    data[i + 2] = ((data[i + 2] - 128) * contrast + 128); // Blue

    // Apply brightness
    data[i] = Math.max(0, Math.min(255, data[i] + brightness));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply levels adjustment
 */
export function applyLevels(
  canvas: HTMLCanvasElement,
  options: LevelsOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const { inputBlack, inputWhite, gamma, outputBlack, outputWhite } = options;
  const inputRange = inputWhite - inputBlack;
  const outputRange = outputWhite - outputBlack;

  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      let value = data[i + channel];
      
      // Input levels
      value = Math.max(0, Math.min(255, (value - inputBlack) / inputRange * 255));
      
      // Gamma correction
      value = Math.pow(value / 255, 1 / gamma) * 255;
      
      // Output levels
      value = outputBlack + (value / 255) * outputRange;
      
      data[i + channel] = Math.max(0, Math.min(255, value));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply hue/saturation adjustment
 */
export function applyHueSaturation(
  canvas: HTMLCanvasElement,
  options: HueSaturationOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const hueShift = options.hue / 360;
  const saturationMultiplier = (options.saturation + 100) / 100;
  const lightnessShift = options.lightness / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    // Apply adjustments
    h = (h + hueShift) % 1;
    if (h < 0) h += 1;
    s = Math.max(0, Math.min(1, s * saturationMultiplier));
    l = Math.max(0, Math.min(1, l + lightnessShift));

    // Convert back to RGB
    let newR, newG, newB;
    if (s === 0) {
      newR = newG = newB = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      newR = hue2rgb(p, q, h + 1/3);
      newG = hue2rgb(p, q, h);
      newB = hue2rgb(p, q, h - 1/3);
    }

    data[i] = Math.round(newR * 255);
    data[i + 1] = Math.round(newG * 255);
    data[i + 2] = Math.round(newB * 255);
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert to grayscale
 */
export function convertToGrayscale(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 +     // Red
      data[i + 1] * 0.587 + // Green
      data[i + 2] * 0.114   // Blue
    );
    
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Invert colors
 */
export function invertColors(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];         // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply exposure adjustment
 */
export function applyExposure(
  canvas: HTMLCanvasElement,
  exposure: number // -5 to 5
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const multiplier = Math.pow(2, exposure);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] * multiplier));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * multiplier));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * multiplier));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply vibrance adjustment
 */
export function applyVibrance(
  canvas: HTMLCanvasElement,
  vibrance: number // -100 to 100
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const vibranceAmount = vibrance / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    const amt = Math.abs(max - avg) * 2 * vibranceAmount;

    data[i] = Math.max(0, Math.min(255, data[i] + (data[i] - avg * 255) * amt));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + (data[i + 1] - avg * 255) * amt));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + (data[i + 2] - avg * 255) * amt));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply posterize effect
 */
export function applyPosterize(
  canvas: HTMLCanvasElement,
  levels: number // 2-255
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const step = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply threshold effect
 */
export function applyThreshold(
  canvas: HTMLCanvasElement,
  threshold: number // 0-255
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    );
    
    const value = gray >= threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
}