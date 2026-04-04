// Visualizador de Harmónicos Planetarios
class PlanetaryHarmonicsVisualizer {
    constructor() {
        this.canvas = document.getElementById('harmonicsCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    draw(harmonics) {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) * 0.4;
        
        // Dibujar círculos concéntricos
        for (let i = 1; i <= 5; i++) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#333';
            this.ctx.stroke();
        }
        
        // Dibujar armónicos
        const planets = Object.keys(harmonics);
        const angleStep = (Math.PI * 2) / planets.length;
        
        planets.forEach((planet, i) => {
            const angle = i * angleStep;
            const frequency = harmonics[planet];
            const radius = (frequency / 1000) * maxRadius; // Escalar frecuencia
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Dibujar línea desde el centro
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(x, y);
            this.ctx.strokeStyle = this.getPlanetColor(planet);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Dibujar círculo del planeta
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = this.getPlanetColor(planet);
            this.ctx.fill();
            
            // Etiqueta
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(planet, x + 10, y);
        });
    }

    getPlanetColor(planet) {
        const colors = {
            'Sun': '#FFD700',
            'Moon': '#C0C0C0',
            'Mercury': '#A9A9A9',
            'Venus': '#FFE4B5',
            'Mars': '#FF4500',
            'Jupiter': '#FFA500',
            'Saturn': '#F0E68C',
            'Uranus': '#40E0D0',
            'Neptune': '#4169E1',
            'Pluto': '#A9A9A9'
        };
        return colors[planet] || '#FFFFFF';
    }
}