import os
from cryptography.fernet import Fernet, InvalidToken

_fernet_instance = None


def _get_fernet():
    global _fernet_instance
    if _fernet_instance is None:
        secret_key = os.environ.get("SECRET_KEY")
        if not secret_key:
            raise ValueError("SECRET_KEY environment variable not set.")
        _fernet_instance = Fernet(secret_key.encode("utf-8"))
    return _fernet_instance


def encrypt(data: str) -> str:
    if not data:
        return ""
    fernet = _get_fernet()
    encrypted_bytes = fernet.encrypt(data.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt(encoded_data: str) -> str:
    if not encoded_data:
        return ""
    fernet = _get_fernet()
    try:
        decrypted_bytes = fernet.decrypt(encoded_data.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except InvalidToken:
        return ""
