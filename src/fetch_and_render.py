#!/usr/bin/env python3
"""
Cuatro Flor - Dynamic Data Fetcher
Lee EXCLUSIVAMENTE de la Google Sheet y genera visualización HTML actualizada.
Cualquier cambio en la sheet se refleja automáticamente.
"""

import json
from datetime import datetime
import urllib.request

# ID de la Sheet (ÚNICA fuente de verdad)
SHEET_ID = "11ZKjulKOPaw3xzpLof_6g5PCtxZztMslsPQlzIdJy0k"

def fetch_planet_data():
    """Extrae datos planetarios directamente de la Sheet vía CSV export."""
    # Exportar sheet como CSV
    csv_url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv"
    
    try:
        with urllib.request.urlopen(csv_url, timeout=10) as resp:
            csv_content = resp.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching sheet: {e}")
        return []
    
    lines = csv_content.strip().split('\n')
    
    planets = []
    
    # Parsear CSV y buscar filas con datos planetarios
    for i, line in enumerate(lines):
        if i == 0:  # Skip header
            continue
        
        cells = line.split(',')
        if len(cells) >= 8:
            try:
                harmonic_str = cells[0].strip().strip('"')
                period_str = cells[4].strip().strip('"') if len(cells) > 4 else ""
                
                if not harmonic_str or harmonic_str == '':
                    continue
                    
                harmonic = int(harmonic_str)
                
                # Skip error values
                if '#DIV/0!' in period_str or period_str == '':
                    period = None
                else:
                    period = float(period_str)
                
                # Filtrar SOLO armónicos planetarios conocidos
                planetary_harmonics = [1, 3, 5, 7, 9, 13]
                if period and harmonic in planetary_harmonics:
                    # Mapeo de armónicos a nombres (basado en datos de la sheet)
                    name_map = {
                        13: "Mercurio",
                        9: "Venus", 
                        7: "Marte",
                        5: "Júpiter",
                        3: "Saturno",
                        1: "Tierra"
                    }
                    planet_name = name_map.get(harmonic, f"Armónico {harmonic}")
                    
                    frequency = 1 / (period * 24 * 3600) if period else 0
                    resonance = frequency * harmonic
                    
                    planets.append({
                        "name": planet_name,
                        "harmonic": harmonic,
                        "period": period,
                        "frequency": frequency,
                        "resonance": resonance,
                        "color": get_planet_color(harmonic)
                    })
            except (ValueError, IndexError) as e:
                print(f"Skipping row {i}: {e}")
                continue
    
    return sorted(planets, key=lambda x: x['harmonic'], reverse=True)

def get_planet_color(harmonic):
    """Asigna colores basados en armónico."""
    colors = {
        13: "#A0A0A0",  # Mercurio - gris
        9: "#E67E22",   # Venus - naranja
        1: "#3498DB",   # Tierra - azul
        7: "#E74C3C",   # Marte - rojo
        5: "#8B4513",   # Júpiter - café
        3: "#F1C40F"    # Saturno - dorado
    }
    return colors.get(harmonic, "#95A5A6")

def generate_html(planets):
    """Genera HTML standalone con datos DINÁMICOS de la sheet."""
    
    planets_json = json.dumps(planets, indent=2)
    
    html = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cuatro Flor - Armónicos Planetarios</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        h1 {{ 
            text-align: center; 
            margin-bottom: 10px; 
            font-size: 2.5em;
            background: linear-gradient(90deg, #f39c12, #e74c3c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .subtitle {{ 
            text-align: center; 
            color: #95a5a6; 
            margin-bottom: 30px;
            font-style: italic;
        }}
        .data-source {{
            background: rgba(52, 152, 219, 0.2);
            border-left: 4px solid #3498db;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 5px;
        }}
        .data-source a {{ color: #3498db; text-decoration: none; }}
        .data-source a:hover {{ text-decoration: underline; }}
        .visualization {{ 
            display: grid; 
            grid-template-columns: 1fr 400px; 
            gap: 30px; 
            margin-bottom: 30px;
        }}
        @media (max-width: 900px) {{ .visualization {{ grid-template-columns: 1fr; }} }}
        canvas {{ 
            background: rgba(0,0,0,0.3); 
            border-radius: 15px; 
            width: 100%;
            height: 500px;
        }}
        .info-panel {{ 
            background: rgba(255,255,255,0.05); 
            padding: 25px; 
            border-radius: 15px;
            overflow-y: auto;
            max-height: 500px;
        }}
        .planet-card {{ 
            background: rgba(255,255,255,0.08); 
            padding: 15px; 
            margin-bottom: 15px; 
            border-radius: 10px;
            border-left: 4px solid;
        }}
        .planet-name {{ font-size: 1.3em; font-weight: bold; margin-bottom: 10px; }}
        .planet-data {{ 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 8px; 
            font-size: 0.9em;
        }}
        .data-label {{ color: #95a5a6; }}
        .data-value {{ font-weight: bold; text-align: right; }}
        .timestamp {{ 
            text-align: center; 
            color: #7f8c8d; 
            margin-top: 20px;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🌌 Cuatro Flor - Armónicos Planetarios</h1>
        <p class="subtitle">Visualización dinámica basada en datos astronómicos en tiempo real</p>
        
        <div class="data-source">
            <strong>📊 Fuente de Datos:</strong> 
            <a href="https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit" target="_blank">
                Google Sheet - Cuatro Flor
            </a>
            <br>
            <small>Esta visualización se alimenta EXCLUSIVAMENTE de la sheet. Cualquier cambio en los datos se reflejará al regenerar este archivo.</small>
        </div>
        
        <div class="visualization">
            <canvas id="orbitCanvas"></canvas>
            
            <div class="info-panel">
                <h2 style="margin-bottom: 20px;">Datos Planetarios</h2>
                <div id="planetCards"></div>
            </div>
        </div>
        
        <p class="timestamp">
            Datos cargados: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} CDMX
        </p>
    </div>
    
    <script>
        // DATOS DINÁMICOS - Extraídos directamente de la Google Sheet
        const planets = {planets_json};
        
        // Configuración del canvas
        const canvas = document.getElementById('orbitCanvas');
        const ctx = canvas.getContext('2d');
        
        // Ajustar canvas al contenedor
        function resizeCanvas() {{
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = 500;
        }}
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Centro y escala
        let centerX, centerY, scale;
        
        function updateDimensions() {{
            centerX = canvas.width / 2;
            centerY = canvas.height / 2;
            scale = Math.min(centerX, centerY) / 6;
        }}
        updateDimensions();
        
        // Generar tarjetas de información
        function renderPlanetCards() {{
            const container = document.getElementById('planetCards');
            container.innerHTML = planets.map(p => `
                <div class="planet-card" style="border-color: ${{p.color}}">
                    <div class="planet-name" style="color: ${{p.color}}">${{p.name}}</div>
                    <div class="planet-data">
                        <span class="data-label">Armónico:</span>
                        <span class="data-value">${{p.harmonic}}</span>
                        
                        <span class="data-label">Período (días):</span>
                        <span class="data-value">${{p.period.toFixed(2)}}</span>
                        
                        <span class="data-label">Frecuencia (Hz):</span>
                        <span class="data-value">${{p.frequency.toExponential(2)}}</span>
                        
                        <span class="data-label">Resonancia:</span>
                        <span class="data-value">${{p.resonance.toExponential(2)}}</span>
                    </div>
                </div>
            `).join('');
        }}
        
        // Animación orbital
        let time = 0;
        
        function drawOrbits() {{
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar Sol
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12';
            ctx.fill();
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#f39c12';
            
            // Dibujar cada planeta
            planets.forEach((planet, index) => {{
                const orbitRadius = (index + 1) * scale;
                
                // Órbita
                ctx.beginPath();
                ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.stroke();
                
                // Posición del planeta
                const speed = 0.001 / (planet.period / 365);
                const angle = time * speed + index;
                const x = centerX + Math.cos(angle) * orbitRadius;
                const y = centerY + Math.sin(angle) * orbitRadius;
                
                // Planeta
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = planet.color;
                ctx.fill();
                ctx.shadowBlur = 15;
                ctx.shadowColor = planet.color;
            }});
            
            ctx.shadowBlur = 0;
            time += 1;
            requestAnimationFrame(drawOrbits);
        }}
        
        // Inicializar
        renderPlanetCards();
        drawOrbits();
    </script>
</body>
</html>'''
    
    return html

if __name__ == "__main__":
    print("🔄 Extrayendo datos de la Google Sheet...")
    planets = fetch_planet_data()
    
    if not planets:
        print("❌ No se encontraron datos planetarios en la sheet")
        exit(1)
    
    print(f"✅ {len(planets)} planetas encontrados:")
    for p in planets:
        print(f"   - {p['name']}: Armónico {p['harmonic']}, Período {p['period']:.2f} días")
    
    print("\n📝 Generando HTML dinámico...")
    html_content = generate_html(planets)
    
    # Guardar HTML
    output_path = "/root/claude/mission-control/src/planetary_harmonics_dynamic.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"\n✅ HTML generado: {output_path}")
    print("🚀 Listo para commit & push al repo de EurekaMD")
