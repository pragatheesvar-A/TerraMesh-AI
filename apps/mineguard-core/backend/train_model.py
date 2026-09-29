import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

def create_synthetic_data(n_samples=5000):
    """
    Generate synthetic geotechnical data for training the model.
    """
    np.random.seed(42)
    
    # Base safe readings
    tilt = np.random.normal(0.5, 0.2, n_samples)          # Safe: < 1.0 deg
    displacement = np.random.normal(2.0, 1.0, n_samples)  # Safe: < 5.0 mm/day
    crack = np.random.normal(1.0, 0.5, n_samples)         # Safe: < 2.0 mm
    vibration = np.random.normal(1.5, 0.5, n_samples)     # Safe: < 3.0 mm/s
    historical = np.random.uniform(0, 1, n_samples)       # 0 to 1 impact factor

    # Introduce critical events (higher risk) for 20% of the data
    critical_idx = np.random.choice(n_samples, int(n_samples * 0.2), replace=False)
    tilt[critical_idx] += np.random.uniform(0.5, 2.0, len(critical_idx))
    displacement[critical_idx] += np.random.uniform(3.0, 8.0, len(critical_idx))
    crack[critical_idx] += np.random.uniform(2.0, 5.0, len(critical_idx))
    vibration[critical_idx] += np.random.uniform(2.0, 6.0, len(critical_idx))
    
    # Calculate Risk Score (0-100)
    # Weights reflecting importance
    risk = (
        (tilt / 2.0) * 35 +
        (displacement / 10.0) * 30 +
        (crack / 5.0) * 20 +
        (vibration / 6.0) * 10 +
        (historical) * 5
    )
    
    # Add some noise
    risk += np.random.normal(0, 2, n_samples)
    
    # Clip to 0-100
    risk = np.clip(risk, 0, 100)

    df = pd.DataFrame({
        'tilt_change': tilt,
        'displacement_rate': displacement,
        'crack_widening': crack,
        'vibration': vibration,
        'historical_trend': historical,
        'risk_score': risk
    })
    
    return df

def train():
    print("Generating synthetic dataset...")
    df = create_synthetic_data(10000)
    
    X = df[['tilt_change', 'displacement_rate', 'crack_widening', 'vibration', 'historical_trend']]
    y = df['risk_score']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)
    
    print("\nModel Evaluation Metrics:")
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"R² Score: {r2:.3f}")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")

if __name__ == "__main__":
    train()
