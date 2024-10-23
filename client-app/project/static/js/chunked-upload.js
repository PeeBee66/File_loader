// chunked-upload.js

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

async function uploadFile(file, metadata, progressCallback) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;

    for (let start = 0; start < file.size; start += CHUNK_SIZE) {
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
                body: formData
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
            console.error('Error during chunk upload:', error);
            throw error;
        }
    }

    // All chunks uploaded, now complete the upload
    try {
        const response = await fetch('/complete-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: file.name, metadata: metadata })
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const result = await response.json();
        console.log('Upload completion result:', result);
        return result;
    } catch (error) {
        console.error('Error during upload completion:', error);
        throw error;
    }
}