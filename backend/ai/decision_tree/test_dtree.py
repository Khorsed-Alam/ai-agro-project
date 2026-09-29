import os
import joblib
import pandas as pd


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    CURRENT_DIR,
    "decision_tree_model.pkl",
)


# Load trained model
bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
crop_mapping = bundle["crop_mapping"]
features = bundle["features"]


# Test field
field = pd.DataFrame([
    {
        "crop": crop_mapping["Rice"],
        "soil_moisture": 20,
        "soil_ph": 6.5,
        "temperature": 32,
        "humidity": 60,
        "rainfall": 0,
    }
])


prediction = model.predict(field[features])

print("Input:")
print(field)

print("\nPrediction:")
print(prediction[0])