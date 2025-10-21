import pandas as pd


def load_recipients_df(csv_path):
    df = pd.read_csv(csv_path)
    required_columns = ["Name", "Email", "CertificateFile", "Status"]
    if not all(col in df.columns for col in required_columns):
        raise ValueError(f"CSV must have the following columns: {required_columns}")

    df["Status"] = df["Status"].fillna("PENDING")
    return df


def save_recipients_df(df, csv_path):
    df.to_csv(csv_path, index=False)
