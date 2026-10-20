# Compatibility monkeypatch allowing Django to connect to PostgreSQL 13
from django.db.backends.postgresql.features import DatabaseFeatures

DatabaseFeatures.minimum_database_version = (13,)
