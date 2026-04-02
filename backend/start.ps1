python -m venv venv
if ($?) {
    .\venv\Scripts\activate
    pip install -r requirements.txt
    python ml\train_dummy_models.py
    python run.py
}
