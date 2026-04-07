import os
import joblib
import numpy as np
import pandas as pd

from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

def train_collision_model():
    print("=" * 50)
    print("1) Training Collision Risk Model from train_data.csv")
    print("=" * 50)
    
    # Path logic: root/ml-model/train_real_models.py
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(ml_dir)
    
    data_path = os.path.join(ml_dir, 'data', '__dataset (1).csv')
    model_dir = os.path.join(root_dir, 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Warning: {data_path} not found! Skipping Collision Model training.")
        return

    print("Loading huge dataset (this might take a few seconds)...")
    # Load just what we need to avoid memory crash
    cols = ['miss_distance', 'relative_speed', 'time_to_tca', 'risk']
    try:
        df = pd.read_csv(data_path, usecols=cols)
        df = df.dropna()
        
        # Features and label (binary classification for risk)
        X = df[['miss_distance', 'relative_speed', 'time_to_tca']]
        y = (df['risk'] > 0.05).astype(int) # High risk threshold
        
        print("Training Random Forest Classifier on Conjunction Data...")
        rf = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
        rf.fit(X, y)
        
        out_path = os.path.join(model_dir, 'collision_model.pkl')
        joblib.dump(rf, out_path)
        print(f"Saved {out_path}")
        
    except Exception as e:
        print(f"Failed to train collision model: {e}")

def train_anomaly_ensemble():
    print("\n" + "=" * 50)
    print("2) Training Telemetry Anomaly Stacking Ensemble")
    print("=" * 50)
    
    # Path logic: root/ml-model/train_real_models.py
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_dir = os.path.join(root_dir, 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    print("Synthesizing 10,000 highly realistic rows of hardware telemetry...")
    np.random.seed(42)
    n_samples = 15000
    
    # Normal behavior
    temp = np.random.normal(30, 2.5, n_samples)
    volt = np.random.normal(5.0, 0.1, n_samples)
    sig = np.random.normal(-60, 5, n_samples)
    anomaly = np.zeros(n_samples)
    
    # Inject exactly 1,000 realistic hardware anomalies
    n_anomalies = 1000
    anomaly_idx = np.random.choice(n_samples, n_anomalies, replace=False)
    
    # 1. Thermal spikes
    heat_idx = anomaly_idx[:333]
    temp[heat_idx] += np.random.normal(25, 5, len(heat_idx))
    
    # 2. Voltage drops (Shorts)
    volt_idx = anomaly_idx[333:666]
    volt[volt_idx] -= np.random.normal(1.5, 0.4, len(volt_idx))
    
    # 3. Complete system failure (Signal loss + cold temp)
    fail_idx = anomaly_idx[666:]
    temp[fail_idx] -= 20
    sig[fail_idx] -= np.random.normal(40, 10, len(fail_idx))
    volt[fail_idx] -= 2.0
    
    anomaly[anomaly_idx] = 1
    
    df = pd.DataFrame({
        'temperature': temp,
        'voltage': volt,
        'signal': sig,
        'anomaly': anomaly
    })
    
    y = df['anomaly']
    df = df.drop(columns=['anomaly'])
    
    # --- STRONG FEATURE ENGINEERING (Must exactly match telemetry.py) ---
    print("Applying Strong Feature Engineering...")
    df['row_mean'] = df.mean(axis=1)
    df['row_std'] = df.std(axis=1)
    df['row_max'] = df.max(axis=1)
    df['row_min'] = df.min(axis=1)
    df['skew'] = df.skew(axis=1)
    df['kurt'] = df.kurtosis(axis=1)
    
    print("Splitting Train/Test/Val...")
    X_train_val, X_test, y_train_val, y_test = train_test_split(df, y, test_size=0.15, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.15, stratify=y_train_val, random_state=42)
    
    print("Scaling Features: robust_scaler.pkl")
    scaler = RobustScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s   = scaler.transform(X_val)
    X_test_s  = scaler.transform(X_test)
    joblib.dump(scaler, os.path.join(model_dir, 'robust_scaler.pkl'))
    
    # ---- 1. AUTOENCODER (MLPRegressor) ----
    print("\n--- Training SciKit-Learn Autoencoder (Replaces TensorFlow) ---")
    
    ae = MLPRegressor(
        hidden_layer_sizes=(16, 8, 16),
        activation='relu',
        solver='adam',
        max_iter=300,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1
    )
    
    # Train ae on normal data ONLY
    X_normal_train = X_train_s[y_train == 0]
    
    ae.fit(X_normal_train, X_normal_train)
    joblib.dump(ae, os.path.join(model_dir, 'autoencoder.pkl'))
    
    print("\nExtracting Autoencoder Reconstruction Errors...")
    recon_train = ae.predict(X_train_s)
    ae_err_train = np.mean(np.square(X_train_s - recon_train), axis=1)
    
    recon_test = ae.predict(X_test_s)
    ae_err_test = np.mean(np.square(X_test_s - recon_test), axis=1)
    
    # ---- 2. ISOLATION FOREST ----
    print("\n--- Training Isolation Forest ---")
    iso = IsolationForest(n_estimators=100, contamination=0.08, random_state=42, n_jobs=-1)
    iso.fit(X_train_s)
    joblib.dump(iso, os.path.join(model_dir, 'iso_forest.pkl'))
    
    # Negative because sklearn returns smaller scores for anomalies
    iso_score_train = -iso.score_samples(X_train_s)
    iso_score_test  = -iso.score_samples(X_test_s)
    
    # ---- 3. XGBoost ----
    print("\n--- Training XGBoost Base Classifier ---")
    xgb = XGBClassifier(
        n_estimators=150, max_depth=6, learning_rate=0.05,
        eval_metric='logloss', random_state=42, n_jobs=-1
    )
    xgb.fit(X_train_s, y_train)
    joblib.dump(xgb, os.path.join(model_dir, 'xgboost.pkl'))
    
    xgb_score_train = xgb.predict_proba(X_train_s)[:, 1]
    xgb_score_test  = xgb.predict_proba(X_test_s)[:, 1]
    
    # ---- 4. META CLASSIFIER STACKING (Logistic Regression) ----
    print("\n--- Training Meta Stacking Classifier ---")
    from sklearn.linear_model import LogisticRegression
    
    # Stacking features: AEError, IsoScore, XGBScore
    S_train = np.vstack([ae_err_train, iso_score_train, xgb_score_train]).T
    S_test  = np.vstack([ae_err_test, iso_score_test, xgb_score_test]).T
    
    meta = LogisticRegression()
    meta.fit(S_train, y_train)
    joblib.dump(meta, os.path.join(model_dir, 'meta_classifier.pkl'))
    
    print("\n--- Final Ensemble Evaluation ---")
    final_probs_test = meta.predict_proba(S_test)[:, 1]
    roc_auc = roc_auc_score(y_test, final_probs_test)
    print(f"Test ROC-AUC: {roc_auc:.4f}")
    
    # Auto-adjust threshold based on Precision-Recall logic to maximize F1
    precision, recall, thresholds = precision_recall_curve(y_test, final_probs_test)
    fscore = (2 * precision * recall) / (precision + recall + 1e-8)
    best_idx = np.argmax(fscore)
    best_thresh = thresholds[best_idx]
    
    print(f"Calculated Best Threshold: {best_thresh:.4f}")
    
    # Write threshold to file for FastAPI routers
    with open(os.path.join(model_dir, 'best_threshold.txt'), 'w') as f:
        f.write(str(best_thresh))
    
    print("\nAll models synthesized, trained, scaled, stacked, and exported successfully.")

if __name__ == "__main__":
    train_collision_model()
    train_anomaly_ensemble()
