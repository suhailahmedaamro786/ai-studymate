import asyncio
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

# Set required env vars before importing app modules
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_embedding_vector(dim: int) -> list[float]:
    """Return a float vector of the requested dimension."""
    return [0.01 * i for i in range(dim)]


def _mock_embed_content(model: str, content: str, task_type: str) -> dict:
    return {"embedding": _make_embedding_vector(768)}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestGeminiProviderEmbed:
    """Unit tests for GeminiProvider.embed()."""

    def test_embed_returns_numeric_vector(self):
        """embed() must return a list of floats."""
        from app.domain.tutor.ai_adapter import GeminiProvider

        provider = GeminiProvider()

        with patch("google.generativeai.embed_content", side_effect=_mock_embed_content):
            result = asyncio.run(provider.embed("hello world"))

        assert isinstance(result, list)
        assert all(isinstance(v, (int, float)) for v in result)

    def test_embed_vector_length_matches_dimension(self):
        """Embedding length must equal settings.embedding_dimension (768)."""
        from app.core.config import settings
        from app.domain.tutor.ai_adapter import GeminiProvider

        provider = GeminiProvider()
        expected_dim = settings.embedding_dimension

        with patch("google.generativeai.embed_content", side_effect=_mock_embed_content):
            result = asyncio.run(provider.embed("hello world"))

        assert len(result) == expected_dim
        assert expected_dim == 768

    def test_embed_raises_on_dimension_mismatch(self):
        """Provider must raise if Gemini returns a different dimension than configured."""
        from app.domain.tutor.ai_adapter import GeminiProvider

        def _wrong_dim(*args, **kwargs):
            return {"embedding": [0.0] * 512}  # wrong dimension

        provider = GeminiProvider()

        with patch("google.generativeai.embed_content", side_effect=_wrong_dim):
            with pytest.raises(RuntimeError, match="dimension mismatch"):
                asyncio.run(provider.embed("test"))

    def test_embed_raises_on_invalid_embedding_type(self):
        """Provider must raise if Gemini returns a non-list embedding."""
        from app.domain.tutor.ai_adapter import GeminiProvider

        def _bad_type(*args, **kwargs):
            return {"embedding": "not-a-list"}

        provider = GeminiProvider()

        with patch("google.generativeai.embed_content", side_effect=_bad_type):
            with pytest.raises(RuntimeError, match="invalid embedding type"):
                asyncio.run(provider.embed("test"))

    def test_embed_raises_on_api_error(self):
        """Provider must raise NonRetryableError when the Gemini API fails."""
        from app.domain.tutor.ai_adapter import GeminiProvider, NonRetryableError

        provider = GeminiProvider()

        with patch("google.generativeai.embed_content", side_effect=Exception("API error")):
            with pytest.raises(NonRetryableError, match="Gemini embedding failed"):
                asyncio.run(provider.embed("test"))


class TestEmbedWithFallback:
    """Tests for embed_with_fallback() integration."""

    def test_fallback_uses_gemini_when_only_gemini_configured(self):
        """When only Gemini is configured, _build_provider_chain returns Gemini."""
        import app.domain.tutor.ai_adapter as adapter_mod
        from app.domain.tutor.ai_adapter import _build_provider_chain
        adapter_mod._provider_chain = None

        with patch.object(adapter_mod.settings, "openai_api_key", ""), \
             patch.object(adapter_mod.settings, "groq_api_key", ""), \
             patch.object(adapter_mod.settings, "gemini_api_key", "test-key"):
            chain = _build_provider_chain()
            assert len(chain) == 1
            assert chain[0].__class__.__name__ == "GeminiProvider"

    def test_fallback_handles_not_implemented_from_groq(self):
        """embed_with_fallback must skip providers that raise NotImplementedError."""
        import app.domain.tutor.ai_adapter as adapter_mod
        from app.domain.tutor.ai_adapter import AIProvider, embed_with_fallback

        class _FakeProvider(AIProvider):
            async def complete(self, messages, schema=None):
                return {}
            async def complete_tutor(self, question, chunks, grounded):
                return {}
            async def embed(self, text):
                raise NotImplementedError("no embeddings")

        class _GoodProvider(AIProvider):
            async def complete(self, messages, schema=None):
                return {}
            async def complete_tutor(self, question, chunks, grounded):
                return {}
            async def embed(self, text):
                return [0.01] * 768

        fake = _FakeProvider()
        good = _GoodProvider()

        with patch.object(adapter_mod, "_build_provider_chain", return_value=[fake, good]):
            adapter_mod._provider_chain = None
            result = asyncio.run(embed_with_fallback("test"))
        assert len(result) == 768

    def test_embed_with_fallback_returns_vector(self):
        """embed_with_fallback must return a list of floats of the right length."""
        import app.domain.tutor.ai_adapter as adapter_mod
        from app.core.config import settings
        from app.domain.tutor.ai_adapter import embed_with_fallback

        adapter_mod._provider_chain = None

        vec = _make_embedding_vector(768)

        async def _mock_embed(text):
            return vec

        # Patch provider chain to a single mocked provider
        mock_provider = MagicMock()
        mock_provider.embed = _mock_embed

        with patch.object(adapter_mod, "_build_provider_chain", return_value=[mock_provider]):
            result = asyncio.run(embed_with_fallback("test query"))

        assert len(result) == settings.embedding_dimension


class TestDocumentChunkEmbedding:
    """Tests for the document processing embedding path."""

    def test_chunk_embedding_dimension_matches_db(self):
        """Embeddings produced for chunks must match the DB vector dimension."""
        from app.core.config import settings

        assert settings.embedding_dimension == 768

    def test_valid_chunks_filter_none_embeddings(self):
        """Document processing should filter out chunks with None embeddings."""
        chunks = [
            {"content": "hello", "embedding": [0.1] * 768},
            {"content": "world", "embedding": None},
            {"content": "foo", "embedding": [0.2] * 768},
        ]
        valid = [c for c in chunks if c.get("embedding")]
        assert len(valid) == 2


class TestVectorSearchCompatibility:
    """Verify the RAG retrieval path is compatible with 768-dim embeddings."""

    def test_match_function_signature_expects_768(self):
        """The match_document_chunks SQL function must accept vector(768)."""
        migration_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "..",
            "supabase", "migrations", "012_update_embedding_dimension_for_gemini.sql",
        )
        with open(migration_path) as f:
            content = f.read()

        assert "vector(768)" in content
        assert "idx_chunks_embedding" in content

    def test_config_dimension_equals_gemini_output(self):
        """Config embedding_dimension must match Gemini text-embedding-004 output."""
        from app.core.config import settings

        assert settings.gemini_embedding_model == "text-embedding-004"
        assert settings.embedding_dimension == 768
