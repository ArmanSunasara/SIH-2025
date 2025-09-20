# train_model.py

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Create ml directory if it doesn't exist
os.makedirs("ml", exist_ok=True)

# Load dataset
try:
    df = pd.read_csv("water_potability.csv")
    print("✅ Dataset loaded successfully!")
except FileNotFoundError:
    print("❌ Error: water_potability.csv not found!")
    print("Please make sure the dataset file is in the same directory.")
    exit(1)

# Handle missing values (fill with mean)
df = df.fillna(df.mean())
print(f"📊 Dataset shape: {df.shape}")

# Features (X) and target (y)
X = df.drop("Potability", axis=1)
y = df["Potability"]

print(f"Features: {list(X.columns)}")
print(f"Target distribution: {y.value_counts().to_dict()}")

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
print("🔄 Training model...")
model.fit(X_train_scaled, y_train)

# Evaluate model
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model trained successfully!")
print(f"🎯 Test Accuracy: {accuracy:.4f}")
print("\n📈 Classification Report:")
print(classification_report(y_test, y_pred))

# Save model and scaler to ml folder
model_path = os.path.join("ml", "model.pkl")
scaler_path = os.path.join("ml", "scaler.pkl")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)

print(f"💾 Model saved to: {model_path}")
print(f"💾 Scaler saved to: {scaler_path}")
print("✅ Training completed successfully!")