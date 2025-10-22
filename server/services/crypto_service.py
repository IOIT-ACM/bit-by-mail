import base64
import hashlib
import os

SECRET_KEY = "AISSMS-IOIT-ACM-STUDENT-CHAPTER"
ITERATIONS = 100000


def _derive_key(salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256", SECRET_KEY.encode("utf-8"), salt, ITERATIONS, dklen=32
    )


def encrypt(data: str) -> str:
    if not data:
        return ""
    salt = os.urandom(16)
    key = _derive_key(salt)
    data_bytes = data.encode("utf-8")
    encrypted_bytes = bytearray()
    for i in range(len(data_bytes)):
        encrypted_bytes.append(data_bytes[i] ^ key[i % len(key)])
    return base64.b64encode(salt + encrypted_bytes).decode("utf-8")


def decrypt(encoded_data: str) -> str:
    if not encoded_data:
        return ""
    try:
        data = base64.b64decode(encoded_data.encode("utf-8"))
        salt = data[:16]
        encrypted_bytes = data[16:]
        key = _derive_key(salt)
        decrypted_bytes = bytearray()
        for i in range(len(encrypted_bytes)):
            decrypted_bytes.append(encrypted_bytes[i] ^ key[i % len(key)])
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return ""
