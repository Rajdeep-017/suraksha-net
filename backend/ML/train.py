"""
Suraksha-Net ML Training Pipeline
==================================
RandomForestClassifier with oversampled balanced classes.
Accuracy: ~88-89% on pune_road_accidents_v2.xlsx

Saves 5 artifacts consumed by the backend API at inference time:
  severity_model.pkl, encoders.pkl, severity_encoder.pkl, coord_scaler.pkl, kmeans_hotspots.pkl
"""

import numpy as np
import pandas as pd
import joblib
import os
from pathlib import Path

os.environ["LOKY_MAX_CPU_COUNT"] = "4"

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils import resample

RANDOM_SEED = 42
TEST_SIZE   = 0.20
N_CLUSTERS  = 50
MODEL_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "models")

# ── 1. Load Dataset ───────────────────────────────────────────────────────────
DATA_CANDIDATES = [
    r"C:\Users\RAJDEEP\Downloads\pune_road_accidents_v2.xlsx",
    # r"D:\final_merged_accidents.csv",
    os.path.join(os.path.dirname(__file__), "..", "Data", "final_merged_accidents.csv"),
]
path = None
for p in DATA_CANDIDATES:
    if Path(p).exists():
        path = Path(p)
        break

if path is None:
    raise FileNotFoundError(
        "No accident dataset found. Tried:\n  " + "\n  ".join(DATA_CANDIDATES)
    )

df = pd.read_excel(path) if path.suffix == ".xlsx" else pd.read_csv(path)
print(f"[OK] Loaded {len(df):,} rows from {path.name}")

# ── 2. Target Creation (quantile-based) ──────────────────────────────────────
q1, q2 = df["Risk_Score"].quantile([0.333, 0.666]).values
df["Severity"] = pd.cut(
    df["Risk_Score"],
    bins=[-1, q1, q2, 999],
    labels=["Low", "Medium", "High"]
)
print(f"[OK] Target classes -> {df['Severity'].value_counts().to_dict()}")

# ── 3. Feature Engineering ────────────────────────────────────────────────────
road_risk = {"Slippery":4, "Potholed":3, "Under Construction":3, "Wet":2, "Dry":1, "Good":1}
time_risk = {"Late Night":3, "Night":2, "Morning Rush":2, "Evening Rush":2, "Afternoon":1, "Midday":1}

df["road_risk_num"]         = df["Road_Condition"].map(road_risk).fillna(2)
df["time_risk_num"]         = df["Time_Bin"].map(time_risk).fillna(1)
df["is_night"]              = (df["Day_Night"] == "Nighttime").astype(int)
df["weather_road_risk"]     = df["Weather_Severity"] * df["road_risk_num"]
df["casualty_severity_idx"] = df["Fatalities"]*5 + df["Serious_Injuries"]*2 + df["Minor_Injuries"]
df["total_casualties"]      = df["Fatalities"] + df["Serious_Injuries"] + df["Minor_Injuries"]

# Categorical label encoding — we save these for inference
cat_encoders = {}
for col in ["Weather", "Road_Condition", "Time_Bin", "Day_Night"]:
    le = LabelEncoder()
    df[col + "_enc"] = le.fit_transform(df[col].astype(str))
    cat_encoders[col] = le

# Also encode City (needed by backend navigation.py)
le_city = LabelEncoder()
df["City_enc"] = le_city.fit_transform(df["City"].astype(str))
cat_encoders["City"] = le_city

# Geo-clustering for hotspots (used by backend)
coords = df[["Latitude", "Longitude"]]
coord_scaler = StandardScaler()
coords_scaled = coord_scaler.fit_transform(coords)
kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=RANDOM_SEED, n_init=10)
df["Hotspot"] = kmeans.fit_predict(coords_scaled)

# ── 4. Feature Vector ────────────────────────────────────────────────────────
FEATURES = [
    "Weather_enc", "Road_Condition_enc", "Time_Bin_enc", "Day_Night_enc",
    "Weather_Severity", "Traffic_Density", "road_risk_num", "time_risk_num",
    "is_night", "weather_road_risk", "casualty_severity_idx", "total_casualties",
    "Fatalities", "Serious_Injuries", "Minor_Injuries",
]

target_le = LabelEncoder()
X = df[FEATURES].values
y = target_le.fit_transform(df["Severity"])

# ── 5. Train-test split + oversampling ────────────────────────────────────────
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_SEED
)

df_tr = pd.DataFrame(X_tr)
df_tr["_y"] = y_tr
max_n = df_tr["_y"].value_counts().max()
balanced = pd.concat([
    resample(group, replace=True, n_samples=max_n, random_state=RANDOM_SEED)
    for _, group in df_tr.groupby("_y")
])
X_tr_bal = balanced.drop("_y", axis=1).values
y_tr_bal = balanced["_y"].values

print(f"[OK] Oversampled: {len(X_tr)} -> {len(X_tr_bal)} training samples")

# ── 6. Model Training ────────────────────────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    min_samples_leaf=2,
    max_features="sqrt",
    class_weight="balanced",
    random_state=RANDOM_SEED,
    n_jobs=-1,
)

print("[..] Training model...")
model.fit(X_tr_bal, y_tr_bal)

# ── 7. Evaluation ─────────────────────────────────────────────────────────────
y_pred = model.predict(X_te)
acc = accuracy_score(y_te, y_pred)

print(f"\n[OK] Accuracy: {acc:.2%}")
print("\n--- Classification Report ---")
print(classification_report(y_te, y_pred, target_names=target_le.classes_, digits=4))

# Feature importance
print("--- Feature Importance ---")
for feat, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
    bar = "#" * int(imp * 50)
    print(f"   {feat:28s}  {imp:.4f}  {bar}")

# ── 8. Save Artifacts ─────────────────────────────────────────────────────────
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model,          os.path.join(MODEL_DIR, "severity_model.pkl"))
joblib.dump(cat_encoders,   os.path.join(MODEL_DIR, "encoders.pkl"))
joblib.dump(target_le,      os.path.join(MODEL_DIR, "severity_encoder.pkl"))
joblib.dump(coord_scaler,   os.path.join(MODEL_DIR, "coord_scaler.pkl"))
joblib.dump(kmeans,          os.path.join(MODEL_DIR, "kmeans_hotspots.pkl"))

# Also save the feature list + lookup maps so the backend can reconstruct vectors
joblib.dump({
    "features": FEATURES,
    "road_risk_map": road_risk,
    "time_risk_map": time_risk,
}, os.path.join(MODEL_DIR, "feature_config.pkl"))

print(f"\n[OK] 6 artifacts saved to {os.path.abspath(MODEL_DIR)}/")
print("   - severity_model.pkl    (RandomForest classifier, 15 features)")
print("   - encoders.pkl          (Weather/Road/TimeBin/DayNight/City label encoders)")
print("   - severity_encoder.pkl  (Low/Medium/High target encoder)")
print("   - coord_scaler.pkl      (Lat/Lng StandardScaler)")
print("   - kmeans_hotspots.pkl   (KMeans hotspot cluster model)")
print("   - feature_config.pkl    (Feature names + risk lookup maps)")
print("\n[DONE] Restart uvicorn to load new models.")