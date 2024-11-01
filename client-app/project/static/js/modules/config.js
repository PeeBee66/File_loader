// config.js
const config = {
    state: {
        fileSaveLocation: null,
        maxFileSizeGB: null,
        systemName: null,
        initialized: false
    },

    async initialize() {
        try {
            const response = await fetch('/config');
            if (!response.ok) {
                throw new Error('Failed to fetch configuration');
            }
            const config = await response.json();
            
            this.state.fileSaveLocation = config.UPLOAD_FOLDER;
            this.state.maxFileSizeGB = config.MAX_FILE_SIZE / (1024 * 1024 * 1024);
            this.state.systemName = config.SYSTEM_NAME;
            this.state.initialized = true;
            
            return this.state;
        } catch (error) {
            console.error('Error initializing configuration:', error);
            throw error;
        }
    },

    get isInitialized() {
        return this.state.initialized;
    }
};