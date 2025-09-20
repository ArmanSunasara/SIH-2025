# Simple test data for water quality prediction
import pandas as pd
import numpy as np

# Create sample water quality data
np.random.seed(42)
n_samples = 1000

# Generate realistic water quality parameters
data = {
    'ph': np.random.normal(7.0, 0.8, n_samples),
    'Hardness': np.random.normal(180, 50, n_samples),
    'Solids': np.random.normal(20000, 5000, n_samples),
    'Chloramines': np.random.normal(7, 2, n_samples),
    'Sulfate': np.random.normal(300, 100, n_samples),
    'Conductivity': np.random.normal(400, 100, n_samples),
    'Organic_carbon': np.random.normal(14, 4, n_samples),
    'Trihalomethanes': np.random.normal(70, 20, n_samples),
    'Turbidity': np.random.normal(4, 2, n_samples)
}

# Create potability labels based on water quality standards
df = pd.DataFrame(data)

# Simple rules for potability (1 = safe, 0 = not safe)
potability = []
for _, row in df.iterrows():
    safe = 1
    # pH should be between 6.5 and 8.5
    if row['ph'] < 6.5 or row['ph'] > 8.5:
        safe = 0
    # Turbidity should be low
    if row['Turbidity'] > 5.0:
        safe = 0
    # Add some randomness
    if np.random.random() < 0.1:
        safe = 1 - safe
    
    potability.append(safe)

df['Potability'] = potability

# Save to CSV
df.to_csv('water_potability.csv', index=False)
print(f\"Generated {n_samples} water quality samples\")
print(f\"Safe water samples: {sum(potability)}\")
print(f\"Unsafe water samples: {len(potability) - sum(potability)}\")
print(\"Dataset saved as water_potability.csv\")