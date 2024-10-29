// chunked-upload.js

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

async function uploadFile(file, metadata, progressCallback, abortSignal) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;

    for (let start = 0; start < file.size; start += CHUNK_SIZE) {
        // Check if upload has been cancelled
        if (abortSignal?.aborted) {
            throw new DOMException('Upload cancelled by user', 'AbortError');
        }

        const chunk = file.slice(start, start + CHUNK_SIZE);
        const formData = new FormData();
        formData.append('file', chunk, file.name);
        formData.append('chunk', uploadedChunks);
        formData.append('totalChunks', totalChunks);
        formData.append('chunkSize', CHUNK_SIZE);
        
        if (uploadedChunks === 0) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        try {
            const response = await fetch('/upload-chunk', {
                method: 'POST',
                body: formData,
                signal: abortSignal
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
            }

            const result = await response.json();
            console.log('Chunk upload result:', result);

            uploadedChunks++;
            const progress = (uploadedChunks / totalChunks) * 100;
            progressCallback(progress);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error; // Re-throw abort errors
            }
            console.error('Error during chunk upload:', error);
            throw error;
        }
    }

    // Check if upload has been cancelled before completing
    if (abortSignal?.aborted) {
        throw new DOMException('Upload cancelled by user', 'AbortError');
    }
}