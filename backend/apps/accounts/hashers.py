from django.contrib.auth.hashers import BasePasswordHasher

try:
    import argon2
    ph = argon2.PasswordHasher()
except ImportError:
    ph = None


class RawArgon2PasswordHasher(BasePasswordHasher):
    algorithm = "argon2"

    def verify(self, password, encoded):
        if not encoded or ph is None:
            return False
        # Strip Django prefix if present, else use raw argon2 hash
        if encoded.startswith('argon2$'):
            raw_hash = encoded.split('$', 1)[1]
        else:
            raw_hash = encoded
        try:
            return ph.verify(raw_hash, password)
        except Exception:
            return False

    def encode(self, password, salt=None):
        if ph is None:
            return password
        return ph.hash(password)

    def safe_summary(self, encoded):
        return {'algorithm': self.algorithm}
