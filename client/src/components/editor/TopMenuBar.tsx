import { useState } from 'react';
import { openImageFilePicker, importImageFile, exportCanvasAsImage, saveDocumentAsProject, loadProjectFile, quickExport } from '@/utils/fileOperations';
import { useEditorStore } from '@/store/editorStore';
import {
  applyBrightnessContrast,
  applyLevels,
  applyHueSaturation,
  convertToGrayscale,
  invertColors,
  applyExposure,
  applyVibrance,
  applyPosterize,
  applyThreshold
} from '@/utils/imageAdjustments';
import {
  applyMotionBlur,
  applyOilPainting,
  applyWatercolor,
  applyEmboss,
  applyEdgeDetection,
  applyPinch,
  applySpherize
} from '@/utils/filterEffects';
import {
  rotateCanvas,
  scaleCanvas,
  flipHorizontal,
  flipVertical,
  skewCanvas,
  resizeCanvas,
  cropCanvas
} from '@/utils/transformTools';
import { CanvasClipboard } from '@/utils/clipboard';

interface MenuItem {
  label: string;
  action: () => void;
  shortcut?: string;
  checked?: boolean;
  submenu?: MenuItem[];
}

interface MenuSeparator {
  type: 'separator';
}

interface MenuGroup {
  id: string;
  label: string;
  items: (MenuItem | MenuSeparator)[];
}

export default function TopMenuBar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { createDocument, activeDocumentId, documents, undo, redo, addHistoryStep, closeDocument } = useEditorStore();
  const activeDocument = documents.find(doc => doc.id === activeDocumentId);

  // Helper function to get the active canvas
  const getActiveCanvas = (): HTMLCanvasElement | null => {
    return document.querySelector('canvas') as HTMLCanvasElement;
  };

  // Helper function to add history and get canvas
  const withHistoryAndCanvas = (operation: (canvas: HTMLCanvasElement) => void) => {
    const canvas = getActiveCanvas();
    if (!canvas) {
      alert('No active canvas found');
      return;
    }
    
    // Save state before operation
    const beforeState = canvas.toDataURL();
    
    // Perform operation
    operation(canvas);
    
    // Save state after operation
    const afterState = canvas.toDataURL();
    
    // Add to history
    addHistoryStep({
      id: Date.now().toString(),
      action: 'transform',
      before: beforeState,
      after: afterState,
      timestamp: Date.now()
    });
  };

  const activeDocument = documents.find(doc => doc.id === activeDocumentId);

  const handleNewDocument = () => {
    createDocument('Untitled', 800, 600);
    setOpenDropdown(null);
  };

  const handleOpenDocument = async () => {
    try {
      const files = await openImageFilePicker();
      if (files.length > 0) {
        const result = await importImageFile(files[0]);
        if (result.success) {
          console.log(result.message);
        } else {
          console.error('Failed to open file:', result.message);
          alert(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      alert('Failed to open file');
    }
    setOpenDropdown(null);
  };

  const handleSaveDocument = () => {
    if (activeDocument) {
      saveDocumentAsProject(activeDocument.id);
    } else {
      alert('No document to save');
    }
    setOpenDropdown(null);
  };

  const handleExportAs = (format: 'png' | 'jpeg' | 'webp') => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas && activeDocument) {
      quickExport[format](canvas, activeDocument.name);
    } else {
      alert('No document to export');
    }
    setOpenDropdown(null);
  };

  const menuItems: MenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New...', shortcut: 'Alt+Ctrl+N', action: handleNewDocument },
        { label: 'Open...', shortcut: 'Ctrl+O', action: handleOpenDocument },
        { label: 'Open & Place...', action: () => {} },
        { 
          label: 'Open More', 
          action: () => {},
          submenu: [
            { label: 'Browse Online...', action: () => {} },
            { label: 'Open as Smart Object...', action: () => {} },
            { label: 'Open Recent', action: () => {} }
          ]
        },
        { type: 'separator' },
        { 
          label: 'Share', 
          action: () => {},
          submenu: [
            { label: 'Quick Share...', action: () => {} },
            { label: 'Copy Link...', action: () => {} },
            { label: 'Download Image...', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Save', shortcut: 'Ctrl+S', action: handleSaveDocument },
        { label: 'Save as PSD', action: () => {} },
        { 
          label: 'Save More', 
          action: () => {},
          submenu: [
            { label: 'Save as Copy...', action: () => {} },
            { label: 'Save for Web...', shortcut: 'Alt+Shift+Ctrl+S', action: () => {} },
            { label: 'Save as Template...', action: () => {} }
          ]
        },
        { 
          label: 'Export as', 
          action: () => {},
          submenu: [
            { label: 'PNG...', action: () => handleExportAs('png') },
            { label: 'JPG...', action: () => handleExportAs('jpeg') },
            { label: 'GIF...', action: () => {} },
            { label: 'WebP...', action: () => handleExportAs('webp') },
            { label: 'SVG...', action: () => {} },
            { label: 'PDF...', action: () => {} }
          ]
        },
        { label: 'Print...', shortcut: 'Ctrl+P', action: () => {} },
        { type: 'separator' },
        { label: 'Export Layers...', action: () => {} },
        { label: 'Export Color Lookup...', action: () => {} },
        { type: 'separator' },
        { label: 'File Info...', action: () => {} },
        { type: 'separator' },
        { 
          label: 'Automate', 
          action: () => {},
          submenu: [
            { label: 'Batch...', action: () => {} },
            { label: 'Create Action...', action: () => {} },
            { label: 'Fit Image...', action: () => {} },
            { label: 'Contact Sheet...', action: () => {} }
          ]
        },
        { label: 'Scripts...', action: () => {} },
        { type: 'separator' },
        { label: 'Close', shortcut: 'Ctrl+W', action: () => {
          if (activeDocument && confirm('Close current document?')) {
            closeDocument(activeDocument.id);
          }
        }},
        { label: 'Close All', shortcut: 'Alt+Ctrl+W', action: () => {
          if (confirm('Close all documents?')) {
            documents.forEach(doc => closeDocument(doc.id));
          }
        }}
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => undo() },
        { label: 'Redo', shortcut: 'Shift+Ctrl+Z', action: () => redo() },
        { type: 'separator' },
        { label: 'Step Forward', shortcut: 'Shift+Ctrl+Z', action: () => redo() },
        { label: 'Step Backward', shortcut: 'Ctrl+Z', action: () => undo() },
        { type: 'separator' },
        { label: 'Fade...', shortcut: 'Shift+Ctrl+F', action: () => {} },
        { type: 'separator' },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => {
          const canvas = getActiveCanvas();
          if (canvas) CanvasClipboard.cut(canvas);
        }},
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => {
          const canvas = getActiveCanvas();
          if (canvas) CanvasClipboard.copy(canvas);
        }},
        { label: 'Copy Merged', shortcut: 'Shift+Ctrl+C', action: () => {
          const canvas = getActiveCanvas();
          if (canvas) CanvasClipboard.copy(canvas);
        }},
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => {
          const canvas = getActiveCanvas();
          if (canvas) CanvasClipboard.pasteCenter(canvas);
        }},
        { label: 'Clear', shortcut: 'Delete', action: () => {
          const canvas = getActiveCanvas();
          if (canvas) CanvasClipboard.clear(canvas);
        }},
        { type: 'separator' },
        { label: 'Fill...', shortcut: 'Shift+F5', action: () => {
          const color = prompt('Enter fill color (hex):', '#000000');
          if (color) {
            const canvas = getActiveCanvas();
            if (canvas) CanvasClipboard.fill(canvas, color);
          }
        }},
        { label: 'Stroke...', action: () => {
          const color = prompt('Enter stroke color (hex):', '#000000');
          const width = prompt('Enter stroke width (px):', '1');
          if (color && width) {
            const canvas = getActiveCanvas();
            if (canvas) CanvasClipboard.stroke(canvas, color, parseInt(width));
          }
        }},
        { type: 'separator' },
        { label: 'Content-Aware Scale', action: () => {} },
        { label: 'Puppet Warp', action: () => {} },
        { label: 'Perspective Warp', action: () => {} },
        { label: 'Free Transform', shortcut: 'Alt+Ctrl+T', action: () => {
          alert('Free Transform: Click and drag on canvas to transform selection');
        }},
        { 
          label: 'Transform', 
          action: () => {},
          submenu: [
            { label: 'Scale', action: () => {
              const scale = prompt('Enter scale factor (1.0 = 100%):', '1.0');
              if (scale) {
                withHistoryAndCanvas(canvas => scaleCanvas(canvas, parseFloat(scale), parseFloat(scale)));
              }
            }},
            { label: 'Rotate', action: () => {
              const degrees = prompt('Enter rotation angle (degrees):', '90');
              if (degrees) {
                withHistoryAndCanvas(canvas => rotateCanvas(canvas, parseFloat(degrees)));
              }
            }},
            { label: 'Skew', action: () => {
              const skewX = prompt('Enter horizontal skew (degrees):', '0');
              const skewY = prompt('Enter vertical skew (degrees):', '0');
              if (skewX && skewY) {
                withHistoryAndCanvas(canvas => skewCanvas(canvas, parseFloat(skewX), parseFloat(skewY)));
              }
            }},
            { label: 'Distort', action: () => {} },
            { label: 'Perspective', action: () => {} },
            { label: 'Warp', action: () => {} },
            { type: 'separator' },
            { label: 'Rotate 180°', action: () => {
              withHistoryAndCanvas(canvas => rotateCanvas(canvas, 180));
            }},
            { label: 'Rotate 90° CW', action: () => {
              withHistoryAndCanvas(canvas => rotateCanvas(canvas, 90));
            }},
            { label: 'Rotate 90° CCW', action: () => {
              withHistoryAndCanvas(canvas => rotateCanvas(canvas, -90));
            }},
            { label: 'Flip Horizontal', action: () => {
              withHistoryAndCanvas(canvas => flipHorizontal(canvas));
            }},
            { label: 'Flip Vertical', action: () => {
              withHistoryAndCanvas(canvas => flipVertical(canvas));
            }}
          ]
        },
        { label: 'Auto-Align', action: () => {} },
        { label: 'Auto-Blend', action: () => {} },
        { type: 'separator' },
        { 
          label: 'Assign Profile', 
          action: () => {},
          submenu: [
            { label: 'sRGB IEC61966-2.1', action: () => {} },
            { label: 'Adobe RGB (1998)', action: () => {} },
            { label: 'ProPhoto RGB', action: () => {} }
          ]
        },
        { 
          label: 'Convert to Profile', 
          action: () => {},
          submenu: [
            { label: 'sRGB IEC61966-2.1', action: () => {} },
            { label: 'Adobe RGB (1998)', action: () => {} },
            { label: 'ProPhoto RGB', action: () => {} }
          ]
        },
        { type: 'separator' },
        { 
          label: 'Define New', 
          action: () => {},
          submenu: [
            { label: 'Brush Preset...', action: () => {} },
            { label: 'Pattern...', action: () => {} },
            { label: 'Custom Shape...', action: () => {} }
          ]
        },
        { label: 'Preset Manager...', action: () => {} },
        { type: 'separator' },
        { label: 'Preferences...', shortcut: 'Ctrl+K', action: () => {} },
        { label: 'Local Storage...', action: () => {} }
      ]
    },
    {
      id: 'image',
      label: 'Image',
      items: [
        { 
          label: 'Mode', 
          action: () => {},
          submenu: [
            { label: 'RGB Color', action: () => {} },
            { label: 'CMYK Color', action: () => {} },
            { label: 'Lab Color', action: () => {} },
            { label: 'Grayscale', action: () => {
              withHistoryAndCanvas(canvas => convertToGrayscale(canvas));
            }},
            { type: 'separator' },
            { label: '8 Bits/Channel', action: () => {} },
            { label: '16 Bits/Channel', action: () => {} },
            { label: '32 Bits/Channel', action: () => {} }
          ]
        },
        { 
          label: 'Adjustments', 
          action: () => {},
          submenu: [
            { label: 'Brightness/Contrast...', action: () => {
              const brightness = prompt('Enter brightness (-100 to 100):', '0');
              const contrast = prompt('Enter contrast (-100 to 100):', '0');
              if (brightness !== null && contrast !== null) {
                withHistoryAndCanvas(canvas => applyBrightnessContrast(canvas, {
                  brightness: parseFloat(brightness),
                  contrast: parseFloat(contrast)
                }));
              }
            }},
            { label: 'Levels...', shortcut: 'Ctrl+L', action: () => {
              const inputBlack = prompt('Input Black (0-255):', '0');
              const inputWhite = prompt('Input White (0-255):', '255');
              const gamma = prompt('Gamma (0.1-10):', '1.0');
              if (inputBlack !== null && inputWhite !== null && gamma !== null) {
                withHistoryAndCanvas(canvas => applyLevels(canvas, {
                  inputBlack: parseFloat(inputBlack),
                  inputWhite: parseFloat(inputWhite),
                  gamma: parseFloat(gamma),
                  outputBlack: 0,
                  outputWhite: 255
                }));
              }
            }},
            { label: 'Curves...', shortcut: 'Ctrl+M', action: () => {
              alert('Curves adjustment: Use brightness/contrast for now');
            }},
            { label: 'Exposure...', action: () => {
              const exposure = prompt('Enter exposure (-5 to 5):', '0');
              if (exposure !== null) {
                withHistoryAndCanvas(canvas => applyExposure(canvas, parseFloat(exposure)));
              }
            }},
            { label: 'Vibrance...', action: () => {
              const vibrance = prompt('Enter vibrance (-100 to 100):', '0');
              if (vibrance !== null) {
                withHistoryAndCanvas(canvas => applyVibrance(canvas, parseFloat(vibrance)));
              }
            }},
            { label: 'Hue/Saturation...', shortcut: 'Ctrl+U', action: () => {
              const hue = prompt('Enter hue (-180 to 180):', '0');
              const saturation = prompt('Enter saturation (-100 to 100):', '0');
              const lightness = prompt('Enter lightness (-100 to 100):', '0');
              if (hue !== null && saturation !== null && lightness !== null) {
                withHistoryAndCanvas(canvas => applyHueSaturation(canvas, {
                  hue: parseFloat(hue),
                  saturation: parseFloat(saturation),
                  lightness: parseFloat(lightness)
                }));
              }
            }},
            { label: 'Color Balance...', shortcut: 'Ctrl+B', action: () => {} },
            { label: 'Black & White...', shortcut: 'Alt+Shift+Ctrl+B', action: () => {
              withHistoryAndCanvas(canvas => convertToGrayscale(canvas));
            }},
            { label: 'Photo Filter...', action: () => {} },
            { label: 'Channel Mixer...', action: () => {} },
            { label: 'Color Lookup...', action: () => {} },
            { type: 'separator' },
            { label: 'Invert', shortcut: 'Ctrl+I', action: () => {
              withHistoryAndCanvas(canvas => invertColors(canvas));
            }},
            { label: 'Posterize...', action: () => {
              const levels = prompt('Enter posterize levels (2-255):', '8');
              if (levels !== null) {
                withHistoryAndCanvas(canvas => applyPosterize(canvas, parseInt(levels)));
              }
            }},
            { label: 'Threshold...', action: () => {
              const threshold = prompt('Enter threshold (0-255):', '128');
              if (threshold !== null) {
                withHistoryAndCanvas(canvas => applyThreshold(canvas, parseInt(threshold)));
              }
            }},
            { label: 'Gradient Map...', action: () => {} },
            { label: 'Selective Color...', action: () => {} }
          ]
        },
        { label: 'Auto Tone', shortcut: 'Shift+Ctrl+L', action: () => {} },
        { label: 'Auto Contrast', shortcut: 'Alt+Shift+Ctrl+L', action: () => {} },
        { label: 'Auto Color', shortcut: 'Shift+Ctrl+B', action: () => {} },
        { type: 'separator' },
        { label: 'Reduce Colors...', action: () => {} },
        { label: 'Vectorize Bitmap...', action: () => {} },
        { label: 'Wavelet Decompose', action: () => {} },
        { type: 'separator' },
        { label: 'Canvas Size...', shortcut: 'Alt+Ctrl+C', action: () => {} },
        { label: 'Image Size...', shortcut: 'Alt+Ctrl+I', action: () => {} },
        { 
          label: 'Transform', 
          action: () => {},
          submenu: [
            { label: 'Rotate 90° CW', action: () => {} },
            { label: 'Rotate 90° CCW', action: () => {} },
            { label: 'Rotate 180°', action: () => {} },
            { type: 'separator' },
            { label: 'Flip Canvas Horizontal', action: () => {} },
            { label: 'Flip Canvas Vertical', action: () => {} },
            { type: 'separator' },
            { label: 'Arbitrary Rotation...', action: () => {} }
          ]
        },
        { label: 'Crop', action: () => {} },
        { label: 'Trim...', shortcut: 'Ctrl+T', action: () => {} },
        { label: 'Reveal All', action: () => {} },
        { type: 'separator' },
        { label: 'Duplicate', action: () => {} },
        { label: 'Apply Image...', action: () => {} },
        { type: 'separator' },
        { label: 'Variables...', action: () => {} }
      ]
    },
    {
      id: 'layer',
      label: 'Layer',
      items: [
        { 
          label: 'New', 
          action: () => {},
          submenu: [
            { label: 'Layer...', shortcut: 'Ctrl+Shift+N', action: () => {} },
            { label: 'Layer from Background', action: () => {} },
            { label: 'Group...', shortcut: 'Ctrl+G', action: () => {} },
            { label: 'Group from Layers...', action: () => {} }
          ]
        },
        { label: 'Duplicate Layer', action: () => {} },
        { label: 'Duplicate Into...', action: () => {} },
        { label: 'Delete', shortcut: 'Delete', action: () => {} },
        { type: 'separator' },
        { 
          label: 'Text', 
          action: () => {},
          submenu: [
            { label: 'Horizontal Type Tool', shortcut: 'T', action: () => {} },
            { label: 'Vertical Type Tool', action: () => {} },
            { label: 'Convert to Point Text', action: () => {} },
            { label: 'Convert to Paragraph Text', action: () => {} },
            { label: 'Create Work Path', action: () => {} },
            { label: 'Convert to Shape', action: () => {} }
          ]
        },
        { 
          label: 'Layer Style', 
          action: () => {},
          submenu: [
            { label: 'Blending Options...', action: () => {} },
            { type: 'separator' },
            { label: 'Drop Shadow...', action: () => {} },
            { label: 'Inner Shadow...', action: () => {} },
            { label: 'Outer Glow...', action: () => {} },
            { label: 'Inner Glow...', action: () => {} },
            { label: 'Bevel & Emboss...', action: () => {} },
            { label: 'Satin...', action: () => {} },
            { label: 'Color Overlay...', action: () => {} },
            { label: 'Gradient Overlay...', action: () => {} },
            { label: 'Pattern Overlay...', action: () => {} },
            { label: 'Stroke...', action: () => {} },
            { type: 'separator' },
            { label: 'Copy Layer Style', action: () => {} },
            { label: 'Paste Layer Style', action: () => {} },
            { label: 'Clear Layer Style', action: () => {} }
          ]
        },
        { 
          label: 'New Fill Layer', 
          action: () => {},
          submenu: [
            { label: 'Solid Color...', action: () => {} },
            { label: 'Gradient...', action: () => {} },
            { label: 'Pattern...', action: () => {} }
          ]
        },
        { 
          label: 'New Adjustment Layer', 
          action: () => {},
          submenu: [
            { label: 'Brightness/Contrast...', action: () => {} },
            { label: 'Levels...', action: () => {} },
            { label: 'Curves...', action: () => {} },
            { label: 'Exposure...', action: () => {} },
            { label: 'Vibrance...', action: () => {} },
            { label: 'Hue/Saturation...', action: () => {} },
            { label: 'Color Balance...', action: () => {} },
            { label: 'Black & White...', action: () => {} },
            { label: 'Photo Filter...', action: () => {} },
            { label: 'Channel Mixer...', action: () => {} },
            { label: 'Color Lookup...', action: () => {} },
            { type: 'separator' },
            { label: 'Invert', action: () => {} },
            { label: 'Posterize...', action: () => {} },
            { label: 'Threshold...', action: () => {} },
            { label: 'Gradient Map...', action: () => {} },
            { label: 'Selective Color...', action: () => {} }
          ]
        },
        { 
          label: 'Raster Mask', 
          action: () => {},
          submenu: [
            { label: 'Reveal All', action: () => {} },
            { label: 'Hide All', action: () => {} },
            { label: 'Reveal Selection', action: () => {} },
            { label: 'Hide Selection', action: () => {} },
            { label: 'From Transparency', action: () => {} },
            { type: 'separator' },
            { label: 'Delete', action: () => {} },
            { label: 'Apply', action: () => {} },
            { label: 'Disable', action: () => {} },
            { label: 'Unlink', action: () => {} }
          ]
        },
        { 
          label: 'Vector Mask', 
          action: () => {},
          submenu: [
            { label: 'Reveal All', action: () => {} },
            { label: 'Hide All', action: () => {} },
            { label: 'Current Path', action: () => {} },
            { type: 'separator' },
            { label: 'Delete', action: () => {} },
            { label: 'Disable', action: () => {} },
            { label: 'Unlink', action: () => {} }
          ]
        },
        { label: 'Clipping Mask', shortcut: 'Alt+Ctrl+G', action: () => {} },
        { 
          label: 'Smart Object', 
          action: () => {},
          submenu: [
            { label: 'Convert to Smart Object', action: () => {} },
            { label: 'New Smart Object via Copy', action: () => {} },
            { label: 'Edit Contents', action: () => {} },
            { label: 'Export Contents...', action: () => {} },
            { label: 'Replace Contents...', action: () => {} },
            { label: 'Relink to File...', action: () => {} },
            { type: 'separator' },
            { label: 'Reset Transform', action: () => {} },
            { label: 'Convert to Layers', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Rasterize', action: () => {} },
        { label: 'Rasterize Layer Style', action: () => {} },
        { type: 'separator' },
        { label: 'Group Layers', shortcut: 'Ctrl+G', action: () => {} },
        { 
          label: 'Arrange', 
          action: () => {},
          submenu: [
            { label: 'Bring to Front', shortcut: 'Ctrl+Shift+]', action: () => {} },
            { label: 'Bring Forward', shortcut: 'Ctrl+]', action: () => {} },
            { label: 'Send Backward', shortcut: 'Ctrl+[', action: () => {} },
            { label: 'Send to Back', shortcut: 'Ctrl+Shift+[', action: () => {} }
          ]
        },
        { 
          label: 'Combine Shapes', 
          action: () => {},
          submenu: [
            { label: 'Unite', action: () => {} },
            { label: 'Subtract', action: () => {} },
            { label: 'Intersect', action: () => {} },
            { label: 'Exclude', action: () => {} }
          ]
        },
        { type: 'separator' },
        { 
          label: 'Animation', 
          action: () => {},
          submenu: [
            { label: 'New Frame', action: () => {} },
            { label: 'Copy Frame', action: () => {} },
            { label: 'Delete Frame', action: () => {} },
            { type: 'separator' },
            { label: 'Enable Timeline', action: () => {} },
            { label: 'Work Area Start', action: () => {} },
            { label: 'Work Area End', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Merge Down', shortcut: 'Ctrl+E', action: () => {} },
        { label: 'Flatten Image', action: () => {} },
        { type: 'separator' },
        { label: 'Defringe', action: () => {} }
      ]
    },
    {
      id: 'select',
      label: 'Select',
      items: [
        { label: 'All', shortcut: 'Ctrl+A', action: () => {} },
        { label: 'Deselect', shortcut: 'Ctrl+D', action: () => {} },
        { label: 'Inverse', shortcut: 'Shift+Ctrl+I', action: () => {} },
        { type: 'separator' },
        { label: 'Remove BG', action: () => {} },
        { type: 'separator' },
        { label: 'Color Range...', action: () => {} },
        { label: 'Magic Cut...', action: () => {} },
        { label: 'Subject', action: () => {} },
        { type: 'separator' },
        { label: 'Refine Edge...', action: () => {} },
        { 
          label: 'Modify', 
          action: () => {},
          submenu: [
            { label: 'Border...', action: () => {} },
            { label: 'Smooth...', action: () => {} },
            { label: 'Expand...', action: () => {} },
            { label: 'Contract...', action: () => {} },
            { label: 'Feather...', shortcut: 'Shift+F6', action: () => {} },
            { type: 'separator' },
            { label: 'Grow', action: () => {} },
            { label: 'Similar', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Grow', action: () => {} },
        { label: 'Similar', action: () => {} },
        { type: 'separator' },
        { label: 'Transform Selection', action: () => {} },
        { type: 'separator' },
        { label: 'Quick Mask Mode', shortcut: 'Q', action: () => {} },
        { type: 'separator' },
        { label: 'Load Selection', action: () => {} },
        { label: 'Save Selection', action: () => {} }
      ]
    },
    {
      id: 'filter',
      label: 'Filter',
      items: [
        { label: 'Last Filter', shortcut: 'Alt+Ctrl+F', action: () => {} },
        { type: 'separator' },
        { label: 'Filter Gallery...', action: () => {} },
        { type: 'separator' },
        { label: 'Lens Correction...', action: () => {} },
        { label: 'Camera Raw...', action: () => {} },
        { type: 'separator' },
        { label: 'Liquify...', action: () => {} },
        { label: 'Vanishing Point...', action: () => {} },
        { type: 'separator' },
        { 
          label: '3D', 
          action: () => {},
          submenu: [
            { label: 'Generate Bump Map', action: () => {} },
            { label: 'Generate Normal Map', action: () => {} },
            { label: 'Generate Volume', action: () => {} }
          ]
        },
        { 
          label: 'Blur', 
          action: () => {},
          submenu: [
            { label: 'Gaussian Blur...', action: () => {
              const radius = prompt('Enter blur radius (1-10):', '3');
              if (radius !== null) {
                withHistoryAndCanvas(canvas => {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const blurred = require('@/utils/imageProcessing').gaussianBlur(imageData, parseInt(radius));
                    ctx.putImageData(blurred, 0, 0);
                  }
                });
              }
            }},
            { label: 'Lens Blur...', action: () => {
              alert('Use Gaussian Blur for similar effect');
            }},
            { label: 'Motion Blur...', action: () => {
              const angle = prompt('Enter blur angle (0-360):', '0');
              const distance = prompt('Enter blur distance (1-100):', '10');
              if (angle !== null && distance !== null) {
                withHistoryAndCanvas(canvas => applyMotionBlur(canvas, {
                  angle: parseFloat(angle),
                  distance: parseFloat(distance)
                }));
              }
            }},
            { label: 'Radial Blur...', action: () => {} },
            { label: 'Smart Blur...', action: () => {} },
            { label: 'Surface Blur...', action: () => {} },
            { type: 'separator' },
            { label: 'Box Blur...', action: () => {} },
            { label: 'Shape Blur...', action: () => {} },
            { label: 'Average', action: () => {} }
          ]
        },
        { 
          label: 'Blur Gallery', 
          action: () => {},
          submenu: [
            { label: 'Field Blur...', action: () => {} },
            { label: 'Iris Blur...', action: () => {} },
            { label: 'Tilt-Shift...', action: () => {} },
            { label: 'Path Blur...', action: () => {} },
            { label: 'Spin Blur...', action: () => {} }
          ]
        },
        { 
          label: 'Distort', 
          action: () => {},
          submenu: [
            { label: 'Displace...', action: () => {} },
            { label: 'Pinch...', action: () => {
              const amount = prompt('Enter pinch amount (-1 to 1):', '0.5');
              if (amount !== null) {
                withHistoryAndCanvas(canvas => applyPinch(canvas, parseFloat(amount)));
              }
            }},
            { label: 'Polar Coordinates...', action: () => {} },
            { label: 'Ripple...', action: () => {} },
            { label: 'Shear...', action: () => {} },
            { label: 'Spherize...', action: () => {
              const amount = prompt('Enter spherize amount (0-200):', '100');
              if (amount !== null) {
                withHistoryAndCanvas(canvas => applySpherize(canvas, parseFloat(amount)));
              }
            }},
            { label: 'Twirl...', action: () => {} },
            { label: 'Wave...', action: () => {} },
            { label: 'ZigZag...', action: () => {} },
            { type: 'separator' },
            { label: 'Lens Correction...', action: () => {} }
          ]
        },
        { 
          label: 'Noise', 
          action: () => {},
          submenu: [
            { label: 'Add Noise...', action: () => {} },
            { label: 'Despeckle', action: () => {} },
            { label: 'Dust & Scratches...', action: () => {} },
            { label: 'Median...', action: () => {} },
            { label: 'Reduce Noise...', action: () => {} }
          ]
        },
        { 
          label: 'Pixelate', 
          action: () => {},
          submenu: [
            { label: 'Color Halftone...', action: () => {} },
            { label: 'Crystallize...', action: () => {} },
            { label: 'Facet', action: () => {} },
            { label: 'Fragment', action: () => {} },
            { label: 'Mezzotint...', action: () => {} },
            { label: 'Mosaic...', action: () => {} },
            { label: 'Pointillize...', action: () => {} }
          ]
        },
        { 
          label: 'Render', 
          action: () => {},
          submenu: [
            { label: 'Clouds', action: () => {} },
            { label: 'Difference Clouds', action: () => {} },
            { label: 'Fibers...', action: () => {} },
            { label: 'Lens Flare...', action: () => {} },
            { label: 'Lighting Effects...', action: () => {} },
            { type: 'separator' },
            { label: 'Flame...', action: () => {} },
            { label: 'Picture Frame...', action: () => {} },
            { label: 'Tree...', action: () => {} }
          ]
        },
        { 
          label: 'Sharpen', 
          action: () => {},
          submenu: [
            { label: 'Sharpen', action: () => {} },
            { label: 'Sharpen Edges', action: () => {} },
            { label: 'Sharpen More', action: () => {} },
            { label: 'Smart Sharpen...', action: () => {} },
            { label: 'Unsharp Mask...', action: () => {} }
          ]
        },
        { 
          label: 'Stylize', 
          action: () => {},
          submenu: [
            { label: 'Diffuse...', action: () => {} },
            { label: 'Emboss...', action: () => {
              withHistoryAndCanvas(canvas => applyEmboss(canvas));
            }},
            { label: 'Extrude...', action: () => {} },
            { label: 'Find Edges', action: () => {
              withHistoryAndCanvas(canvas => applyEdgeDetection(canvas));
            }},
            { label: 'Glowing Edges...', action: () => {} },
            { label: 'Solarize', action: () => {
              withHistoryAndCanvas(canvas => applyWatercolor(canvas));
            }},
            { label: 'Tiles...', action: () => {} },
            { label: 'Trace Contour...', action: () => {} },
            { label: 'Wind...', action: () => {} },
            { type: 'separator' },
            { label: 'Oil Paint...', action: () => {
              const radius = prompt('Enter brush radius (1-10):', '5');
              const levels = prompt('Enter intensity levels (5-50):', '20');
              if (radius !== null && levels !== null) {
                withHistoryAndCanvas(canvas => applyOilPainting(canvas, parseInt(radius), parseInt(levels)));
              }
            }}
          ]
        },
        { 
          label: 'Other', 
          action: () => {},
          submenu: [
            { label: 'Custom...', action: () => {} },
            { label: 'High Pass...', action: () => {} },
            { label: 'Maximum...', action: () => {} },
            { label: 'Minimum...', action: () => {} },
            { label: 'Offset...', action: () => {} }
          ]
        },
        { 
          label: 'Fourier', 
          action: () => {},
          submenu: [
            { label: 'FFT', action: () => {} },
            { label: 'IFFT', action: () => {} }
          ]
        }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Zoom In', shortcut: 'Ctrl++', action: () => {} },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => {} },
        { label: 'Fit The Area', shortcut: 'Ctrl+0', action: () => {} },
        { label: 'Pixel to Pixel', shortcut: 'Ctrl+1', action: () => {} },
        { type: 'separator' },
        { label: 'Pattern Preview', action: () => {} },
        { type: 'separator' },
        { 
          label: 'Mode', 
          action: () => {},
          submenu: [
            { label: 'Standard Screen Mode', action: () => {} },
            { label: 'Full Screen Mode with Menus', shortcut: 'F', action: () => {} },
            { label: 'Full Screen Mode', shortcut: 'Shift+F', action: () => {} },
            { label: 'Maximized Screen Mode', action: () => {} }
          ]
        },
        { label: 'Extras', shortcut: 'Ctrl+H', action: () => {}, checked: true },
        { 
          label: 'Show', 
          action: () => {},
          submenu: [
            { label: 'Layer Edges', action: () => {} },
            { label: 'Selection Edges', shortcut: 'Ctrl+H', action: () => {} },
            { label: 'Target Path', action: () => {} },
            { label: 'Grid', shortcut: 'Ctrl+\'', action: () => {} },
            { label: 'Guides', shortcut: 'Ctrl+;', action: () => {} },
            { label: 'Smart Guides', action: () => {} },
            { label: 'Slices', action: () => {} },
            { label: 'Notes', action: () => {} },
            { label: 'Pixel Grid', action: () => {} },
            { type: 'separator' },
            { label: '3D Secondary View', action: () => {} },
            { label: '3D Ground Plane', action: () => {} },
            { label: '3D Lights', action: () => {} },
            { label: '3D Selection', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Rulers', shortcut: 'Ctrl+R', action: () => {} },
        { type: 'separator' },
        { label: 'Snap', action: () => {}, checked: true },
        { 
          label: 'Snap To', 
          action: () => {},
          submenu: [
            { label: 'Guides', action: () => {}, checked: true },
            { label: 'Grid', action: () => {} },
            { label: 'Layers', action: () => {} },
            { label: 'Slices', action: () => {} },
            { label: 'Document Bounds', action: () => {} },
            { label: 'All', action: () => {} },
            { label: 'None', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Lock Guides', action: () => {} },
        { label: 'Clear Guides', action: () => {} },
        { label: 'Add Guides...', action: () => {} },
        { label: 'Guides from Layer', action: () => {} },
        { type: 'separator' },
        { label: 'Clear Slices', action: () => {} }
      ]
    },
    {
      id: 'window',
      label: 'Window',
      items: [
        { 
          label: 'More', 
          action: () => {},
          submenu: [
            { label: 'Workspace', action: () => {} },
            { label: 'Extensions', action: () => {} },
            { label: 'Libraries', action: () => {} }
          ]
        },
        { type: 'separator' },
        { label: 'Plugins', action: () => {} },
        { label: 'Actions', action: () => {} },
        { label: 'Adjustments', action: () => {} },
        { type: 'separator' },
        { label: 'Brush', action: () => {}, checked: true },
        { label: 'Channels', action: () => {}, checked: true },
        { label: 'Character', action: () => {}, checked: true },
        { label: 'Character Styles', action: () => {} },
        { label: 'Color', action: () => {} },
        { label: 'Glyphs', action: () => {} },
        { label: 'Histogram', action: () => {} },
        { label: 'History', action: () => {}, checked: true },
        { label: 'Info', action: () => {}, checked: true },
        { label: 'Layers', action: () => {}, checked: true },
        { label: 'Layer Comps', action: () => {} },
        { label: 'Navigator', action: () => {} },
        { label: 'Notes', action: () => {} },
        { label: 'Paragraph', action: () => {}, checked: true },
        { label: 'Paths', action: () => {}, checked: true },
        { label: 'Properties', action: () => {}, checked: true },
        { label: 'Style', action: () => {} },
        { label: 'Swatches', action: () => {}, checked: true },
        { label: 'Tool Presets', action: () => {} },
        { label: 'Vector Info', action: () => {} }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'About', action: () => {} },
        { label: 'Keyboard Shortcuts', action: () => {} },
        { label: 'User Guide', action: () => {} },
      ]
    }
  ];

  return (
    <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between text-xs">
      {/* Left side - Main menu */}
      <div className="flex items-center">
        {menuItems.map((menu) => (
          <div key={menu.id} className="relative">
            <button
              className="px-2 py-1 text-white hover:bg-gray-700 text-xs"
              onClick={() => setOpenDropdown(openDropdown === menu.id ? null : menu.id)}
            >
              {menu.label}
            </button>
            {openDropdown === menu.id && (
              <div className="absolute top-full left-0 bg-gray-800 border border-gray-600 shadow-lg z-50 min-w-48">
                {menu.items.map((item, index) => {
                  if (item.type === 'separator') {
                    return <hr key={index} className="border-gray-600" />;
                  }
                  return (
                    <div key={index} className="relative group">
                      <button
                        className="block w-full px-3 py-1 text-xs text-left hover:bg-gray-700 flex items-center justify-between text-white"
                        onClick={item.action}
                      >
                        <span>{item.label}</span>
                        <div className="flex items-center space-x-2">
                          {item.shortcut && (
                            <span className="text-gray-400 text-xs">{item.shortcut}</span>
                          )}
                          {item.submenu && (
                            <i className="fas fa-chevron-right text-xs text-gray-400"></i>
                          )}
                        </div>
                      </button>
                      {item.submenu && (
                        <div className="absolute left-full top-0 bg-gray-800 border border-gray-600 shadow-lg z-50 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          {item.submenu.map((subItem, subIndex) => (
                            <button
                              key={subIndex}
                              className="block w-full px-3 py-1 text-xs text-left hover:bg-gray-700 text-white"
                              onClick={subItem.action}
                            >
                              <span>{subItem.label}</span>
                              {subItem.shortcut && (
                                <span className="float-right text-gray-400 text-xs">{subItem.shortcut}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        
        {/* More menu */}
        <button className="px-2 py-1 text-white hover:bg-gray-700 text-xs">
          More
        </button>
        
        {/* Account button with red highlight */}
        <button className="px-2 py-1 text-red-400 hover:bg-gray-700 text-xs font-medium">
          Account
        </button>
      </div>

      {/* Right side - User actions and icons */}
      <div className="flex items-center space-x-3 px-3">
        <span className="text-gray-400 text-xs hover:text-white cursor-pointer">About</span>
        <span className="text-gray-400 text-xs hover:text-white cursor-pointer">Report a bug</span>
        <span className="text-gray-400 text-xs hover:text-white cursor-pointer">Learn</span>
        <span className="text-gray-400 text-xs hover:text-white cursor-pointer">Blog</span>
        <span className="text-gray-400 text-xs hover:text-white cursor-pointer">API</span>
        
        {/* Search icon */}
        <button className="text-gray-400 hover:text-white">
          <i className="fas fa-search text-xs"></i>
        </button>
        
        {/* Fullscreen icon */}
        <button className="text-gray-400 hover:text-white">
          <i className="fas fa-expand text-xs"></i>
        </button>
        
        {/* Social icons */}
        <button className="text-gray-400 hover:text-white">
          <i className="fab fa-twitter text-xs"></i>
        </button>
        <button className="text-gray-400 hover:text-white">
          <i className="fab fa-facebook text-xs"></i>
        </button>
      </div>
    </div>
  );
}
