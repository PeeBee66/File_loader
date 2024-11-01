// file-processing/hash-calculator.js
const hashCalculator = {
    async calculateHash(file) {
        modalHandlers.updateProgress('Calculating file hash...', 'calculating');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/calculate-hash', {
                method: 'POST',
                body: formData,
                signal: fileProcessingState.state.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            return result.hash;
        } catch (error) {
            console.error('Hash calculation failed:', error);
            throw error;
        }
    }
};