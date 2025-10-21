import pandas as pd


def load_recipients(csv_path):
    df = pd.read_csv(csv_path)
    if "Name" not in df.columns or "Email" not in df.columns:
        raise ValueError("CSV must have Name and Email columns")
    return df.to_dict(orient="records")
