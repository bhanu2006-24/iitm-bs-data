/**
 * Formats images to JPG with 70% quality and optional resizing.
 */
export const ImageFormatter = {
    /**
     * Compress and resize an image file.
     * @param {File} file - The input image file.
     * @param {Object} options - { maxWidth: number, quality: number }
     * @returns {Promise<Blob>} - The processed image blob.
     */
    process: (file, options = {}) => {
        return new Promise((resolve, reject) => {
            const maxWidth = options.maxWidth || 1000; // Default max width
            const quality = options.quality || 0.7; // Default JPG 70%
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.onerror = (e) => reject(e);
            };
            reader.onerror = (e) => reject(e);
        });
    },

    /**
     * Converts a Blob to a downloadable File object with a new name.
     * @param {Blob} blob 
     * @param {string} fileName 
     * @returns {File}
     */
    toFile: (blob, fileName) => {
        return new File([blob], fileName.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
    }
};
