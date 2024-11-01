// main.js
$(document).ready(async function() {
    console.log('Document ready, initializing application...');
    
    try {
        // Initialize configuration
        await config.initialize();
        
        // Initialize form fields
        $('#processingMethod').val('Normal');
        $('#dateOfCollection').val(new Date().toISOString().split('T')[0]);
        
        // Verify system state
        if (!window.fileProcessing) {
            throw new Error('File processing system not initialized');
        }
        if (!window.modalHandlers) {
            throw new Error('Modal handlers not initialized');
        }
        
        // Initialize event handlers
        eventHandlers.initialize();
        
        // Set application as initialized
        appState.setInitialized(true);
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Failed to initialize application. Please refresh the page or contact administrator.');
    }
});

// Export global utilities
window.appState = appState;
window.config = config;
window.formValidator = formValidator;
window.fileRenaming = fileRenaming;
window.submissionHandler = submissionHandler;
window.eventHandlers = eventHandlers;