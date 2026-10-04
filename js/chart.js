// ============================================
// Prompt Engineering Lab — Radar Chart Module
// ============================================
// Renders and updates the radar chart using Chart.js
// Visualizes prompt quality scores across 6 dimensions
// ============================================

const RadarChart = (() => {
    // Private chart instance reference
    let chartInstance = null;

    // Chart dimension labels matching the analysis dimensions
    const DIMENSION_LABELS = [
        'Clarity',
        'Specificity',
        'Context',
        'Constraints',
        'Role Setting',
        'Output Format'
    ];

    // Dimension keys matching API response structure
    const DIMENSION_KEYS = [
        'clarity',
        'specificity',
        'context',
        'constraints',
        'roleSetting',
        'outputFormat'
    ];

    /**
     * Chart.js configuration for the radar chart
     * Uses purple/cyan gradient to match the app theme
     */
    const CHART_CONFIG = {
        type: 'radar',
        data: {
            labels: DIMENSION_LABELS,
            datasets: [{
                label: 'Prompt Score',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                borderColor: 'rgba(168, 85, 247, 0.9)',
                borderWidth: 2,
                pointBackgroundColor: '#22d3ee',
                pointBorderColor: '#06b6d4',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#a855f7',
                pointHoverBorderColor: '#ffffff',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        color: 'rgba(255, 255, 255, 0.4)',
                        backdropColor: 'transparent',
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        lineWidth: 1
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        lineWidth: 1
                    },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif",
                            weight: '500'
                        },
                        padding: 15
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 26, 0.9)',
                    titleColor: '#a855f7',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(124, 58, 237, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return `Score: ${context.raw}/10`;
                        }
                    }
                }
            }
        }
    };

    /**
     * Initialize the radar chart on the canvas element
     * @param {string} canvasId - The ID of the canvas element
     * @returns {boolean} True if initialization was successful
     */
    function init(canvasId = 'radar-chart') {
        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.error(`[RadarChart] Canvas element #${canvasId} not found`);
            return false;
        }

        // Destroy existing chart instance if re-initializing
        if (chartInstance) {
            chartInstance.destroy();
        }

        try {
            const ctx = canvas.getContext('2d');
            chartInstance = new Chart(ctx, JSON.parse(JSON.stringify(CHART_CONFIG)));
            return true;
        } catch (error) {
            console.error('[RadarChart] Failed to initialize chart:', error);
            return false;
        }
    }

    /**
     * Update the radar chart with new scores from analysis
     * Animates smoothly from current values to new values
     * 
     * @param {Object} scores - The scores object from API analysis
     *   Expected format: { clarity: {score: N}, specificity: {score: N}, ... }
     */
    function update(scores) {
        if (!chartInstance) {
            console.warn('[RadarChart] Chart not initialized. Call init() first.');
            if (!init()) return;
        }

        // Extract score values in the correct order
        const scoreValues = DIMENSION_KEYS.map(key => {
            if (scores[key] && typeof scores[key].score === 'number') {
                return Math.min(10, Math.max(0, scores[key].score));
            }
            return 0;
        });

        // Update chart data with animation
        chartInstance.data.datasets[0].data = scoreValues;
        chartInstance.update('active');
    }

    /**
     * Reset the chart to all zeros
     */
    function reset() {
        if (chartInstance) {
            chartInstance.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
            chartInstance.update('active');
        }
    }

    /**
     * Destroy the chart instance and free memory
     */
    function destroy() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    /**
     * Get the dimension labels and keys for external use
     * @returns {Object} Object with labels and keys arrays
     */
    function getDimensions() {
        return {
            labels: [...DIMENSION_LABELS],
            keys: [...DIMENSION_KEYS]
        };
    }

    // Public API
    return {
        init,
        update,
        reset,
        destroy,
        getDimensions
    };
})();
