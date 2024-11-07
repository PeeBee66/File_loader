// project/static/js/core/utils.js

/**
 * Shared utility functions for the application
 */

const utils = {
    /**
     * Format file size in human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size string
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Check if a file size is within the allowed limit
     * @param {number} fileSize - File size in bytes
     * @param {number} maxSize - Maximum allowed size in bytes
     * @returns {boolean} True if file is within size limit
     */
    checkFileSize: function(fileSize, maxSize) {
        return fileSize <= maxSize;
    },

    /**
     * Generate a formatted timestamp
     * @returns {string} Formatted timestamp string
     */
    getTimestamp: function() {
        return new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        }).replace(':', '');
    },

    /**
     * Clean filename by removing invalid characters
     * @param {string} filename - Original filename
     * @returns {string} Cleaned filename
     */
    cleanFilename: function(filename) {
        return filename.replace(/[^a-z0-9_.-]/gi, '_');
    },

    /**
     * Get file extension from filename
     * @param {string} filename - Filename to process
     * @returns {string} File extension including dot
     */
    getFileExtension: function(filename) {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    }
};

// Export utilities to global scope
window.utils = utils;