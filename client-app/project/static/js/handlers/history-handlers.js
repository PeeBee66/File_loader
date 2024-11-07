// handlers/history-handlers.js
const historyHandlers = {
    folders: [],
    currentMetadata: null,

    init() {
        this.bindEventListeners();
        this.loadFolders();
    },

    bindEventListeners() {
        // Search box handler
        $('#searchBox').on('input', (e) => this.handleSearch(e.target.value));

        // Event delegation for dynamically created elements
        $(document).on('click', '.info-button', (e) => {
            e.preventDefault();
            const $card = $(e.target).closest('.folder-card');
            const metadata = $card.data('metadata');
            this.showMetadataInfo(metadata);
        });

        $(document).on('click', '.resend-button', (e) => {
            e.preventDefault();
            const $card = $(e.target).closest('.folder-card');
            const inventory = $card.data('inventory');
            this.handleResendClick(inventory, $card.data('metadata'));
        });

        // Delete button handler
        $(document).on('click', '.delete-button', (e) => {
            e.preventDefault();
            const $card = $(e.target).closest('.folder-card');
            const metadata = $card.data('metadata');
            const folderPath = metadata.upload_folder;
            deleteHandler.showDeleteConfirmation(folderPath, metadata);
        });

        // Close modal handlers
        $(document).on('click', '.modal-close', function() {
            $(this).closest('.modal').modal('hide');
        });
    },

    async loadFolders() {
        try {
            const response = await fetch('/api/folders');
            if (!response.ok) {
                throw new Error('Failed to fetch folders');
            }
            
            this.folders = await response.json();
            console.log('Loaded folders:', this.folders);
            this.displayFolders(this.folders);
        } catch (error) {
            console.error('Error loading folders:', error);
            this.handleError(error);
        }
    },

    displayFolders(folders) {
        const folderList = $('#folderList');
        folderList.empty();
    
        folders.forEach(folder => {
            const hasInventory = folder.inventory && folder.inventory.length > 0;
            const verified = folder.metadata.verified;
            const verificationTooltip = verified ? 
                "Files were copied successfully and hash matched" : 
                "File verification failed or pending";
            
            const folderHtml = `
                <div class="folder-card" data-folder="${folder.name}">
                    <div class="folder-content">
                        <div class="section operation-section">
                            <div class="operation-name">${folder.metadata.operation || 'Unknown Operation'}</div>
                            <div class="operation-date">${folder.metadata.dateOfCollection || 'Unknown Date'}</div>
                        </div>
    
                        <div class="section filenames-section">
                            <div class="filename-container">
                                <div class="filename-label">Original Filename:</div>
                                <div class="filename-value" title="${folder.metadata.originalFilename || 'Unknown File'}">
                                    ${folder.metadata.originalFilename || 'Unknown File'}
                                </div>
                            </div>
                            <div class="filename-container">
                                <div class="filename-label">Changed Filename:</div>
                                <div class="filename-value" title="${folder.metadata.newFilename || 'N/A'}">
                                    ${folder.metadata.newFilename || 'N/A'}
                                </div>
                            </div>
                        </div>
    
                        <div class="section status-section">
                            <div class="file-size">
                                FILE SIZE: ${folder.metadata.fileSize ? 
                                    `${(folder.metadata.fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB` : 
                                    'N/A'}
                            </div>
                            <div class="item-number">
                                Item NO: ${folder.metadata.itemNumber || ''} Sub ${folder.metadata.subNumber || ''}
                            </div>
                        </div>
    
                        <div class="section buttons-section">
                            <div class="buttons-group">
                                <button class="info-button">Info</button>
                                ${hasInventory ? '<button class="resend-button">Resend</button>' : ''}
                                <button class="delete-button">Delete</button>
                            </div>
                            <div class="verification-badge ${verified ? 'verified' : 'not-verified'}"
                                 data-tooltip="${verificationTooltip}">
                                ${verified ? 'Verified' : 'Not Verified'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
    
            const $card = $(folderHtml);
            $card.data({
                metadata: folder.metadata,
                inventory: folder.inventory
            });
    
            folderList.append($card);
        });
    },

    handleSearch(searchTerm) {
        const filteredFolders = searchTerm ? 
            this.folders.filter(folder => 
                JSON.stringify(folder.metadata).toLowerCase().includes(searchTerm.toLowerCase())
            ) : this.folders;
        
        this.displayFolders(filteredFolders);
    },

    showMetadataInfo(metadata) {
        if (!metadata) {
            this.handleError(new Error('No metadata available'));
            return;
        }

        let metadataHtml = '<div class="table-responsive"><table class="table table-bordered">';
        metadataHtml += `
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
        `;

        const sortedEntries = Object.entries(metadata).sort((a, b) => a[0].localeCompare(b[0]));

        for (const [key, value] of sortedEntries) {
            let displayValue = value;
            if (typeof value === 'boolean') {
                displayValue = value ? 'Yes' : 'No';
            } else if (value === null || value === undefined) {
                displayValue = 'N/A';
            } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value, null, 2);
            }

            metadataHtml += `
                <tr>
                    <td class="fw-bold">${key}</td>
                    <td>${displayValue}</td>
                </tr>
            `;
        }

        metadataHtml += '</tbody></table></div>';
        $('#infoContent').html(metadataHtml);
        new bootstrap.Modal(document.getElementById('infoModal')).show();
    },

    async handleResendClick(inventory, metadata) {
        if (!inventory?.length) {
            this.handleError(new Error('No inventory data available'));
            return;
        }

        this.currentMetadata = metadata;
        const inventoryHtml = this.createInventoryTable(inventory);
        $('#inventoryContent').html(inventoryHtml);
        
        inventory.forEach(chunk => {
            $(`#resubmit-${chunk.chunk}`).data('chunk', chunk);
        });
        
        new bootstrap.Modal(document.getElementById('inventoryModal')).show();
    },

    createInventoryTable(inventory) {
        return `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Chunk</th>
                            <th>Hash</th>
                            <th>Size</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inventory.map(chunk => `
                            <tr>
                                <td>${chunk.file}</td>
                                <td>${chunk.chunk}</td>
                                <td class="text-monospace small">${chunk.hash}</td>
                                <td>${this.formatFileSize(chunk.size)}</td>
                                <td>
                                    <button id="resubmit-${chunk.chunk}" 
                                            class="btn btn-primary btn-sm resubmit-chunk-btn">
                                        Resubmit
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async handleChunkResubmit(chunk) {
        try {
            const response = await fetch('/api/resend-chunk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chunk: chunk.chunk,
                    hash: chunk.hash,
                    size: chunk.size,
                    metadata: this.currentMetadata
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            // Show success message without redirect
            const successHtml = `
                <div class="alert alert-success">
                    <h5>Resend Request Created</h5>
                    <p>Location: ${result.location}</p>
                    <p>Filename: ${result.filename}</p>
                    <button class="btn btn-primary" onclick="$('#inventoryModal').modal('hide')">
                        Close
                    </button>
                </div>
            `;
            $('#inventoryContent').html(successHtml);

        } catch (error) {
            console.error('Resend error:', error);
            this.handleError(error);
        }
    },

    handleError(error) {
        console.error('History error:', error);
        const errorMessage = error.message || 'An error occurred';
        
        // Show error in modal if open, otherwise in alert
        if ($('#infoModal').hasClass('show')) {
            $('#infoContent').html(`
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${errorMessage}
                    <button class="btn btn-primary mt-3" onclick="$('#infoModal').modal('hide')">
                        Close
                    </button>
                </div>
            `);
        } else if ($('#inventoryModal').hasClass('show')) {
            $('#inventoryContent').html(`
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${errorMessage}
                    <button class="btn btn-primary mt-3" onclick="$('#inventoryModal').modal('hide')">
                        Close
                    </button>
                </div>
            `);
        } else {
            // Create and show error modal
            const errorModal = `
                <div class="modal fade" id="errorModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title">Error</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-danger mb-0">
                                    ${errorMessage}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing error modal if present
            $('#errorModal').remove();
            
            // Add new error modal to body and show it
            $('body').append(errorModal);
            new bootstrap.Modal(document.getElementById('errorModal')).show();
        }
    },

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },

    bindResubmitHandlers() {
        $(document).on('click', '.resubmit-chunk-btn', async (e) => {
            e.preventDefault();
            const button = $(e.target);
            const chunk = button.data('chunk');
            
            // Disable button and show loading state
            button.prop('disabled', true)
                  .html('<span class="spinner-border spinner-border-sm"></span> Resubmitting...');
            
            try {
                await this.handleChunkResubmit(chunk);
            } catch (error) {
                this.handleError(error);
            } finally {
                button.prop('disabled', false).text('Resubmit');
            }
        });
    }
};

// Initialize handlers when document is ready
$(document).ready(() => {
    console.log('Initializing history handlers...');
    historyHandlers.init();
    historyHandlers.bindResubmitHandlers();
});

// Make historyHandlers available globally
window.historyHandlers = historyHandlers;