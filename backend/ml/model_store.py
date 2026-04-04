import os
import joblib

# Global stores
autoencoder_model = None
iso_forest = None
xgb_model = None
meta_classifier = None
robust_scaler = None
best_threshold = 0.5  # default

def load_models():
    """Load advanced stacked ensemble models into memory on startup."""
    global autoencoder_model, iso_forest, xgb_model, meta_classifier, robust_scaler, best_threshold
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    models_dir = os.path.join(base_dir, "models")
    
    # Robust path: If backend/models doesn't exist, look at root /models
    if not os.path.exists(models_dir):
        models_dir = os.path.join(os.path.dirname(base_dir), "models")
    
    try:
        ae_path = os.path.join(models_dir, 'autoencoder.pkl')
        if os.path.exists(ae_path):
            autoencoder_model = joblib.load(ae_path)
            print("Loaded Autoencoder (MLP) successfully.")
    except Exception as e:
        print(f"Warning: Autoencoder model not found or failed to load: {e}")

    try:
        iso_path = os.path.join(models_dir, 'iso_forest.pkl')
        if os.path.exists(iso_path):
            iso_forest = joblib.load(iso_path)
            
        xgb_path = os.path.join(models_dir, 'xgboost.pkl')
        if os.path.exists(xgb_path):
            xgb_model = joblib.load(xgb_path)
            
        meta_path = os.path.join(models_dir, 'meta_classifier.pkl')
        if os.path.exists(meta_path):
            meta_classifier = joblib.load(meta_path)
            
        scaler_path = os.path.join(models_dir, 'robust_scaler.pkl')
        if os.path.exists(scaler_path):
            robust_scaler = joblib.load(scaler_path)
            
        thresh_path = os.path.join(models_dir, 'best_threshold.txt')
        if os.path.exists(thresh_path):
            with open(thresh_path, 'r') as f:
                best_threshold = float(f.read().strip())
                print(f"Loaded threshold: {best_threshold}")
                
        print("Loaded all SciKit/XGBoost components successfully.")
    except Exception as e:
        print(f"Warning: Failed to load Stack ensemble components: {e}")

def get_ensemble():
    return {
        "autoencoder": autoencoder_model,
        "iso": iso_forest,
        "xgb": xgb_model,
        "meta": meta_classifier,
        "scaler": robust_scaler,
        "threshold": best_threshold
    }

def get_collision_model():
    # Only loads if train_dummy_models or an older script created it
    base_dir = os.path.dirname(os.path.dirname(__file__))
    models_dir = os.path.join(base_dir, "models")
    if not os.path.exists(models_dir):
        models_dir = os.path.join(os.path.dirname(base_dir), "models")
        
    path = os.path.join(models_dir, "collision_model.pkl")
    if os.path.exists(path):
        return joblib.load(path)
    return None
