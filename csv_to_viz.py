#!/usr/bin/env python3
"""
CSV to Visualization Generator - Genérico y Universal

Este script:
1. Recibe una URL de Google Sheet publicado como CSV
2. Descarga el CSV completo
3. Genera un HTML autocontenido con TODOS los datos embebidos como JSON
4. El HTML renderiza:
   - Tabla completa con TODAS las columnas y filas
   - Gráficas automáticas para columnas numéricas
5. NO sabe qué tipo de datos son — funciona para cualquier cosa

Uso:
    python csv_to_viz.py "https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv"
"""

import sys
import csv
import json
import io
from pathlib import Path
import urllib.request


def download_csv(url: str) -> list[list[str]]:
    """Descarga el CSV desde la URL y lo parsea."""
    with urllib.request.urlopen(url, timeout=30) as response:
        content = response.read().decode('utf-8')
    
    reader = csv.reader(io.StringIO(content))
    return list(reader)


def is_numeric(value: str) -> bool:
    """Verifica si un valor es numérico."""
    try:
        float(value.replace(',', '').replace('$', '').replace('%', ''))
        return True
    except (ValueError, AttributeError):
        return False


def analyze_columns(rows: list[list[str]]) -> dict:
    """Analiza las columnas para identificar cuáles son numéricas."""
    if not rows or len(rows) < 2:
        return {"headers": [], "numeric_cols": [], "data": []}
    
    headers = rows[0]
    data_rows = rows[1:]
    
    numeric_cols = []
    for col_idx in range(len(headers)):
        # Verificar si al menos 70% de los valores en esta columna son numéricos
        numeric_count = 0
        total_count = 0
        for row in data_rows:
            if col_idx < len(row):
                value = row[col_idx].strip()
                if value:  # No contar celdas vacías
                    total_count += 1
                    if is_numeric(value):
                        numeric_count += 1
        
        if total_count > 0 and (numeric_count / total_count) >= 0.7:
            numeric_cols.append(col_idx)
    
    return {
        "headers": headers,
        "numeric_cols": numeric_cols,
        "data": data_rows
    }


def generate_html(data: dict, output_path: str):
    """Genera el HTML autocontenido con los datos embebidos."""
    
    html_template = '''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualización de Datos - CSV Export</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        header p {
            opacity: 0.9;
            font-size: 0.95em;
        }
        .info-bar {
            background: #f8f9fa;
            padding: 15px 30px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .info-bar span {
            color: #495057;
            font-size: 0.9em;
        }
        .stats {
            display: flex;
            gap: 20px;
        }
        .stat-item {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .section-title {
            font-size: 1.5em;
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        .table-container {
            overflow-x: auto;
            margin-bottom: 40px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        th {
            background: #667eea;
            color: white;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        tr:hover {
            background: #f8f9fa;
        }
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        tr:nth-child(even):hover {
            background: #e9ecef;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .chart-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .chart-container h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.1em;
            text-align: center;
        }
        .chart-wrapper {
            position: relative;
            height: 300px;
        }
        .no-charts {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-size: 1.1em;
        }
        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            header h1 {
                font-size: 1.5em;
            }
            .info-bar {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Visualización de Datos</h1>
            <p>Generado automáticamente desde Google Sheets</p>
        </header>
        
        <div class="info-bar">
            <span id="timestamp"></span>
            <div class="stats">
                <span class="stat-item" id="rows-count">0 filas</span>
                <span class="stat-item" id="cols-count">0 columnas</span>
                <span class="stat-item" id="numeric-count">0 numéricas</span>
            </div>
        </div>
        
        <div class="content">
            <h2 class="section-title">📋 Tabla Completa de Datos</h2>
            <div class="table-container">
                <table id="data-table">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
            
            <h2 class="section-title">📈 Gráficas Automáticas (Columnas Numéricas)</h2>
            <div id="charts-area" class="charts-grid"></div>
        </div>
    </div>
    
    <script>
        // Datos embebidos desde Python
        const embeddedData = __EMBEDDED_JSON__;
        
        // Actualizar timestamp
        document.getElementById('timestamp').textContent = 
            'Cargado: ' + new Date().toLocaleString('es-MX');
        
        // Renderizar tabla
        function renderTable() {
            const thead = document.querySelector('#data-table thead');
            const tbody = document.querySelector('#data-table tbody');
            
            // Headers
            const headerRow = document.createElement('tr');
            embeddedData.headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header || '(Sin nombre)';
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            
            // Data rows
            embeddedData.data.forEach(row => {
                const tr = document.createElement('tr');
                embeddedData.headers.forEach((_, idx) => {
                    const td = document.createElement('td');
                    td.textContent = row[idx] || '';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            
            // Actualizar stats
            document.getElementById('rows-count').textContent = embeddedData.data.length + ' filas';
            document.getElementById('cols-count').textContent = embeddedData.headers.length + ' columnas';
            document.getElementById('numeric-count').textContent = embeddedData.numeric_cols.length + ' numéricas';
        }
        
        // Renderizar gráficas
        function renderCharts() {
            const chartsArea = document.getElementById('charts-area');
            
            if (embeddedData.numeric_cols.length === 0) {
                chartsArea.innerHTML = '<div class="no-charts">No se detectaron columnas numéricas para graficar.</div>';
                return;
            }
            
            embeddedData.numeric_cols.forEach(colIdx => {
                const colName = embeddedData.headers[colIdx] || `Columna ${colIdx + 1}`;
                
                const chartContainer = document.createElement('div');
                chartContainer.className = 'chart-container';
                
                const title = document.createElement('h3');
                title.textContent = colName;
                chartContainer.appendChild(title);
                
                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'chart-wrapper';
                
                const canvas = document.createElement('canvas');
                chartWrapper.appendChild(canvas);
                chartContainer.appendChild(chartWrapper);
                chartsArea.appendChild(chartContainer);
                
                // Preparar datos para la gráfica
                const labels = [];
                const data = [];
                
                embeddedData.data.forEach((row, rowIdx) => {
                    // Usar primera columna como label si existe, sino usar índice
                    const label = row[0] || `Fila ${rowIdx + 1}`;
                    labels.push(label);
                    
                    let value = row[colIdx] || '0';
                    value = parseFloat(value.replace(/,/g, '').replace(/\\$/g, '').replace(/%/g, ''));
                    data.push(isNaN(value) ? 0 : value);
                });
                
                // Crear gráfica
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: colName,
                            data: data,
                            backgroundColor: 'rgba(102, 126, 234, 0.6)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 2,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    maxRotation: 45,
                                    minRotation: 45
                                }
                            }
                        }
                    }
                });
            });
        }
        
        // Inicializar
        document.addEventListener('DOMContentLoaded', () => {
            renderTable();
            renderCharts();
        });
    </script>
</body>
</html>'''
    
    # Reemplazar placeholder con datos JSON
    json_data = json.dumps(data, ensure_ascii=False, indent=2)
    html_content = html_template.replace('__EMBEDDED_JSON__', json_data)
    
    # Escribir archivo HTML
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return output_path


def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python csv_to_viz.py \"<Google Sheet CSV URL>\"")
        print("\nEjemplo:")
        print('  python csv_to_viz.py "https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv"')
        sys.exit(1)
    
    csv_url = sys.argv[1]
    
    print(f"📥 Descargando CSV desde: {csv_url[:80]}...")
    
    try:
        # Descargar CSV
        rows = download_csv(csv_url)
        print(f"✅ CSV descargado: {len(rows)} filas totales")
        
        # Analizar columnas
        data = analyze_columns(rows)
        print(f"📊 Columnas detectadas: {len(data['headers'])}")
        print(f"📈 Columnas numéricas: {len(data['numeric_cols'])}")
        print(f"   Índices: {data['numeric_cols']}")
        
        # Generar HTML
        output_dir = Path(__file__).parent / 'output'
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / 'visualization.html'
        generate_html(data, str(output_file))
        
        print(f"\n✅ HTML generado exitosamente!")
        print(f"📁 Archivo: {output_file.absolute()}")
        print(f"\nAbre el archivo en tu navegador para ver la visualización.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
