// chunked-upload.js

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_RETRIES = 3; // Maximum number of retry attempts for failed chunks

async function uploadFile(file, metadata, progressCallback, abortSignal) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;
    let finalResponse = null;

    // Handle abort signal
    if (abortSignal) {
        if (abortSignal.aborted) {
            throw new DOMException('Upload cancelled by user', 'AbortError');
        }

        abortSignal.addEventListener('abort', () => {
            throw new DOMException('Upload cancelled by user', 'AbortError');
        });
    }

    for (let start = 0; start < file.size; start += CHUNK_SIZE) {
        // Check for cancellation before each chunk
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

        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                // Check for cancellation before each retry
                if (abortSignal?.aborted) {
                    throw new DOMException('Upload cancelled by user', 'AbortError');
                }

                const response = await fetch('/upload-chunk', {
                    method: 'POST',
                    body: formData,
                    signal: abortSignal // Pass the abort signal to fetch
                });

                if (!response.ok) {
                    const responseText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
                }

                const result = await response.json();
                console.log('Chunk upload result:', result);

                if (result.error) {
                    throw new Error(result.error);
                }

                // Store the final response when it's the last chunk
                if (uploadedChunks === totalChunks - 1) {
                    finalResponse = result;
                }

                uploadedChunks++;
                const progress = (uploadedChunks / totalChunks) * 100;
                progressCallback(progress);
                
                break; // Successful upload, break the retry loop

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Upload aborted by user');
                    throw error; // Re-throw abort errors
                }
                
                retries++;
                console.error(`Chunk upload failed (attempt ${retries}/${MAX_RETRIES}):`, error);
                
                if (retries === MAX_RETRIES) {
                    console.error('Max retries reached for chunk upload');
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            }
        }
    }

    // Final cancellation check
    if (abortSignal?.aborted) {
        throw new DOMException('Upload cancelled by user', 'AbortError');
    }

    if (!finalResponse) {
        throw new Error('No final response received from server');
    }

    return {
        status: 'Upload completed',
        totalChunks: totalChunks,
        filePath: finalResponse.filePath,
        success: true,
        ...finalResponse
    };
}

// Make uploadFile available globally
window.uploadFile = uploadFile;