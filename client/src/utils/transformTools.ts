/**
 * Transform tools for image manipulation
 */

export interface TransformBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Rotate canvas by degrees
 */
export function rotateCanvas(
  canvas: HTMLCanvasElement,
  degrees: number,
  centerX?: number,
  centerY?: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Store original image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set rotation center (default to canvas center)
  const cX = centerX ?? canvas.width / 2;
  const cY = centerY ?? canvas.height / 2;
  
  // Apply rotation
  ctx.save();
  ctx.translate(cX, cY);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.translate(-cX, -cY);
  
  // Draw the image
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Scale canvas
 */
export function scaleCanvas(
  canvas: HTMLCanvasElement,
  scaleX: number,
  scaleY: number,
  centerX?: number,
  centerY?: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Store original image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set scale center (default to canvas center)
  const cX = centerX ?? canvas.width / 2;
  const cY = centerY ?? canvas.height / 2;
  
  // Apply scaling
  ctx.save();
  ctx.translate(cX, cY);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-cX, -cY);
  
  // Draw the image
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Flip canvas horizontally
 */
export function flipHorizontal(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Store original image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply horizontal flip
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  
  // Draw the image
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Flip canvas vertically
 */
export function flipVertical(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Store original image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply vertical flip
  ctx.save();
  ctx.scale(1, -1);
  ctx.translate(0, -canvas.height);
  
  // Draw the image
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Apply free transform to selection or entire canvas
 */
export function applyFreeTransform(
  canvas: HTMLCanvasElement,
  transform: TransformBounds,
  selectionBounds?: { x: number; y: number; width: number; height: number }
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let sourceData: ImageData;
  let targetArea = transform;

  if (selectionBounds) {
    // Transform only the selection
    sourceData = ctx.getImageData(
      selectionBounds.x,
      selectionBounds.y,
      selectionBounds.width,
      selectionBounds.height
    );
    
    // Clear the selection area
    ctx.clearRect(
      selectionBounds.x,
      selectionBounds.y,
      selectionBounds.width,
      selectionBounds.height
    );
  } else {
    // Transform entire canvas
    sourceData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Create temporary canvas for transformation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceData.width;
  tempCanvas.height = sourceData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  tempCtx.putImageData(sourceData, 0, 0);

  // Apply transformation
  ctx.save();
  
  // Move to transform center
  const centerX = targetArea.x + targetArea.width / 2;
  const centerY = targetArea.y + targetArea.height / 2;
  ctx.translate(centerX, centerY);
  
  // Apply rotation
  if (transform.rotation !== 0) {
    ctx.rotate((transform.rotation * Math.PI) / 180);
  }
  
  // Apply scaling
  if (transform.scaleX !== 1 || transform.scaleY !== 1) {
    ctx.scale(transform.scaleX, transform.scaleY);
  }
  
  // Draw transformed image
  ctx.drawImage(
    tempCanvas,
    -targetArea.width / 2,
    -targetArea.height / 2,
    targetArea.width,
    targetArea.height
  );
  
  ctx.restore();
}

/**
 * Skew canvas
 */
export function skewCanvas(
  canvas: HTMLCanvasElement,
  skewX: number,
  skewY: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Store original image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply skew transformation
  ctx.save();
  ctx.transform(1, Math.tan(skewY * Math.PI / 180), Math.tan(skewX * Math.PI / 180), 1, 0, 0);
  
  // Draw the image
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Apply perspective distortion (basic 4-point)
 */
export function applyPerspective(
  canvas: HTMLCanvasElement,
  corners: [
    { x: number; y: number }, // top-left
    { x: number; y: number }, // top-right
    { x: number; y: number }, // bottom-right
    { x: number; y: number }  // bottom-left
  ]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const result = new Uint8ClampedArray(data.length);

  // Simple bilinear interpolation for perspective
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      // Bilinear interpolation of corner positions
      const topX = corners[0].x * (1 - u) + corners[1].x * u;
      const topY = corners[0].y * (1 - u) + corners[1].y * u;
      const bottomX = corners[3].x * (1 - u) + corners[2].x * u;
      const bottomY = corners[3].y * (1 - u) + corners[2].y * u;

      const sourceX = Math.round(topX * (1 - v) + bottomX * v);
      const sourceY = Math.round(topY * (1 - v) + bottomY * v);

      if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
        const sourceIdx = (sourceY * width + sourceX) * 4;
        const targetIdx = (y * width + x) * 4;

        result[targetIdx] = data[sourceIdx];
        result[targetIdx + 1] = data[sourceIdx + 1];
        result[targetIdx + 2] = data[sourceIdx + 2];
        result[targetIdx + 3] = data[sourceIdx + 3];
      }
    }
  }

  const resultImageData = new ImageData(result, width, height);
  ctx.putImageData(resultImageData, 0, 0);
}

/**
 * Resize canvas with different interpolation methods
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  newWidth: number,
  newHeight: number,
  interpolation: 'nearest' | 'bilinear' | 'bicubic' = 'bilinear'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Store original image data
  const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Resize canvas
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // Create temporary canvas with original data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalData.width;
  tempCanvas.height = originalData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  tempCtx.putImageData(originalData, 0, 0);
  
  // Set interpolation method
  switch (interpolation) {
    case 'nearest':
      ctx.imageSmoothingEnabled = false;
      break;
    case 'bilinear':
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      break;
    case 'bicubic':
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      break;
  }
  
  // Draw resized image
  ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
}

/**
 * Crop canvas to specified bounds
 */
export function cropCanvas(
  canvas: HTMLCanvasElement,
  cropBounds: { x: number; y: number; width: number; height: number }
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Get the cropped image data
  const croppedData = ctx.getImageData(
    cropBounds.x,
    cropBounds.y,
    cropBounds.width,
    cropBounds.height
  );
  
  // Resize canvas to crop size
  canvas.width = cropBounds.width;
  canvas.height = cropBounds.height;
  
  // Draw the cropped data
  ctx.putImageData(croppedData, 0, 0);
}

/**
 * Apply barrel/pincushion distortion
 */
export function applyBarrelDistortion(
  canvas: HTMLCanvasElement,
  strength: number = 0.2 // -1 to 1
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const result = new Uint8ClampedArray(data.length);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / maxRadius;
      const dy = (y - centerY) / maxRadius;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 1) {
        const factor = 1 + strength * distance * distance;
        const sourceX = Math.round(centerX + dx * factor * maxRadius);
        const sourceY = Math.round(centerY + dy * factor * maxRadius);

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