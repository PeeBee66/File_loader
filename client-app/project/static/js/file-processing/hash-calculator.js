// file-processing/hash-calculator.js
const hashCalculator = {
    // Calculate hash in chunks client-side
    async calculateFileHash(file) {
        try {
            const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let currentChunk = 0;

            while (currentChunk < totalChunks) {
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('chunk', currentChunk);
                formData.append('totalChunks', totalChunks);
                formData.append('fileSize', file.size);
                
                const response = await fetch('/upload/calculate-hash-chunk', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const result = await response.json();
                if (result.error) {
                    throw new Error(result.error);
                }

                // Update progress - removing the duplicate percentage
                modalHandlers.updateProgress('Calculating file hash...', ((currentChunk + 1) / totalChunks) * 100);

                if (result.finalHash) {
                    return result.finalHash;
                }

                currentChunk++;
            }

            throw new Error('Hash calculation incomplete');
            
        } catch (error) {
            console.error('Hash calculation error:', error);
            modalHandlers.updateProgress('Hash calculation failed: ' + error.message, 'error');
            return null;
        }
    }
};