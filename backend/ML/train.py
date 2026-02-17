# import pandas as pd
# import numpy as np
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import LabelEncoder
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.metrics import r2_score ,accuracy_score
# import joblib
# import os

# def train_risk_model(data_path, model_save_path):
#     # 1. Load the Indian Metro Accident Dataset
#     df = pd.read_csv(r"D:\final_merged_accidents.csv")
    
#     # 2. Feature Engineering: Extracting temporal patterns unique to India
#     # (e.g., Night driving vs. Monsoon months)
#     df['Timestamp'] = pd.to_datetime(df['Timestamp'])
#     df['Hour'] = df['Timestamp'].dt.hour
#     df['Month'] = df['Timestamp'].dt.month
#     df['DayOfWeek'] = df['Timestamp'].dt.dayofweek
    
#     # 3. Encoding Categorical Data
#     # We save these encoders to use them during real-time API inference
#     le_city = LabelEncoder()
#     df['City_Encoded'] = le_city.fit_transform(df['City'])
    
#     le_weather = LabelEncoder()
#     df['Weather_Encoded'] = le_weather.fit_transform(df['Weather'])
    
#     le_road = LabelEncoder()
#     df['Road_Condition_Encoded'] = le_road.fit_transform(df['Road_Condition'])
    
#     # 4. Selecting Features for the Model
#     features = [
#         'Latitude', 'Longitude', 'City_Encoded', 
#         'Weather_Encoded', 'Road_Condition_Encoded', 
#         'Hour', 'Month', 'DayOfWeek'
#     ]
#     X = df[features]
#     y = df['Risk_Score']
    
#     # 5. Split and Train
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
#     print(f"Training on {len(X_train)} samples...")
#     model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
#     model.fit(X_train, y_train)
#     y_pred=model.predict(X_test)
#     print(r2_score(y_pred,y_test))
#     print(accuracy_score(y_pred,y_test))

#     # 6. Save Artifacts for Deployment
#     # os.makedirs(model_save_path, exist_ok=True)
#     # joblib.dump(model, os.path.join(model_save_path, 'risk_model.pkl'))
#     # joblib.dump(le_city, os.path.join(model_save_path, 'le_city.pkl'))
#     # joblib.dump(le_weather, os.path.join(model_save_path, 'le_weather.pkl'))
#     # joblib.dump(le_road, os.path.join(model_save_path, 'le_road.pkl'))
    
#     print(f"Model and Encoders saved to {model_save_path}")
#     print(f"Model Performance Score: {model.score(X_test, y_test):2%}")

# # if __name__ == "__main__":
# #     # Point to your local paths
# #     DATA_FILE = '../Data/processed/clean.csv' 
# #     MODEL_DIR = '../app/models/'
# #     train_risk_model(DATA_FILE, MODEL_DIR)
# # if __name__ == "__main__":
# #     # 1. Get the path of the current script (backend/ML/train_model.py)
# #     BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# #     # 2. Point to the CSV file (it's up two levels from backend/ML/)
# #     # Adjusted to point to the file you uploaded
# #     DATA_FILE = os.path.join(BASE_DIR, "../../india_metro_accidents_2000.csv")

# #     # 3. Point to the models folder (one level up, then into app/models)
# #     MODEL_DIR = os.path.join(BASE_DIR, "../app/models/")

# #     print(f"Reading from: {os.path.abspath(DATA_FILE)}")
# #     print(f"Saving to: {os.path.abspath(MODEL_DIR)}")

#     # train_risk_model(DATA_FILE, MODEL_DIR)

# import pandas as pd
# import numpy as np
# # import joblib
# # import os
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.metrics import accuracy_score, classification_report
# from xgboost import XGBClassifier

# # 1. LOAD DATA
# df = pd.read_csv(r'D:\final_merged_accidents.csv')

# # 2. TARGET CREATION (Classification)
# # 0: Low Risk, 1: Moderate, 2: High Risk
# df['Target'] = pd.cut(df['Risk_Score'], bins=[-1, 5, 15, 1000], labels=[0, 1, 2]).astype(int)

# # 3. FEATURE ENGINEERING
# df['Timestamp'] = pd.to_datetime(df['Timestamp'])
# df['Hour'] = df['Timestamp'].dt.hour

# # Cyclical Time Features (Ensures 23:00 and 00:00 are recognized as adjacent)
# df['hour_sin'] = np.sin(2 * np.pi * df['Hour'] / 23.0)
# df['hour_cos'] = np.cos(2 * np.pi * df['Hour'] / 23.0)

# # High-Risk Indicators
# df['Is_Night'] = df['Hour'].apply(lambda x: 1 if (x >= 22 or x <= 5) else 0)
# df['Is_Highway'] = df['Road_Condition'].apply(
#     lambda x: 1 if any(h in str(x).upper() for h in ['NH', 'SH', 'HIGHWAY']) else 0
# )
# df['Night_Highway'] = df['Is_Night'] * df['Is_Highway'] 

# # Target Encoding for City (Replaces names with historical risk values)
# city_risk = df.groupby('City')['Risk_Score'].mean().to_dict()
# df['City_Risk_Level'] = df['City'].map(city_risk)

# # 4. FEATURE SELECTION (Dropping outcome columns to prevent cheating)
# features = [
#     'Latitude', 'Longitude', 'hour_sin', 'hour_cos', 
#     'Is_Night', 'Is_Highway', 'Night_Highway', 'City_Risk_Level'
# ]

# X = df[features]
# y = df['Target']

# # 5. TRAIN-TEST SPLIT
# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42, stratify=y
# )

# # 6. SCALING
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# # 7. MODEL (Optimal XGBoost Parameters)
# model = XGBClassifier(
#     n_estimators=500,
#     learning_rate=0.05,
#     max_depth=6,
#     subsample=0.8,
#     colsample_bytree=0.8,
#     random_state=42
# )

# model.fit(X_train_scaled, y_train)

# # 8. SAVE FOR BACKEND
# # os.makedirs('../app/models/', exist_ok=True)
# # joblib.dump(model, "../app/models/risk_model.pkl")
# # joblib.dump(scaler, "../app/models/scaler.pkl")
# # joblib.dump(city_risk, "../app/models/city_risk_map.pkl")

# print(f"✅ Training Complete. Accuracy: {accuracy_score(y_test, model.predict(X_test_scaled)):.2%}")

import pandas as pd
import numpy as np
import joblib
import os
os.environ["LOKY_MAX_CPU_COUNT"] = "4"  # Replace 4 with the number of physical cores you have
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# 1. Load Dataset
df = pd.read_csv(r'D:\final_merged_accidents.csv')

# 2. Advanced Feature Engineering
df["Timestamp"] = pd.to_datetime(df["Timestamp"])
df["Hour"] = df["Timestamp"].dt.hour
df["Month"] = df["Timestamp"].dt.month
df["DayOfWeek"] = df["Timestamp"].dt.dayofweek

# Feature A: Cyclical Time (Optimal for Night Risk)
df['hour_sin'] = np.sin(2 * np.pi * df['Hour'] / 23.0)
df['hour_cos'] = np.cos(2 * np.pi * df['Hour'] / 23.0)

# Feature B: Hotspot Clustering (Finds 'Blackspots' in India)
# This groups raw Lat/Long into 50 specific dangerous zones
coords = df[['Latitude', 'Longitude']]
scaler = StandardScaler()
coords_scaled = scaler.fit_transform(coords)
kmeans = KMeans(n_clusters=50, random_state=42, n_init=10)
df['Hotspot'] = kmeans.fit_predict(coords_scaled)

# Feature C: Severity Level (Target)
df["Severity_Level"] = np.where(
    df["Fatalities"] > 0, "High",
    np.where(df["Serious_Injuries"] > 0, "Medium", "Low")
)

# 3. Categorical Encoding
categorical_cols = ["City", "Weather", "Road_Condition"]
encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

severity_encoder = LabelEncoder()
y = severity_encoder.fit_transform(df["Severity_Level"])

# 4. Final Feature Selection
# We use only environmental factors (No cheating with Fatalities/Injuries)
features = [
    "Latitude", "Longitude", "City", "Weather", "Road_Condition", 
    "hour_sin", "hour_cos", "Month", "DayOfWeek", "Hotspot"
]
X = df[features]

# 5. Train-Test Split (80/20)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 6. Optimized Model
# RandomForest is more stable than XGBoost for this specific dataset size
model = RandomForestClassifier(n_estimators=300, max_depth=15, class_weight='balanced', random_state=42)
model.fit(X_train, y_train)

# 7. Final Results
preds = model.predict(X_test)
print(f"✅ Optimal Accuracy: {accuracy_score(y_test, preds):.2%}")
print("\nSafety Report per Class:")
print(classification_report(y_test, preds, target_names=severity_encoder.classes_))

# 8. Save Everything for Backend
os.makedirs('backend/app/models', exist_ok=True)
joblib.dump(model, "backend/app/models/severity_model.pkl")
joblib.dump(encoders, "backend/app/models/encoders.pkl")
joblib.dump(severity_encoder, "backend/app/models/severity_encoder.pkl")
joblib.dump(scaler, "backend/app/models/coord_scaler.pkl")
joblib.dump(kmeans, "backend/app/models/kmeans_hotspots.pkl")

print("\n🚀 All 5 artifacts saved! Your backend is now ready for 'Safer Route' logic.")