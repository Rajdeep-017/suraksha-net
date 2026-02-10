import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

def train_risk_model(data_path, model_save_path):
    # 1. Load the Indian Metro Accident Dataset
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Could not find data at {data_path}")
    df = pd.read_csv(data_path)
    
    # 2. Feature Engineering: Extracting temporal patterns unique to India
    # (e.g., Night driving vs. Monsoon months)
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df['Hour'] = df['Timestamp'].dt.hour
    df['Month'] = df['Timestamp'].dt.month
    df['DayOfWeek'] = df['Timestamp'].dt.dayofweek
    
    # 3. Encoding Categorical Data
    # We save these encoders to use them during real-time API inference
    le_city = LabelEncoder()
    df['City_Encoded'] = le_city.fit_transform(df['City'])
    
    le_weather = LabelEncoder()
    df['Weather_Encoded'] = le_weather.fit_transform(df['Weather'])
    
    le_road = LabelEncoder()
    df['Road_Condition_Encoded'] = le_road.fit_transform(df['Road_Condition'])
    
    # 4. Selecting Features for the Model
    features = [
        'Latitude', 'Longitude', 'City_Encoded', 
        'Weather_Encoded', 'Road_Condition_Encoded', 
        'Hour', 'Month', 'DayOfWeek'
    ]
    X = df[features]
    y = df['Risk_Score']
    
    # 5. Split and Train
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training on {len(X_train)} samples...")
    model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    model.fit(X_train, y_train)
    
    # 6. Save Artifacts for Deployment
    os.makedirs(model_save_path, exist_ok=True)
    joblib.dump(model, os.path.join(model_save_path, 'risk_model.pkl'))
    joblib.dump(le_city, os.path.join(model_save_path, 'le_city.pkl'))
    joblib.dump(le_weather, os.path.join(model_save_path, 'le_weather.pkl'))
    joblib.dump(le_road, os.path.join(model_save_path, 'le_road.pkl'))
    
    print(f"Model and Encoders saved to {model_save_path}")
    print(f"Model Performance Score: {model.score(X_test, y_test):.4f}")

# if __name__ == "__main__":
#     # Point to your local paths
#     DATA_FILE = '../Data/processed/clean.csv' 
#     MODEL_DIR = '../app/models/'
#     train_risk_model(DATA_FILE, MODEL_DIR)
if __name__ == "__main__":
    # 1. Get the path of the current script (backend/ML/train_model.py)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    # 2. Point to the CSV file (it's up two levels from backend/ML/)
    # Adjusted to point to the file you uploaded
    DATA_FILE = os.path.join(BASE_DIR, "../../india_metro_accidents_2000.csv")

    # 3. Point to the models folder (one level up, then into app/models)
    MODEL_DIR = os.path.join(BASE_DIR, "../app/models/")

    print(f"Reading from: {os.path.abspath(DATA_FILE)}")
    print(f"Saving to: {os.path.abspath(MODEL_DIR)}")

    train_risk_model(DATA_FILE, MODEL_DIR)