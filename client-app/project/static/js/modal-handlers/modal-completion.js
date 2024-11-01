// modal-handlers/modal-completion.js
const modalCompletionHandler = {
    showCompletionInfo(info) {
        console.log('Showing completion info:', info);
        try {
            $('#completionInfo').removeClass('d-none');
            
            const content = `
                <div class="completion-details p-3">
                    <h4 class="text-center mb-3">Processing Complete</h4>
                    
                    <div class="mb-2">
                        <strong>Original Filename:</strong> ${info.originalFilename}
                    </div>
                    
                    <div class="mb-2">
                        <strong>New Filename:</strong> ${info.newFilename}
                    </div>
                    
                    <div class="mb-2">
                        <strong>File Path:</strong> ${info.filePath || 'N/A'}
                    </div>
                    
                    <div class="mb-2">
                        <strong>Original Hash:</strong> 
                        <span class="font-monospace">${info.originalHash}</span>
                    </div>
                    
                    <div class="mb-2">
                        <strong>New Hash:</strong> 
                        <span class="font-monospace">${info.newHash}</span>
                    </div>

                    <div class="mb-2">
                        <strong>File Size:</strong> ${utils.formatFileSize(info.fileSize)}
                    </div>
                    
                    <div class="text-center mt-3">
                        <span class="badge ${info.verified ? 'bg-success' : 'bg-danger'} p-2">
                            ${info.verified ? 'Verification Successful' : 'Verification Failed'}
                        </span>
                    </div>

                    ${info.processingErrors.length > 0 ? `
                        <div class="mt-3 text-danger">
                            <strong>Errors:</strong>
                            <ul>
                                ${info.processingErrors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="text-center mt-3">
                        <button type="button" class="btn btn-primary" id="modalCompleteButton">
                            Complete
                        </button>
                    </div>
                </div>
            `;
            
            $('#completionInfo').html(content);
            
            const progressBar = $('#progressBar');
            progressBar
                .removeClass('bg-primary progress-bar-striped progress-bar-animated')
                .addClass(info.verified ? 'bg-success' : 'bg-danger')
                .css('width', '100%');
            
            $('#cancelUpload').addClass('d-none');
            $('#completeButton').addClass('d-none');
            
            // Add click handler for the complete button
            $('#modalCompleteButton').off('click').on('click', () => {
                progressModalHandler.hideProgressModal();
                window.location.href = '/';
            });
            
        } catch (error) {
            console.error('Error showing completion info:', error);
            progressModalHandler.updateProgress('Error displaying completion information', 'error');
        }
    }
};
