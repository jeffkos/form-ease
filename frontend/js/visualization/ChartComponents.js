/**
 * Tremor-inspired Chart Components
 * Sprint 5 Phase 3 - Data Visualization Charts
 * 
 * Professional chart components following Tremor design principles
 */

// ==========================================
// Base Chart Class
// ==========================================

class BaseChart {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = {
            theme: 'light',
            responsive: true,
            animated: true,
            colors: this.getThemeColors(options.theme || 'light'),
            ...options
        };
        
        this.chart = null;
        this.setupContainer();
    }
    
    setupContainer() {
        this.container.className += ' tremor-chart-container relative';
        if (this.options.responsive) {
            this.container.style.height = this.container.style.height || '400px';
        }
    }
    
    getThemeColors(theme) {
        const colors = {
            light: {
                primary: '#2563eb',
                secondary: '#64748b',
                success: '#059669',
                warning: '#d97706',
                error: '#dc2626',
                surface: '#ffffff',
                text: '#1f2937',
                border: '#e5e7eb',
                grid: '#f3f4f6'
            },
            dark: {
                primary: '#3b82f6',
                secondary: '#94a3b8',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                surface: '#1f2937',
                text: '#f9fafb',
                border: '#374151',
                grid: '#374151'
            }
        };
        
        return colors[theme] || colors.light;
    }
    
    getColorPalette() {
        return [
            '#2563eb', '#059669', '#d97706', '#dc2626',
            '#7c3aed', '#0891b2', '#be185d', '#047857',
            '#b45309', '#7e22ce', '#0e7490', '#a21caf'
        ];
    }
    
    updateData(newData) {
        this.data = newData;
        this.render();
    }
    
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }
    
    destroy() {
        if (this.chart && typeof this.chart.destroy === 'function') {
            this.chart.destroy();
        }
        this.container.innerHTML = '';
    }
    
    export(format = 'png') {
        // Base export functionality
        if (this.chart && this.chart.getCanvas) {
            const canvas = this.chart.getCanvas();
            return canvas.toDataURL(`image/${format}`);
        }
        throw new Error('Export not supported for this chart type');
    }
    
    render() {
        throw new Error('Render method must be implemented by subclass');
    }
}

// ==========================================
// Bar Chart Component
// ==========================================

class BarChart extends BaseChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            orientation: 'vertical', // 'vertical' or 'horizontal'
            showValues: true,
            showGrid: true,
            showLegend: true,
            ...options
        });
        
        this.render();
    }
    
    render() {
        const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
        
        this.container.innerHTML = `
            <div class="tremor-chart w-full h-full">
                <canvas id="${chartId}" class="w-full h-full"></canvas>
            </div>
        `;
        
        this.renderChart(chartId);
    }
    
    renderChart(chartId) {
        const canvas = document.getElementById(chartId);
        const ctx = canvas.getContext('2d');
        
        // Simple bar chart implementation
        const processedData = this.processDataForChart();
        this.drawBarChart(ctx, processedData);
    }
    
    processDataForChart() {
        if (!Array.isArray(this.data)) return [];
        
        // Convert data to chart format
        const labels = [];
        const values = [];
        
        this.data.forEach(item => {
            if (typeof item === 'object') {
                const keys = Object.keys(item);
                const labelKey = keys.find(k => typeof item[k] === 'string') || keys[0];
                const valueKey = keys.find(k => typeof item[k] === 'number') || keys[1];
                
                labels.push(item[labelKey]);
                values.push(item[valueKey] || 0);
            }
        });
        
        return { labels, values };
    }
    
    drawBarChart(ctx, data) {
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const { labels, values } = data;
        
        if (!values.length) return;
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Chart dimensions
        const padding = 60;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // Calculate scales
        const maxValue = Math.max(...values);
        const barWidth = chartWidth / labels.length * 0.8;
        const barSpacing = chartWidth / labels.length * 0.2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set styles
        ctx.fillStyle = this.options.colors.primary;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        
        // Draw bars
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (index * (barWidth + barSpacing));
            const y = height - padding - barHeight;
            
            // Draw bar
            ctx.fillStyle = this.getColorPalette()[index % this.getColorPalette().length];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw value label
            if (this.options.showValues) {
                ctx.fillStyle = this.options.colors.text;
                ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
            }
            
            // Draw label
            ctx.fillStyle = this.options.colors.text;
            ctx.fillText(labels[index], x + barWidth / 2, height - padding + 20);
        });
        
        // Draw axes
        if (this.options.showGrid) {
            this.drawAxes(ctx, width, height, padding);
        }
    }
    
    drawAxes(ctx, width, height, padding) {
        ctx.strokeStyle = this.options.colors.border;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        // Y-axis
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        // X-axis
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
    }
}

// ==========================================
// Line Chart Component
// ==========================================

class LineChart extends BaseChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            smooth: true,
            showPoints: true,
            showArea: false,
            lineWidth: 2,
            ...options
        });
        
        this.render();
    }
    
    render() {
        const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
        
        this.container.innerHTML = `
            <div class="tremor-chart w-full h-full">
                <canvas id="${chartId}" class="w-full h-full"></canvas>
            </div>
        `;
        
        this.renderChart(chartId);
    }
    
    renderChart(chartId) {
        const canvas = document.getElementById(chartId);
        const ctx = canvas.getContext('2d');
        
        const processedData = this.processDataForChart();
        this.drawLineChart(ctx, processedData);
    }
    
    processDataForChart() {
        if (!Array.isArray(this.data)) return { points: [] };
        
        const points = [];
        
        this.data.forEach((item, index) => {
            if (typeof item === 'object') {
                const keys = Object.keys(item);
                const xKey = keys.find(k => !isNaN(Date.parse(item[k]))) || keys[0];
                const yKey = keys.find(k => typeof item[k] === 'number') || keys[1];
                
                points.push({
                    x: item[xKey],
                    y: item[yKey] || 0,
                    label: item[xKey]
                });
            } else if (typeof item === 'number') {
                points.push({ x: index, y: item, label: index.toString() });
            }
        });
        
        return { points };
    }
    
    drawLineChart(ctx, data) {
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const { points } = data;
        
        if (!points.length) return;
        
        canvas.width = width;
        canvas.height = height;
        
        const padding = 60;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // Calculate scales
        const xValues = points.map((p, i) => i);
        const yValues = points.map(p => p.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const rangeY = maxY - minY || 1;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        if (this.options.showGrid) {
            this.drawGrid(ctx, width, height, padding, points.length, 5);
        }
        
        // Draw line
        ctx.strokeStyle = this.options.colors.primary;
        ctx.lineWidth = this.options.lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        points.forEach((point, index) => {
            const x = padding + (index / (points.length - 1)) * chartWidth;
            const y = height - padding - ((point.y - minY) / rangeY) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                if (this.options.smooth) {
                    // Simple curve implementation
                    const prevPoint = points[index - 1];
                    const prevX = padding + ((index - 1) / (points.length - 1)) * chartWidth;
                    const prevY = height - padding - ((prevPoint.y - minY) / rangeY) * chartHeight;
                    
                    const cpx1 = prevX + (x - prevX) / 3;
                    const cpy1 = prevY;
                    const cpx2 = x - (x - prevX) / 3;
                    const cpy2 = y;
                    
                    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();
        
        // Draw area if enabled
        if (this.options.showArea) {
            this.drawArea(ctx, points, padding, chartWidth, chartHeight, width, height, minY, rangeY);
        }
        
        // Draw points
        if (this.options.showPoints) {
            this.drawPoints(ctx, points, padding, chartWidth, chartHeight, height, minY, rangeY);
        }
        
        // Draw axes
        this.drawAxes(ctx, width, height, padding);
    }
    
    drawGrid(ctx, width, height, padding, xSteps, ySteps) {
        ctx.strokeStyle = this.options.colors.grid;
        ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let i = 0; i <= xSteps; i++) {
            const x = padding + (i / xSteps) * (width - padding * 2);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= ySteps; i++) {
            const y = padding + (i / ySteps) * (height - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
    }
    
    drawArea(ctx, points, padding, chartWidth, chartHeight, width, height, minY, rangeY) {
        ctx.fillStyle = this.options.colors.primary + '20'; // Add transparency
        
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        
        points.forEach((point, index) => {
            const x = padding + (index / (points.length - 1)) * chartWidth;
            const y = height - padding - ((point.y - minY) / rangeY) * chartHeight;
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();
        ctx.fill();
    }
    
    drawPoints(ctx, points, padding, chartWidth, chartHeight, height, minY, rangeY) {
        ctx.fillStyle = this.options.colors.primary;
        
        points.forEach((point, index) => {
            const x = padding + (index / (points.length - 1)) * chartWidth;
            const y = height - padding - ((point.y - minY) / rangeY) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawAxes(ctx, width, height, padding) {
        ctx.strokeStyle = this.options.colors.border;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
    }
}

// ==========================================
// Pie Chart Component
// ==========================================

class PieChart extends BaseChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            showLabels: true,
            showPercentages: true,
            startAngle: -Math.PI / 2,
            ...options
        });
        
        this.render();
    }
    
    render() {
        const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
        
        this.container.innerHTML = `
            <div class="tremor-chart w-full h-full flex items-center justify-center">
                <canvas id="${chartId}" class="max-w-full max-h-full"></canvas>
            </div>
        `;
        
        this.renderChart(chartId);
    }
    
    renderChart(chartId) {
        const canvas = document.getElementById(chartId);
        const ctx = canvas.getContext('2d');
        
        const processedData = this.processDataForChart();
        this.drawPieChart(ctx, processedData);
    }
    
    processDataForChart() {
        if (!Array.isArray(this.data)) return { segments: [] };
        
        const segments = [];
        let total = 0;
        
        this.data.forEach(item => {
            if (typeof item === 'object') {
                const keys = Object.keys(item);
                const labelKey = keys.find(k => typeof item[k] === 'string') || keys[0];
                const valueKey = keys.find(k => typeof item[k] === 'number') || keys[1];
                
                const value = item[valueKey] || 0;
                total += value;
                segments.push({
                    label: item[labelKey],
                    value: value
                });
            }
        });
        
        // Calculate percentages
        segments.forEach(segment => {
            segment.percentage = total > 0 ? (segment.value / total) * 100 : 0;
            segment.angle = total > 0 ? (segment.value / total) * Math.PI * 2 : 0;
        });
        
        return { segments, total };
    }
    
    drawPieChart(ctx, data) {
        const canvas = ctx.canvas;
        const containerRect = this.container.getBoundingClientRect();
        const size = Math.min(containerRect.width, containerRect.height) - 40;
        
        canvas.width = size;
        canvas.height = size;
        
        const { segments } = data;
        if (!segments.length) return;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        ctx.clearRect(0, 0, size, size);
        
        let currentAngle = this.options.startAngle;
        const colors = this.getColorPalette();
        
        // Draw segments
        segments.forEach((segment, index) => {
            const color = colors[index % colors.length];
            
            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segment.angle);
            ctx.closePath();
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = this.options.colors.surface;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw labels
            if (this.options.showLabels) {
                const labelAngle = currentAngle + segment.angle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
                const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
                
                ctx.fillStyle = this.options.colors.text;
                ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = labelX > centerX ? 'left' : 'right';
                ctx.textBaseline = 'middle';
                
                const label = this.options.showPercentages 
                    ? `${segment.label} (${segment.percentage.toFixed(1)}%)`
                    : segment.label;
                
                ctx.fillText(label, labelX, labelY);
            }
            
            currentAngle += segment.angle;
        });
    }
}

// ==========================================
// Donut Chart Component
// ==========================================

class DonutChart extends PieChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            innerRadius: 0.6,
            centerText: '',
            centerValue: '',
            ...options
        });
    }
    
    drawPieChart(ctx, data) {
        const canvas = ctx.canvas;
        const containerRect = this.container.getBoundingClientRect();
        const size = Math.min(containerRect.width, containerRect.height) - 40;
        
        canvas.width = size;
        canvas.height = size;
        
        const { segments } = data;
        if (!segments.length) return;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = Math.min(centerX, centerY) - 40;
        const innerRadius = outerRadius * this.options.innerRadius;
        
        ctx.clearRect(0, 0, size, size);
        
        let currentAngle = this.options.startAngle;
        const colors = this.getColorPalette();
        
        // Draw segments
        segments.forEach((segment, index) => {
            const color = colors[index % colors.length];
            
            // Draw donut slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + segment.angle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + segment.angle, currentAngle, true);
            ctx.closePath();
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = this.options.colors.surface;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += segment.angle;
        });
        
        // Draw center text
        if (this.options.centerText || this.options.centerValue) {
            ctx.fillStyle = this.options.colors.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (this.options.centerValue) {
                ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(this.options.centerValue, centerX, centerY - 10);
            }
            
            if (this.options.centerText) {
                ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(this.options.centerText, centerX, centerY + 15);
            }
        }
        
        // Draw labels (similar to pie chart)
        if (this.options.showLabels) {
            currentAngle = this.options.startAngle;
            segments.forEach((segment, index) => {
                const labelAngle = currentAngle + segment.angle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (outerRadius + 20);
                const labelY = centerY + Math.sin(labelAngle) * (outerRadius + 20);
                
                ctx.fillStyle = this.options.colors.text;
                ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = labelX > centerX ? 'left' : 'right';
                ctx.textBaseline = 'middle';
                
                const label = this.options.showPercentages 
                    ? `${segment.label} (${segment.percentage.toFixed(1)}%)`
                    : segment.label;
                
                ctx.fillText(label, labelX, labelY);
                currentAngle += segment.angle;
            });
        }
    }
}

// ==========================================
// Area Chart Component
// ==========================================

class AreaChart extends LineChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            showArea: true,
            showPoints: false,
            opacity: 0.6,
            ...options
        });
    }
}

// ==========================================
// Scatter Chart Component
// ==========================================

class ScatterChart extends BaseChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            pointSize: 4,
            showTrendLine: false,
            ...options
        });
        
        this.render();
    }
    
    render() {
        const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
        
        this.container.innerHTML = `
            <div class="tremor-chart w-full h-full">
                <canvas id="${chartId}" class="w-full h-full"></canvas>
            </div>
        `;
        
        this.renderChart(chartId);
    }
    
    renderChart(chartId) {
        const canvas = document.getElementById(chartId);
        const ctx = canvas.getContext('2d');
        
        const processedData = this.processDataForChart();
        this.drawScatterChart(ctx, processedData);
    }
    
    processDataForChart() {
        if (!Array.isArray(this.data)) return { points: [] };
        
        const points = [];
        
        this.data.forEach(item => {
            if (typeof item === 'object') {
                const keys = Object.keys(item);
                const xKey = keys.find(k => typeof item[k] === 'number') || keys[0];
                const yKey = keys.find(k => typeof item[k] === 'number' && k !== xKey) || keys[1];
                
                points.push({
                    x: item[xKey] || 0,
                    y: item[yKey] || 0,
                    label: item.label || `${item[xKey]}, ${item[yKey]}`
                });
            }
        });
        
        return { points };
    }
    
    drawScatterChart(ctx, data) {
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const { points } = data;
        
        if (!points.length) return;
        
        canvas.width = width;
        canvas.height = height;
        
        const padding = 60;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // Calculate scales
        const xValues = points.map(p => p.x);
        const yValues = points.map(p => p.y);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        if (this.options.showGrid) {
            this.drawGrid(ctx, width, height, padding, 5, 5);
        }
        
        // Draw points
        ctx.fillStyle = this.options.colors.primary;
        points.forEach(point => {
            const x = padding + ((point.x - minX) / rangeX) * chartWidth;
            const y = height - padding - ((point.y - minY) / rangeY) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, this.options.pointSize, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw trend line if enabled
        if (this.options.showTrendLine) {
            this.drawTrendLine(ctx, points, padding, chartWidth, chartHeight, height, minX, minY, rangeX, rangeY);
        }
        
        // Draw axes
        this.drawAxes(ctx, width, height, padding);
    }
    
    drawGrid(ctx, width, height, padding, xSteps, ySteps) {
        ctx.strokeStyle = this.options.colors.grid;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= xSteps; i++) {
            const x = padding + (i / xSteps) * (width - padding * 2);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        for (let i = 0; i <= ySteps; i++) {
            const y = padding + (i / ySteps) * (height - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
    }
    
    drawTrendLine(ctx, points, padding, chartWidth, chartHeight, height, minX, minY, rangeX, rangeY) {
        // Simple linear regression
        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + (p.x * p.y), 0);
        const sumXX = points.reduce((sum, p) => sum + (p.x * p.x), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Draw trend line
        ctx.strokeStyle = this.options.colors.secondary;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        const startX = padding;
        const endX = padding + chartWidth;
        const startY = height - padding - ((slope * minX + intercept - minY) / rangeY) * chartHeight;
        const endY = height - padding - ((slope * (minX + rangeX) + intercept - minY) / rangeY) * chartHeight;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawAxes(ctx, width, height, padding) {
        ctx.strokeStyle = this.options.colors.border;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
    }
}

// ==========================================
// Heatmap Chart Component
// ==========================================

class HeatmapChart extends BaseChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            colorScale: 'blue',
            showValues: false,
            cellPadding: 1,
            ...options
        });
        
        this.render();
    }
    
    render() {
        const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
        
        this.container.innerHTML = `
            <div class="tremor-chart w-full h-full">
                <canvas id="${chartId}" class="w-full h-full"></canvas>
            </div>
        `;
        
        this.renderChart(chartId);
    }
    
    renderChart(chartId) {
        const canvas = document.getElementById(chartId);
        const ctx = canvas.getContext('2d');
        
        const processedData = this.processDataForChart();
        this.drawHeatmap(ctx, processedData);
    }
    
    processDataForChart() {
        // Assume data is in matrix format or array of {x, y, value}
        if (!Array.isArray(this.data)) return { matrix: [], xLabels: [], yLabels: [] };
        
        // Convert to matrix format
        const matrix = [];
        const xLabels = [];
        const yLabels = [];
        
        // This is a simplified implementation
        // In a real scenario, you'd have more sophisticated data processing
        
        return { matrix, xLabels, yLabels };
    }
    
    drawHeatmap(ctx, data) {
        // Heatmap implementation would go here
        // This is a placeholder for the complex heatmap rendering logic
        
        const canvas = ctx.canvas;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.fillStyle = this.options.colors.text;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Heatmap Chart', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Implementation coming soon', canvas.width / 2, canvas.height / 2 + 20);
    }
}

// ==========================================
// Treemap Chart Component
// ==========================================

class TreemapChart extends BaseChart {
    constructor(container, data, options = {}) {
        super(container, data, {
            showLabels: true,
            padding: 2,
            ...options
        });
        
        this.render();
    }
    
    render() {
        const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
        
        this.container.innerHTML = `
            <div class="tremor-chart w-full h-full">
                <canvas id="${chartId}" class="w-full h-full"></canvas>
            </div>
        `;
        
        this.renderChart(chartId);
    }
    
    renderChart(chartId) {
        const canvas = document.getElementById(chartId);
        const ctx = canvas.getContext('2d');
        
        // Treemap implementation placeholder
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.fillStyle = this.options.colors.text;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Treemap Chart', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Implementation coming soon', canvas.width / 2, canvas.height / 2 + 20);
    }
}

// ==========================================
// Export Classes
// ==========================================

if (typeof window !== 'undefined') {
    window.BarChart = BarChart;
    window.LineChart = LineChart;
    window.PieChart = PieChart;
    window.DonutChart = DonutChart;
    window.AreaChart = AreaChart;
    window.ScatterChart = ScatterChart;
    window.HeatmapChart = HeatmapChart;
    window.TreemapChart = TreemapChart;
}

export { 
    BarChart, 
    LineChart, 
    PieChart, 
    DonutChart, 
    AreaChart, 
    ScatterChart, 
    HeatmapChart, 
    TreemapChart 
};
