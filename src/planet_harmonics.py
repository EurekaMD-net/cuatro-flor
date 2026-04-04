#!/usr/bin/env python3
"""
Cuatro Flor - Planet Harmonics Calculator
Reproduces the calculations from the base spreadsheet.

Usage: python3 planet_harmonics.py
Output: Prints table to console and saves CSV to same directory.
"""

import csv
import os
from datetime import datetime

# Base data extracted from Cuatro Flor spreadsheet concept
# Planet, Orbital Period (days), Base Harmonic
PLANET_DATA = [
    {"name": "Mercurio", "period_days": 87.97, "harmonic": 13},
    {"name": "Venus", "period_days": 224.70, "harmonic": 9},
    {"name": "Tierra", "period_days": 365.25, "harmonic": 1},
    {"name": "Marte", "period_days": 686.98, "harmonic": 7},
    {"name": "Jupiter", "period_days": 4332.59, "harmonic": 5},
    {"name": "Saturno", "period_days": 10759.22, "harmonic": 3},
]

def calculate_frequency(period_days: float) -> float:
    """Calculate frequency in Hz from orbital period in days."""
    seconds = period_days * 24 * 3600
    return 1 / seconds if seconds > 0 else 0

def calculate_resonance(frequency: float, harmonic: int) -> float:
    """Calculate resonance value."""
    return frequency * harmonic

def calculate_cycles_completed(period_days: float, elapsed_days: float = 365.25) -> float:
    """Calculate how many cycles completed in given time."""
    return elapsed_days / period_days if period_days > 0 else 0

def main():
    print("=" * 80)
    print("CUATRO FLOR - PLANET HARMONICS CALCULATOR")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Header
    header = f"{'Planeta':<12} {'Periodo (d)':<12} {'Armónico':<10} {'Frecuencia (Hz)':<18} {'Resonancia':<15} {'Ciclos/año':<10}"
    print(header)
    print("-" * 80)
    
    results = []
    
    for planet in PLANET_DATA:
        name = planet["name"]
        period = planet["period_days"]
        harmonic = planet["harmonic"]
        
        freq = calculate_frequency(period)
        resonance = calculate_resonance(freq, harmonic)
        cycles = calculate_cycles_completed(period)
        
        row = f"{name:<12} {period:<12.2f} {harmonic:<10} {freq:<18.2e} {resonance:<15.2e} {cycles:<10.2f}"
        print(row)
        
        results.append({
            "planeta": name,
            "periodo_dias": period,
            "harmonico": harmonic,
            "frecuencia_hz": freq,
            "resonancia": resonance,
            "ciclos_completados": cycles
        })
    
    print("-" * 80)
    print(f"Total planets processed: {len(results)}")
    
    # Save to CSV in same directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, "output_harmonics.csv")
    
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["planeta", "periodo_dias", "harmonico", "frecuencia_hz", "resonancia", "ciclos_completados"])
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\n✅ Results saved to: {output_file}")
    return results

if __name__ == "__main__":
    main()
