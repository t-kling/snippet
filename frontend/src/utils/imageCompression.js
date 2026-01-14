/**
 * Image compression utility
 * Target: 300KB max, 150-200KB average
 * Format: WebP at 85% quality
 * Max dimensions: 1200px width
 */

export const compressImage = async (file) => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions (max 1200px width)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1200;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first at 85% quality
          let compressedDataUrl = canvas.toDataURL('image/webp', 0.85);

          // Check size
          let sizeKB = (compressedDataUrl.length * 3) / 4 / 1024; // Rough base64 to bytes conversion

          // If still too large, reduce quality
          let quality = 0.85;
          while (sizeKB > 300 && quality > 0.5) {
            quality -= 0.05;
            compressedDataUrl = canvas.toDataURL('image/webp', quality);
            sizeKB = (compressedDataUrl.length * 3) / 4 / 1024;
          }

          // If WebP is not supported or still too large, fall back to JPEG
          if (sizeKB > 300 || !compressedDataUrl.startsWith('data:image/webp')) {
            quality = 0.85;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            sizeKB = (compressedDataUrl.length * 3) / 4 / 1024;

            while (sizeKB > 300 && quality > 0.5) {
              quality -= 0.05;
              compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
              sizeKB = (compressedDataUrl.length * 3) / 4 / 1024;
            }
          }

          // Final check
          if (sizeKB > 300) {
            reject(new Error(`Image too large: ${Math.round(sizeKB)}KB. Please use a smaller image.`));
            return;
          }

          resolve({
            dataUrl: compressedDataUrl,
            sizeKB: Math.round(sizeKB),
            width,
            height,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const removeImage = () => {
  return null;
};
