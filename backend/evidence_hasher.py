import hashlib
import re
from typing import BinaryIO, Union

class EvidenceHasher:
    """
    Cryptographic SHA-256 integrity calculator for digital forensics artifacts.
    Supports stream chunking to process large forensic images and memory dumps.
    """
    CHUNK_SIZE = 64 * 1024  # 64 KB chunks

    @staticmethod
    def calculate_sha256(file_or_bytes: Union[BinaryIO, bytes, str]) -> str:
        """
        Calculates SHA-256 cryptographic digest.
        """
        sha256_engine = hashlib.sha256()

        if isinstance(file_or_bytes, bytes):
            sha256_engine.update(file_or_bytes)
        elif hasattr(file_or_bytes, 'read'):
            # It is a file-like stream
            pos = 0
            if hasattr(file_or_bytes, 'tell'):
                try:
                    pos = file_or_bytes.tell()
                except Exception:
                    pass

            while chunk := file_or_bytes.read(EvidenceHasher.CHUNK_SIZE):
                if isinstance(chunk, str):
                    chunk = chunk.encode('utf-8')
                sha256_engine.update(chunk)

            # Reset pointer if seekable
            if hasattr(file_or_bytes, 'seek'):
                try:
                    file_or_bytes.seek(pos)
                except Exception:
                    pass
        elif isinstance(file_or_bytes, str):
            sha256_engine.update(file_or_bytes.encode('utf-8'))
        else:
            raise ValueError("Unsupported data type for SHA-256 calculation")

        return sha256_engine.hexdigest().lower()

    @staticmethod
    def is_valid_sha256(hash_str: str) -> bool:
        """Validates if a given string conforms to 64-hex character SHA-256 format."""
        if not hash_str or not isinstance(hash_str, str):
            return False
        return bool(re.fullmatch(r"^[a-fA-F0-9]{64}$", hash_str.strip()))
