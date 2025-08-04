# from flask import Flask, request, jsonify
# import pandas as pd
# import pickle
# import shap
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # Load the pre-trained model
# with open("model.pkl", "rb") as f:
#     model = pickle.load(f)

# # Load the list of feature names the model was trained on
# with open("features.pkl", "rb") as f:
#     model_features = pickle.load(f)

# # Load the original training data (only features, no target)
# try:
#     train_df = pd.read_csv("trash_rewards_dataset.csv")
#     train_df = train_df.drop(columns=["reward"])
# except FileNotFoundError:
#     print("Error: 'trash_rewards_dataset.csv' not found. Please ensure it's in the correct directory.")
#     # UPDATED to include citizen_type
#     train_df = pd.DataFrame(columns=['trash_type', 'weight_kg', 'location_type', 'citizen_type', 'area_dirtiness_level'])


# @app.route('/predict-reward', methods=['POST'])
# def predict_reward():
#     """
#     Predicts a reward based on input data and explains the prediction.
#     """
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "Invalid input: No JSON data received."}), 400

#     try:
#         # --- Data Preparation ---
#         full_df = pd.concat([train_df, pd.DataFrame([data])], ignore_index=True)
#         full_encoded = pd.get_dummies(full_df)
#         final_df = full_encoded.reindex(columns=model_features, fill_value=0)
#         final_df = final_df.fillna(0)
#         input_row = final_df.tail(1)

#         # Explicitly convert the entire input row to a numeric data type (float64).
#         input_row = input_row.astype('float64')

#         # --- Prediction ---
#         prediction = model.predict(input_row)[0]

#         # --- Explanation with SHAP ---
#         background_data = final_df.drop(index=input_row.index).astype('float64')
#         explainer = shap.Explainer(model, background_data)
#         shap_values = explainer(input_row)
        
#         impact = sorted(zip(model_features, shap_values.values[0]), key=lambda x: abs(x[1]), reverse=True)[:5]
#         explanation = [{"feature": k, "impact": round(v, 2)} for k, v in impact]

#         # --- Return Response ---
#         return jsonify({
#             "predicted_reward": round(float(prediction), 2),
#             "top_factors": explanation
#         })
#     except Exception as e:
#         # Generic error handling to catch any other issues
#         print(f"An error occurred: {e}")
#         return jsonify({"error": "An internal error occurred during prediction."}), 500


# if __name__ == "__main__":
#     app.run(debug=True)

from flask import Flask, request, jsonify
import pandas as pd
import pickle
import shap
from flask_cors import CORS
from web3 import Web3
import json # To load ABI

app = Flask(__name__)
CORS(app)

# --- Load ML Model and Features (Existing Code) ---
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

with open("features.pkl", "rb") as f:
    model_features = pickle.load(f)

try:
    train_df = pd.read_csv("trash_rewards_dataset.csv")
    train_df = train_df.drop(columns=["reward"])
except FileNotFoundError:
    print("Error: 'trash_rewards_dataset.csv' not found. Please ensure it's in the correct directory.")
    train_df = pd.DataFrame(columns=['trash_type', 'weight_kg', 'location_type', 'citizen_type', 'area_dirtiness_level'])

# --- Web3 Configuration (NEW) ---
# Replace with your actual Infura/Alchemy URL or local Ganache URL
# For Sepolia testnet, use a Sepolia RPC URL from Infura/Alchemy
WEB3_PROVIDER_URL = "YOUR_ETHEREUM_NODE_RPC_URL" # e.g., "http://127.0.0.1:7545" for Ganache, or Infura/Alchemy Sepolia URL
web3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))

# Check connection
if not web3.is_connected():
    print("Error: Not connected to Ethereum node!")
    exit()
else:
    print(f"Connected to Ethereum node: {WEB3_PROVIDER_URL}")

# Replace with your deployed contract address
CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS" # e.g., "0x..."

# Load your contract's ABI (Application Binary Interface)
# You get this from Remix after compiling your contract.
# In Remix, go to the 'Compile' tab, then click the 'ABI' button to copy it.
# Paste it into a file named 'GarbageRewardSystem_abi.json' in your backend directory.
try:
    with open("GarbageRewardSystem_abi.json", "r") as f:
        CONTRACT_ABI = json.load(f)
except FileNotFoundError:
    print("Error: 'GarbageRewardSystem_abi.json' not found. Please generate and place it in the backend directory.")
    exit()

# Instantiate the contract object
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Replace with the private key of the account that will send transactions
# This account MUST have enough ETH to pay for gas.
# NEVER expose this in a public repository or production environment without proper security measures.
SENDER_PRIVATE_KEY = "YOUR_SENDER_ACCOUNT_PRIVATE_KEY" # e.g., "0x..."
SENDER_ACCOUNT = web3.eth.account.from_key(SENDER_PRIVATE_KEY)
print(f"Transaction sender account: {SENDER_ACCOUNT.address}")


@app.route('/predict-and-store-reward', methods=['POST'])
def predict_and_store_reward():
    """
    Predicts a reward based on input data, explains the prediction,
    and stores the data on the blockchain.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input: No JSON data received."}), 400

    try:
        # --- Data Preparation (Existing Code) ---
        full_df = pd.concat([train_df, pd.DataFrame([data])], ignore_index=True)
        full_encoded = pd.get_dummies(full_df)
        final_df = full_encoded.reindex(columns=model_features, fill_value=0)
        final_df = final_df.fillna(0)
        input_row = final_df.tail(1)
        input_row = input_row.astype('float64')

        # --- Prediction (Existing Code) ---
        prediction = model.predict(input_row)[0]
        predicted_reward = round(float(prediction), 2)

        # --- Explanation with SHAP (Existing Code) ---
        background_data = final_df.drop(index=input_row.index).astype('float64')
        explainer = shap.Explainer(model, background_data)
        shap_values = explainer(input_row)
        impact = sorted(zip(model_features, shap_values.values[0]), key=lambda x: abs(x[1]), reverse=True)[:5]
        explanation = [{"feature": k, "impact": round(v, 2)} for k, v in impact]

        # --- Store Data on Blockchain (NEW) ---
        # Extract data for smart contract call
        _trashType = data.get('trash_type')
        _weightKg = int(data.get('weight_kg')) # Ensure integer
        _locationType = data.get('location_type')
        _citizenType = data.get('citizen_type')
        _areaDirtinessLevel = int(data.get('area_dirtiness_level')) # Ensure integer
        _rewardAmount = int(predicted_reward) # Convert float reward to integer for Solidity

        # Build the transaction
        transaction = contract.functions.submitGarbage(
            _trashType,
            _weightKg,
            _locationType,
            _citizenType,
            _areaDirtinessLevel,
            _rewardAmount
        ).build_transaction({
            'from': SENDER_ACCOUNT.address,
            'nonce': web3.eth.get_transaction_count(SENDER_ACCOUNT.address),
            'gasPrice': web3.eth.gas_price # Or web3.to_wei('gwei_value', 'gwei')
            # 'gas': 2000000 # Optional: set a higher gas limit if needed
        })

        # Sign the transaction
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key=SENDER_PRIVATE_KEY)

        # Send the transaction
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        print(f"Transaction sent! Hash: {tx_hash.hex()}")
        print(f"Transaction receipt: {tx_receipt}")

        # You can also read data from the contract after storing, e.g., the submission ID
        # This requires parsing the event from the receipt or calling a view function.
        # For simplicity, we'll just return the tx hash.
        # If you want the submissionId, you'd need to parse the 'GarbageSubmitted' event from tx_receipt.logs

        return jsonify({
            "predicted_reward": predicted_reward,
            "top_factors": explanation,
            "blockchain_tx_hash": tx_hash.hex(),
            "blockchain_tx_status": tx_receipt.status # 1 for success, 0 for failure
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": f"An internal error occurred during prediction or blockchain interaction: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)

