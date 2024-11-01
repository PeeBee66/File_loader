// project/static/js/handlers/history-handlers.js

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

        // Close modal handlers
        $(document).on('click', '.modal-close', function() {
            $(this).closest('.modal').modal('hide');
        });
    },

    async loadFolders() {
        try {
            const response = await fetch('/api/folders');
            if (!response.ok) throw new Error('Failed to fetch folders');
            
            this.folders = await response.json();
            console.log('Loaded folders:', this.folders);
            this.displayFolders(this.folders);
        } catch (error) {
            console.error('Error loading folders:', error);
            this.showError('Failed to load folders');
        }
    },

    displayFolders(folders) {
        const folderList = $('#folderList');
        folderList.empty();
    
        folders.forEach(folder => {
            const hasInventory = folder.inventory && folder.inventory.length > 0;
            const verified = folder.metadata.verified;
            const verificationTooltip = verified ? 
                "The original file and new file were copied successfully and hash matched" : 
                "File verification failed or pending";
            
            const folderHtml = `
                <div class="folder-card" data-folder="${folder.name}">
                    <div class="folder-content">
                        <div class="section operation-section">
                            <div class="operation-name">${folder.metadata.operation || 'Unknown Operation'}</div>
                            <div class="operation-date">${folder.metadata.dateOfCollection || 'Unknown Date'}</div>
                        </div>
    
                        <div class="section filenames-section">
                            <div class="original-filename" title="${folder.metadata.originalFilename || folder.metadata.original_filename || 'Unknown File'}">
                                ${folder.metadata.originalFilename || folder.metadata.original_filename || 'Unknown File'}
                            </div>
                            <div class="new-filename" title="${folder.metadata.newFilename || folder.metadata.final_filename || 'N/A'}">
                                ${folder.metadata.newFilename || folder.metadata.final_filename || 'N/A'}
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
                                <button class="info-button">info</button>
                                ${hasInventory ? '<button class="resend-button">resend</button>' : ''}
                                <button class="delete-button">delete</button>
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
    
            // Add delete button handler
            $card.find('.delete-button').on('click', (e) => {
                e.preventDefault();
                const folderPath = folder.metadata.upload_folder;
                deleteHandler.showDeleteConfirmation(folderPath, folder.metadata);
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
            this.showError('No metadata available');
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

    handleResendClick(inventory, metadata) {
        if (!inventory?.length) {
            this.showError('No inventory data available');
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

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },

    showError(message) {
        alert(message);
    }
};

// Initialize handlers when document is ready
$(document).ready(() => {
    console.log('Initializing history handlers...');
    historyHandlers.init();
});

// Make historyHandlers available globally
window.historyHandlers = historyHandlers;