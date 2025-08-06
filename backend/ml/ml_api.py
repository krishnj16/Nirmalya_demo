from flask import Flask, request, jsonify
import pandas as pd
import pickle
import shap
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the pre-trained model
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

# Load the list of feature names the model was trained on
with open("features.pkl", "rb") as f:
    model_features = pickle.load(f)

# Load the original training data (only features, no target)
try:
    train_df = pd.read_csv("trash_rewards_dataset.csv")
    train_df = train_df.drop(columns=["reward"])
except FileNotFoundError:
    print("Error: 'trash_rewards_dataset.csv' not found. Please ensure it's in the correct directory.")
    # UPDATED to include citizen_type
    train_df = pd.DataFrame(columns=['trash_type', 'weight_kg', 'location_type', 'citizen_type', 'area_dirtiness_level'])


@app.route('/predict-reward', methods=['POST'])
def predict_reward():
    """
    Predicts a reward based on input data and explains the prediction.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input: No JSON data received."}), 400

    try:
        # --- Data Preparation ---
        full_df = pd.concat([train_df, pd.DataFrame([data])], ignore_index=True)
        full_encoded = pd.get_dummies(full_df)
        final_df = full_encoded.reindex(columns=model_features, fill_value=0)
        final_df = final_df.fillna(0)
        input_row = final_df.tail(1)

        # Explicitly convert the entire input row to a numeric data type (float64).
        input_row = input_row.astype('float64')

        # --- Prediction ---
        prediction = model.predict(input_row)[0]

        # --- Explanation with SHAP ---
        background_data = final_df.drop(index=input_row.index).astype('float64')
        explainer = shap.Explainer(model, background_data)
        shap_values = explainer(input_row)
        
        impact = sorted(zip(model_features, shap_values.values[0]), key=lambda x: abs(x[1]), reverse=True)[:5]
        explanation = [{"feature": k, "impact": round(v, 2)} for k, v in impact]

        # --- Return Response ---
        return jsonify({
            "predicted_reward": round(float(prediction), 2),
            "top_factors": explanation
        })
    except Exception as e:
        # Generic error handling to catch any other issues
        print(f"An error occurred: {e}")
        return jsonify({"error": "An internal error occurred during prediction."}), 500


if __name__ == "__main__":
    app.run(debug=True)
