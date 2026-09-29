import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# --------------------------------------------------
# Paths
# --------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    CURRENT_DIR,
    "..",
    "..",
    "data",
    "irrigation_training.csv",
)

MODEL_PATH = os.path.join(
    CURRENT_DIR,
    "decision_tree_model.pkl",
)


# --------------------------------------------------
# 1. Load dataset
# --------------------------------------------------

print("=" * 60)
print("IRRIGATION DECISION TREE TRAINING")
print("=" * 60)

print("\nLoading dataset...")
print(DATA_PATH)

data = pd.read_csv(DATA_PATH)

print("\nDataset loaded successfully.")
print("Rows:", len(data))
print("Columns:", list(data.columns))


# --------------------------------------------------
# 2. Display class distribution
# --------------------------------------------------

print("\nRecommendation distribution:")
print(data["recommendation"].value_counts())


# --------------------------------------------------
# 3. Convert crop to numerical values
# --------------------------------------------------

crop_mapping = {
    "Rice": 0,
    "Tomato": 1,
    "Potato": 2,
    "Wheat": 3,
}

data["crop"] = data["crop"].map(crop_mapping)

if data["crop"].isnull().any():
    raise ValueError("Unknown crop found in dataset.")


# --------------------------------------------------
# 4. Select features
# --------------------------------------------------

features = [
    "crop",
    "soil_moisture",
    "soil_ph",
    "temperature",
    "humidity",
    "rainfall",
]

X = data[features]
y = data["recommendation"]


# --------------------------------------------------
# 5. Split dataset
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print("\nDataset split:")
print("Training samples:", len(X_train))
print("Testing samples :", len(X_test))


# --------------------------------------------------
# 6. Create Decision Tree
# --------------------------------------------------

model = DecisionTreeClassifier(
    max_depth=4,
    random_state=42,
)


# --------------------------------------------------
# 7. Train
# --------------------------------------------------

print("\nTraining Decision Tree...")

model.fit(X_train, y_train)

print("Training completed.")


# --------------------------------------------------
# 8. Evaluate
# --------------------------------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions,
)

print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(f"\nAccuracy: {accuracy:.4f}")
print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0,
    )
)

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_test,
        predictions,
    )
)


# --------------------------------------------------
# 9. Save model
# --------------------------------------------------

joblib.dump(
    {
        "model": model,
        "crop_mapping": crop_mapping,
        "features": features,
    },
    MODEL_PATH,
)

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)

print("\nModel:")
print(MODEL_PATH)

print("\nTraining finished successfully!")