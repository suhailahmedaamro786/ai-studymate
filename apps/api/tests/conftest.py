import sys
import os
import pytest

# Provide required env vars for tests before importing app modules
_test_secrets = {
    "SUPABASE_ANON_KEY": "test-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
    "SUPABASE_JWT_SECRET": "test-jwt-secret",
    "OPENAI_API_KEY": "test-openai-key",
}
for key, value in _test_secrets.items():
    os.environ[key] = value

_api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)


@pytest.fixture
def anyio_backend():
    return "asyncio"
