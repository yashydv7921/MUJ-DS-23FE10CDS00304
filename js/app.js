// ============================================
// Prompt Engineering Lab — Main Application
// ============================================
// Handles UI interactions, state management,
// analysis workflow, and history persistence
// ============================================

const App = (() => {
    // ---- Application State ----
    const state = {
        currentPrompt: '',
        analysisResult: null,
        improvedPrompt: null,
        improvementData: null,
        comparisonData: null,
        isLoading: false,
        history: []
    };

    // ---- DOM Element References ----
    let elements = {};

    /**
     * Initialize the application — cache DOM elements, bind events, load history
     */
    function init() {
        cacheElements();
        bindEvents();
        loadHistory();
        RadarChart.init('radar-chart');
        showToast('Welcome! Enter your API key to get started.', 'info');
    }

    /**
     * Cache all frequently-accessed DOM elements for performance
     */
    function cacheElements() {
        elements = {
            // API Key
            apiKeyInput: document.getElementById('api-key-input'),
            apiKeySaveBtn: document.getElementById('api-key-save-btn'),
            apiKeyStatus: document.getElementById('api-key-status'),
            apiKeySection: document.getElementById('api-key-section'),

            // Prompt Input
            promptTextarea: document.getElementById('prompt-textarea'),
            charCounter: document.getElementById('char-counter'),
            analyzeBtn: document.getElementById('analyze-btn'),
            clearBtn: document.getElementById('clear-btn'),

            // Results
            resultsSection: document.getElementById('results-section'),
            overallScore: document.getElementById('overall-score'),
            scoreSummary: document.getElementById('score-summary'),
            dimensionsGrid: document.getElementById('dimensions-grid'),
            strengthsList: document.getElementById('strengths-list'),
            weaknessesList: document.getElementById('weaknesses-list'),

            // Improved Prompt
            improvedSection: document.getElementById('improved-section'),
            improvedPromptBlock: document.getElementById('improved-prompt-text'),
            changesList: document.getElementById('changes-list'),
            expectedImprovement: document.getElementById('expected-improvement'),
            compareBtn: document.getElementById('compare-btn'),
            copyImprovedBtn: document.getElementById('copy-improved-btn'),

            // Comparison
            comparisonSection: document.getElementById('comparison-section'),
            originalOutput: document.getElementById('original-output'),
            improvedOutput: document.getElementById('improved-output'),
            comparisonAnalysis: document.getElementById('comparison-analysis'),

            // History
            historyBtn: document.getElementById('history-btn'),
            historySidebar: document.getElementById('history-sidebar'),
            closeSidebarBtn: document.getElementById('close-sidebar-btn'),
            historyList: document.getElementById('history-list'),
            clearHistoryBtn: document.getElementById('clear-history-btn'),

            // Loading
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),

            // Toast
            toastContainer: document.getElementById('toast-container'),

            // Demo
            demoBtn: document.getElementById('demo-btn')
        };
    }

    /**
     * Bind all event listeners to UI elements
     */
    function bindEvents() {
        // API Key
        elements.apiKeySaveBtn.addEventListener('click', saveApiKey);
        elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveApiKey();
        });

        // Prompt Input
        elements.promptTextarea.addEventListener('input', updateCharCounter);
        elements.analyzeBtn.addEventListener('click', handleAnalyze);
        elements.clearBtn.addEventListener('click', handleClear);

        // Improved Prompt
        elements.compareBtn.addEventListener('click', handleCompare);
        elements.copyImprovedBtn.addEventListener('click', handleCopyImproved);

        // History
        elements.historyBtn.addEventListener('click', toggleHistory);
        elements.closeSidebarBtn.addEventListener('click', toggleHistory);
        elements.clearHistoryBtn.addEventListener('click', clearHistory);

        // Demo
        if (elements.demoBtn) {
            elements.demoBtn.addEventListener('click', handleDemo);
        }

        // Load saved API key if exists
        const savedKey = localStorage.getItem('pel_api_key');
        if (savedKey) {
            CONFIG.API_KEY = savedKey;
            elements.apiKeyInput.value = savedKey;
            updateApiKeyStatus(true);
        }
    }

    // ======================================
    //  API KEY MANAGEMENT
    // ======================================

    /**
     * Save the API key to localStorage and CONFIG
     */
    function saveApiKey() {
        const key = elements.apiKeyInput.value.trim();
        if (!key) {
            showToast('Please enter a valid API key.', 'error');
            return;
        }
        CONFIG.API_KEY = key;
        localStorage.setItem('pel_api_key', key);
        updateApiKeyStatus(true);
        showToast('API key saved successfully!', 'success');
    }

    /**
     * Update the visual API key status indicator
     * @param {boolean} isSet - Whether the API key is configured
     */
    function updateApiKeyStatus(isSet) {
        if (isSet) {
            elements.apiKeyStatus.textContent = '✓ Connected';
            elements.apiKeyStatus.style.color = 'var(--success)';
            elements.apiKeySaveBtn.textContent = '✓ Saved';
        } else {
            elements.apiKeyStatus.textContent = 'Not configured';
            elements.apiKeyStatus.style.color = 'var(--danger)';
        }
    }

    // ======================================
    //  PROMPT INPUT
    // ======================================

    /**
     * Update the character counter below the textarea
     */
    function updateCharCounter() {
        const len = elements.promptTextarea.value.length;
        elements.charCounter.textContent = `${len} characters`;
    }

    /**
     * Clear all inputs and results, reset the UI
     */
    function handleClear() {
        elements.promptTextarea.value = '';
        updateCharCounter();
        state.currentPrompt = '';
        state.analysisResult = null;
        state.improvedPrompt = null;
        state.comparisonData = null;

        elements.resultsSection.classList.add('hidden');
        elements.improvedSection.classList.add('hidden');
        elements.comparisonSection.classList.add('hidden');

        RadarChart.reset();
        showToast('Cleared!', 'info');
    }

    // ======================================
    //  ANALYSIS WORKFLOW
    // ======================================

    /**
     * Main analysis handler — analyzes the prompt, then improves it
     */
    async function handleAnalyze() {
        const prompt = elements.promptTextarea.value.trim();

        if (!prompt) {
            showToast('Please enter a prompt to analyze.', 'error');
            return;
        }

        if (CONFIG.API_KEY === 'YOUR_GEMINI_API_KEY' || !CONFIG.API_KEY) {
            showToast('Please set your Gemini API key first.', 'error');
            return;
        }

        state.currentPrompt = prompt;

        try {
            // Step 1: Analyze the prompt
            showLoading('Analyzing your prompt...');
            const analysis = await API.analyzePrompt(prompt);
            state.analysisResult = analysis;
            renderAnalysisResults(analysis);

            // Step 2: Generate improved version
            updateLoadingText('Generating improved version...');
            const improvement = await API.improvePrompt(prompt, analysis);
            state.improvementData = improvement;
            state.improvedPrompt = improvement.improvedPrompt;
            renderImprovedPrompt(improvement);

            // Save to history
            saveToHistory(prompt, analysis);

            hideLoading();
            showToast('Analysis complete!', 'success');
        } catch (error) {
            hideLoading();
            console.error('Analysis failed:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle the side-by-side comparison
     */
    async function handleCompare() {
        if (!state.currentPrompt || !state.improvedPrompt) {
            showToast('No prompts to compare.', 'error');
            return;
        }

        try {
            showLoading('Comparing outputs side by side...');
            const comparison = await API.compareOutputs(state.currentPrompt, state.improvedPrompt);
            state.comparisonData = comparison;
            renderComparison(comparison);
            hideLoading();
            showToast('Comparison ready!', 'success');
        } catch (error) {
            hideLoading();
            console.error('Comparison failed:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    }

    // ======================================
    //  RENDERING FUNCTIONS
    // ======================================

    /**
     * Render the analysis results: scores, radar chart, dimensions, strengths/weaknesses
     * @param {Object} analysis - The analysis result from the API
     */
    function renderAnalysisResults(analysis) {
        // Show the section
        elements.resultsSection.classList.remove('hidden');

        // Scroll to results
        setTimeout(() => {
            elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // Overall score
        const score = analysis.overallScore || 0;
        elements.overallScore.textContent = score.toFixed(1);
        elements.scoreSummary.textContent = analysis.summary || '';

        // Update radar chart
        RadarChart.update(analysis.scores);

        // Render dimension cards
        renderDimensionCards(analysis.scores);

        // Render strengths and weaknesses
        renderList(elements.strengthsList, analysis.strengths || [], '💪');
        renderList(elements.weaknessesList, analysis.weaknesses || [], '⚠️');
    }

    /**
     * Render the 6 dimension score cards with animated bars
     * @param {Object} scores - The scores object from analysis
     */
    function renderDimensionCards(scores) {
        const dimensions = [
            { key: 'clarity', label: 'Clarity', icon: '🔍' },
            { key: 'specificity', label: 'Specificity', icon: '🎯' },
            { key: 'context', label: 'Context', icon: '📖' },
            { key: 'constraints', label: 'Constraints', icon: '📏' },
            { key: 'roleSetting', label: 'Role Setting', icon: '🎭' },
            { key: 'outputFormat', label: 'Output Format', icon: '📋' }
        ];

        elements.dimensionsGrid.innerHTML = dimensions.map(dim => {
            const data = scores[dim.key] || { score: 0, feedback: 'N/A' };
            const scoreVal = data.score || 0;
            const percentage = scoreVal * 10;
            const colorClass = getScoreColorClass(scoreVal);

            return `
                <div class="dimension-card glass-panel">
                    <div class="dimension-header">
                        <div class="dimension-icon">${dim.icon}</div>
                        <h4 class="dimension-title">${dim.label}</h4>
                        <span class="dimension-score-text">${scoreVal}/10</span>
                    </div>
                    <div class="score-bar-container">
                        <div class="score-bar-fill ${colorClass}" style="width: 0%;" data-width="${percentage}%"></div>
                    </div>
                    <p class="dimension-desc">${data.feedback}</p>
                </div>
            `;
        }).join('');

        // Animate score bars after a short delay (for CSS transition to trigger)
        setTimeout(() => {
            document.querySelectorAll('.score-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 100);
    }

    /**
     * Get the CSS color class based on score value
     * @param {number} score - Score from 1-10
     * @returns {string} CSS class name
     */
    function getScoreColorClass(score) {
        if (score <= 3) return 'score-low';
        if (score <= 5) return 'score-med';
        if (score <= 8) return 'score-high';
        return 'score-perfect';
    }

    /**
     * Render a list of items (strengths or weaknesses)
     * @param {HTMLElement} container - The UL element
     * @param {string[]} items - Array of text items
     * @param {string} emoji - Emoji prefix for each item
     */
    function renderList(container, items, emoji) {
        container.innerHTML = items
            .map(item => `<li>${emoji} ${item}</li>`)
            .join('');
    }

    /**
     * Render the improved prompt section
     * @param {Object} improvement - The improvement data from the API
     */
    function renderImprovedPrompt(improvement) {
        elements.improvedSection.classList.remove('hidden');

        // Set the improved prompt text
        elements.improvedPromptBlock.textContent = improvement.improvedPrompt || '';

        // Render changes list
        elements.changesList.innerHTML = (improvement.changes || [])
            .map(change => `
                <div class="change-item">
                    <span class="change-aspect">${change.aspect}</span>
                    <p class="change-desc">${change.description}</p>
                </div>
            `).join('');

        // Expected improvement
        elements.expectedImprovement.textContent = improvement.expectedImprovement || '';
    }

    /**
     * Render the comparison section with side-by-side outputs
     * @param {Object} comparison - The comparison data from the API
     */
    function renderComparison(comparison) {
        elements.comparisonSection.classList.remove('hidden');

        elements.originalOutput.textContent = comparison.originalOutput || '';
        elements.improvedOutput.textContent = comparison.improvedOutput || '';
        elements.comparisonAnalysis.textContent = comparison.comparison || '';

        // Scroll to comparison
        setTimeout(() => {
            elements.comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Copy the improved prompt to clipboard
     */
    function handleCopyImproved() {
        if (!state.improvedPrompt) return;

        navigator.clipboard.writeText(state.improvedPrompt).then(() => {
            showToast('Improved prompt copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy. Please select and copy manually.', 'error');
        });
    }

    // ======================================
    //  HISTORY MANAGEMENT
    // ======================================

    /**
     * Save an analysis to the history in localStorage
     * @param {string} prompt - The analyzed prompt
     * @param {Object} analysis - The analysis results
     */
    function saveToHistory(prompt, analysis) {
        const entry = {
            id: Date.now(),
            prompt: prompt.substring(0, 200),
            score: analysis.overallScore,
            summary: analysis.summary,
            timestamp: new Date().toLocaleString()
        };

        state.history.unshift(entry);

        // Limit history size
        if (state.history.length > CONFIG.MAX_HISTORY) {
            state.history = state.history.slice(0, CONFIG.MAX_HISTORY);
        }

        localStorage.setItem('pel_history', JSON.stringify(state.history));
        renderHistory();
    }

    /**
     * Load history from localStorage
     */
    function loadHistory() {
        try {
            const saved = localStorage.getItem('pel_history');
            if (saved) {
                state.history = JSON.parse(saved);
                renderHistory();
            }
        } catch (e) {
            console.warn('Failed to load history:', e);
            state.history = [];
        }
    }

    /**
     * Render the history list in the sidebar
     */
    function renderHistory() {
        if (!elements.historyList) return;

        if (state.history.length === 0) {
            elements.historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No history yet.</p>';
            return;
        }

        elements.historyList.innerHTML = state.history.map(entry => `
            <div class="history-card" data-id="${entry.id}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="history-card-score">${entry.score?.toFixed(1) || '?'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${entry.timestamp}</span>
                </div>
                <p class="history-card-text">${escapeHtml(entry.prompt)}</p>
            </div>
        `).join('');
    }

    /**
     * Toggle the history sidebar open/close
     */
    function toggleHistory() {
        elements.historySidebar.classList.toggle('open');
    }

    /**
     * Clear all history
     */
    function clearHistory() {
        state.history = [];
        localStorage.removeItem('pel_history');
        renderHistory();
        showToast('History cleared.', 'info');
    }

    // ======================================
    //  LOADING & NOTIFICATIONS
    // ======================================

    /**
     * Show the loading overlay with a message
     * @param {string} text - Loading message to display
     */
    function showLoading(text) {
        state.isLoading = true;
        elements.loadingText.textContent = text || 'Processing...';
        elements.loadingOverlay.classList.add('active');
        elements.analyzeBtn.disabled = true;
    }

    /**
     * Update the loading overlay text (for multi-step processes)
     * @param {string} text - New loading message
     */
    function updateLoadingText(text) {
        elements.loadingText.textContent = text;
    }

    /**
     * Hide the loading overlay
     */
    function hideLoading() {
        state.isLoading = false;
        elements.loadingOverlay.classList.remove('active');
        elements.analyzeBtn.disabled = false;
    }

    /**
     * Show a toast notification
     * @param {string} message - The toast message
     * @param {'success'|'error'|'info'} type - The type of toast
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        toast.innerHTML = `<span style="font-size:1.2rem;">${icon}</span> <span>${message}</span>`;

        elements.toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ======================================
    //  DEMO MODE
    // ======================================

    /**
     * Run a full demo with sample data — no API key needed
     * Shows all features: analysis, improvement, and comparison
     */
    async function handleDemo() {
        const demoPrompt = 'Tell me about machine learning';

        // Sample analysis result (realistic scores for a mediocre prompt)
        const demoAnalysis = {
            scores: {
                clarity: { score: 6, feedback: "The prompt is understandable but quite vague. 'Tell me about' is a very open-ended request that doesn't specify what aspect of ML to focus on." },
                specificity: { score: 3, feedback: "Very broad scope — machine learning is an enormous field. No specific topic, subtopic, or angle is mentioned." },
                context: { score: 2, feedback: "No context provided about the audience, their knowledge level, or the purpose of the information." },
                constraints: { score: 1, feedback: "No constraints whatsoever — no word limit, no tone specification, no scope boundaries." },
                roleSetting: { score: 1, feedback: "No role or persona assigned to the AI. The AI has no guidance on what perspective to take." },
                outputFormat: { score: 2, feedback: "No output format specified. The AI must guess whether to write an essay, bullet points, a tutorial, etc." }
            },
            overallScore: 2.5,
            summary: "This prompt is too vague and open-ended. It lacks specificity, context, constraints, role-setting, and output formatting. The AI will produce a generic, unfocused response.",
            strengths: ["The topic (machine learning) is clearly stated", "The prompt is grammatically correct and easy to read"],
            weaknesses: ["No specific aspect of ML is targeted — the AI must guess", "No audience or purpose context", "No constraints on length, depth, or tone", "No role assigned to guide the AI's perspective", "No output format specified"]
        };

        // Sample improved prompt
        const demoImprovement = {
            improvedPrompt: "You are a senior machine learning engineer with 10 years of industry experience. Explain the three main types of machine learning (supervised, unsupervised, and reinforcement learning) to a group of business executives who have no technical background.\n\nFor each type:\n- Provide a one-sentence definition\n- Give a real-world business application they would recognize\n- Explain it using a simple analogy\n\nKeep the total response under 400 words. Use a professional but accessible tone. Format the response with clear headings for each type.",
            changes: [
                { aspect: "Role Setting", description: "Added 'You are a senior ML engineer with 10 years of experience' to establish expertise and perspective" },
                { aspect: "Specificity", description: "Narrowed from 'tell me about ML' to specifically the 3 main types, with defined sub-points for each" },
                { aspect: "Context", description: "Added audience context (business executives with no technical background) so the AI calibrates complexity" },
                { aspect: "Constraints", description: "Added 400-word limit and professional-but-accessible tone requirement" },
                { aspect: "Output Format", description: "Specified headings, bullet points structure with definition + application + analogy for each type" },
                { aspect: "Clarity", description: "Replaced vague 'tell me about' with explicit instruction verbs: 'explain', 'provide', 'give'" }
            ],
            expectedImprovement: "The improved prompt will produce a well-structured, concise explanation tailored to non-technical executives. Instead of a generic wall of text, you'll get organized sections with practical examples they can relate to."
        };

        // Sample comparison output
        const demoComparison = {
            originalOutput: "Machine learning is a subset of artificial intelligence that focuses on building systems that can learn from data. There are several types of machine learning including supervised learning, unsupervised learning, and reinforcement learning. Machine learning is used in many applications today such as recommendation systems, image recognition, natural language processing, and autonomous vehicles. The field has grown significantly in recent years with advances in deep learning and neural networks. Companies like Google, Amazon, and Microsoft use machine learning extensively in their products and services...",
            improvedOutput: "# The Three Types of Machine Learning\n\n## 1. Supervised Learning\nSupervised learning is when an AI learns from labeled examples to make predictions about new data.\n\n**Business Example:** Email spam filters that learn from thousands of emails you've marked as 'spam' or 'not spam.'\n\n**Analogy:** Like training a new employee by showing them completed examples of good work — they learn the patterns and can handle new tasks independently.\n\n## 2. Unsupervised Learning\nUnsupervised learning discovers hidden patterns in data without pre-labeled examples.\n\n**Business Example:** Customer segmentation — grouping your customers into distinct categories based on purchasing behavior to target marketing.\n\n**Analogy:** Like sorting a deck of cards you've never seen before — you naturally group them by color, number, or suit without anyone telling you the rules.\n\n## 3. Reinforcement Learning\nReinforcement learning trains an AI through trial and error, rewarding successful actions and penalizing mistakes.\n\n**Business Example:** Dynamic pricing algorithms that learn to optimize prices in real-time based on demand.\n\n**Analogy:** Like teaching a dog new tricks — reward good behavior with treats, and the dog learns which actions lead to rewards.",
            comparison: "The original prompt produced a generic, unfocused overview that jumps between topics without depth. The improved prompt generated a structured, audience-appropriate response with clear headings, concrete business examples, and relatable analogies — exactly what was specified. This demonstrates how prompt specificity directly controls output quality."
        };

        // Set the demo prompt in the textarea
        elements.promptTextarea.value = demoPrompt;
        updateCharCounter();
        state.currentPrompt = demoPrompt;

        // Simulate loading with realistic timing
        showLoading('Analyzing your prompt...');
        await sleep(1500);

        // Render analysis
        state.analysisResult = demoAnalysis;
        renderAnalysisResults(demoAnalysis);

        updateLoadingText('Generating improved version...');
        await sleep(1200);

        // Render improvement
        state.improvementData = demoImprovement;
        state.improvedPrompt = demoImprovement.improvedPrompt;
        renderImprovedPrompt(demoImprovement);

        updateLoadingText('Comparing outputs side by side...');
        await sleep(1000);

        // Render comparison
        state.comparisonData = demoComparison;
        renderComparison(demoComparison);

        hideLoading();
        showToast('Demo complete! Try it with your own prompts using a real API key.', 'success');
    }

    /**
     * Simple sleep utility for demo mode timing
     * @param {number} ms - Milliseconds to wait
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ======================================
    //  UTILITY FUNCTIONS
    // ======================================

    /**
     * Escape HTML entities to prevent XSS
     * @param {string} text - Raw text
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    return { init };
})();

// ---- Initialize App on DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
