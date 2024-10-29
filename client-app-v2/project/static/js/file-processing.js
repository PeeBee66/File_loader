// file-processing.js

let currentUpload = null;
let currentFolderName = null;

async function processFile(file, metadata) {
    try {
        // Step 1: Calculate original hash
        modalHandlers.updateProgress('Gathering file information...', 'calculating');
        const formData = new FormData();
        formData.append('file', file);
        
        const hashResponse = await fetch('/calculate-hash', {
            method: 'POST',
            body: formData
        });
        
        if (!hashResponse.ok) {
            throw new Error('Failed to calculate file hash');
        }
        
        const hashResult = await hashResponse.json();
        metadata.originalFileHash = hashResult.hash;
        
        // Step 2: Upload file
        modalHandlers.updateProgress('Starting file transfer...', 0);
        const uploadResult = await uploadFile(file, metadata, modalHandlers.updateProgress);
        
        if (uploadResult.error) {
            throw new Error(uploadResult.error);
        }
        
        // Step 3: Verify integrity
        modalHandlers.updateProgress('Verifying file integrity...', 'verifying');
        const verificationResponse = await fetch('/verify-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                originalHash: metadata.originalFileHash,
                filePath: uploadResult.filePath
            })
        });
        
        if (!verificationResponse.ok) {
            throw new Error('File verification failed');
        }
        
        const verificationResult = await verificationResponse.json();
        
        // Step 4: Show completion information
        modalHandlers.showCompletionInfo({
            originalFilename: file.name,
            newFilename: verificationResult.finalFilename,
            originalHash: metadata.originalFileHash,
            newHash: verificationResult.newHash,
            fileSize: file.size,
            verified: verificationResult.verified
        });
        
        return verificationResult;
    } catch (error) {
        throw error;
    }
}

async function cancelUploadOnServer(folderName) {
    if (!folderName) {
        console.log('No folder name provided for cleanup');
        return;
    }

    try {
        const response = await fetch('/cancel-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folder_name: folderName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to clean up cancelled upload');
        }

        const result = await response.json();
        console.log('Cleanup result:', result);
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
}

// Export functions and variables
window.fileProcessing = {
    processFile,
    cancelUploadOnServer,
    getCurrentUpload: () => currentUpload,
    setCurrentUpload: (upload) => { currentUpload = upload },
    getCurrentFolderName: () => currentFolderName,
    setCurrentFolderName: (name) => { currentFolderName = name }
};