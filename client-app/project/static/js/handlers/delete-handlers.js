// project/static/js/handlers/delete-handlers.js

const deleteHandler = {
    init() {
        this.createDeleteModal();
    },

    createDeleteModal() {
        const modalHtml = `
            <div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-labelledby="deleteConfirmationModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title" id="deleteConfirmationModalLabel">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                Warning: Permanent Deletion
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger">
                                <strong>You are about to delete:</strong><br>
                                <span id="deleteFolderPath"></span>
                            </div>
                            <p class="fw-bold text-danger">WARNING: This action cannot be undone!</p>
                            <p>All data in this folder will be permanently deleted. This data will be:</p>
                            <ul>
                                <li>Completely and permanently erased</li>
                                <li>Impossible to recover</li>
                                <li>Removed from all backups</li>
                                <li>Gone forever and ever</li>
                            </ul>
                            <div class="mt-4">
                                <label class="form-label">Type "I Agree" to confirm deletion:</label>
                                <input type="text" class="form-control" id="deleteConfirmText" placeholder="Type 'I Agree'">
                                <div class="invalid-feedback" id="deleteConfirmError"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete Forever</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body if it doesn't exist
        if (!$('#deleteConfirmationModal').length) {
            $('body').append(modalHtml);
        }
    },

    showDeleteConfirmation(folderPath, metadata) {
        $('#deleteFolderPath').text(folderPath);
        $('#deleteConfirmText').val('').removeClass('is-invalid');
        $('#deleteConfirmError').hide();

        $('#confirmDeleteBtn').off('click').on('click', async () => {
            const confirmText = $('#deleteConfirmText').val().trim();
            if (confirmText !== 'I Agree') {
                $('#deleteConfirmText').addClass('is-invalid');
                $('#deleteConfirmError').text('Please type "I Agree" exactly as shown').show();
                return;
            }

            try {
                await this.handleDelete(folderPath, metadata);
                bootstrap.Modal.getInstance($('#deleteConfirmationModal')).hide();
                // Refresh the folders list
                await historyHandlers.loadFolders();
            } catch (error) {
                console.error('Delete error:', error);
                $('#deleteConfirmError').text('Error deleting folder: ' + error.message).show();
            }
        });

        new bootstrap.Modal($('#deleteConfirmationModal')).show();
    },

    async handleDelete(folderPath, metadata) {
        try {
            const response = await fetch('/api/delete-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    folder_path: folderPath,
                    metadata: metadata
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete folder');
            }
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }
};

// Initialize delete handler when document is ready
$(document).ready(() => {
    deleteHandler.init();
});

// Make deleteHandler available globally
window.deleteHandler = deleteHandler;