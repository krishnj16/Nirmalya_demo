import pandas as pd
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

# Load dataset
try:
    df = pd.read_csv("trash_rewards_dataset.csv")
except FileNotFoundError:
    print("Error: 'trash_rewards_dataset.csv' not found. Please ensure it's in the correct directory.")
    exit()

# --- Data Preparation ---
X = df.drop(columns=["reward"])
y = df["reward"]
X_encoded = pd.get_dummies(X)

# --- 1. Split the Data ---
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")

# --- 2. Train the Model ---
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# --- 3. Test the Model ---
y_pred = model.predict(X_test)

# --- 4. Evaluate the Results ---
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print("\n--- Model Evaluation Results ---")
print(f"R-squared (R²): {r2:.4f}")
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print("--------------------------------\n")

# --- Final Step: Retrain on Full Data and Save ---
final_model = RandomForestRegressor(n_estimators=100, random_state=42)
final_model.fit(X_encoded, y)

with open("model.pkl", "wb") as f:
    pickle.dump(final_model, f)

with open("features.pkl", "wb") as f:
    pickle.dump(X_encoded.columns.tolist(), f)

print("✅ Final model (RandomForestRegressor) trained on full dataset and saved.")
