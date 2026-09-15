import logging
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

_client = AsyncOpenAI(api_key=settings.openai_api_key)


class AIProvider:
    async def complete(self, messages: list[dict], schema: type | None = None) -> dict:
        raise NotImplementedError

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError

    async def complete_tutor(self, question: str, chunks: list[dict], grounded: bool) -> dict:
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    async def complete(self, messages: list[dict], schema: type | None = None) -> dict:
        try:
            if schema:
                response = await _client.beta.chat.completions.parse(
                    model=settings.ai_model,
                    messages=messages,
                    response_format=schema,
                )
                return response.choices[0].message.parsed.model_dump()
            response = await _client.chat.completions.create(
                model=settings.ai_model,
                messages=messages,
            )
            return {"content": response.choices[0].message.content}
        except Exception as e:
            logger.error(f"OpenAI completion failed: {e}")
            raise

    async def embed(self, text: str) -> list[float]:
        try:
            response = await _client.embeddings.create(
                model=settings.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding failed: {e}")
            raise

    async def complete_tutor(self, question: str, chunks: list[dict], grounded: bool) -> dict:
        from app.domain.tutor.response_schema import TutorResponse

        if not grounded:
            return TutorResponse(
                answer=(
                    "I don't have enough information in your uploaded materials to answer "
                    "this question accurately. Try uploading relevant study materials first, "
                    "or ask a question about content that is in your documents."
                ),
                is_grounded=False,
                citations=[],
            ).model_dump()

        context = "\n\n".join(
            f"[Source: {c.get('document_name', 'unknown')}, Page {c.get('page_number', '?')}]\n{c.get('content', '')}"
            for c in chunks
        )

        system_prompt = (
            "You are a study tutor. Answer the student's question using ONLY the provided context. "
            "Cite sources by document name and page number. If the context is insufficient, say so explicitly. "
            "Never fabricate information not present in the context."
        )
        user_prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer based on the context above."

        try:
            response = await _client.beta.chat.completions.parse(
                model=settings.ai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format=TutorResponse,
            )
            return response.choices[0].message.parsed.model_dump()
        except Exception as e:
            logger.error(f"OpenAI tutor completion failed: {e}")
            return TutorResponse(
                answer="I encountered an error processing your question. Please try again.",
                is_grounded=False,
                citations=[],
            ).model_dump()


class GroqProvider(AIProvider):
    def __init__(self):
        try:
            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=settings.groq_api_key)
            self._model = "llama-3.3-70b-versatile"
        except ImportError:
            raise ImportError("groq package not installed")

    async def complete(self, messages: list[dict], schema: type | None = None) -> dict:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
            )
            return {"content": response.choices[0].message.content}
        except Exception as e:
            logger.error(f"Groq completion failed: {e}")
            raise

    async def complete_tutor(self, question: str, chunks: list[dict], grounded: bool) -> dict:
        from app.domain.tutor.response_schema import TutorResponse

        if not grounded:
            return TutorResponse(
                answer=(
                    "I don't have enough information in your uploaded materials to answer "
                    "this question accurately. Try uploading relevant study materials first."
                ),
                is_grounded=False,
                citations=[],
            ).model_dump()

        context = "\n\n".join(
            f"[Source: {c.get('document_name', 'unknown')}, Page {c.get('page_number', '?')}]\n{c.get('content', '')}"
            for c in chunks
        )

        system_prompt = (
            "You are a study tutor. Answer using ONLY the provided context. "
            "Cite sources by document name and page number. "
            "Never fabricate information not present in the context."
        )
        user_prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer based on the context above."

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            answer_text = response.choices[0].message.content or ""
            return TutorResponse(
                answer=answer_text,
                is_grounded=True,
                citations=[
                    {"document_name": c.get("document_name", "unknown"), "page_number": c.get("page_number"), "excerpt": c.get("content", "")[:200]}
                    for c in chunks[:3]
                ],
            ).model_dump()
        except Exception as e:
            logger.error(f"Groq tutor completion failed: {e}")
            return TutorResponse(
                answer="I encountered an error processing your question. Please try again.",
                is_grounded=False,
                citations=[],
            ).model_dump()

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError("Groq does not support embeddings")


class GeminiProvider(AIProvider):
    def __init__(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel("gemini-2.0-flash")
        except ImportError:
            raise ImportError("google-generativeai package not installed")

    async def complete(self, messages: list[dict], schema: type | None = None) -> dict:
        try:
            prompt = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
            response = await self._model.generate_content_async(prompt)
            return {"content": response.text}
        except Exception as e:
            logger.error(f"Gemini completion failed: {e}")
            raise

    async def complete_tutor(self, question: str, chunks: list[dict], grounded: bool) -> dict:
        from app.domain.tutor.response_schema import TutorResponse

        if not grounded:
            return TutorResponse(
                answer=(
                    "I don't have enough information in your uploaded materials to answer "
                    "this question accurately. Try uploading relevant study materials first."
                ),
                is_grounded=False,
                citations=[],
            ).model_dump()

        context = "\n\n".join(
            f"[Source: {c.get('document_name', 'unknown')}, Page {c.get('page_number', '?')}]\n{c.get('content', '')}"
            for c in chunks
        )

        prompt = (
            "You are a study tutor. Answer using ONLY the provided context.\n"
            f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
        )

        try:
            response = await self._model.generate_content_async(prompt)
            return TutorResponse(
                answer=response.text or "",
                is_grounded=True,
                citations=[
                    {"document_name": c.get("document_name", "unknown"), "page_number": c.get("page_number"), "excerpt": c.get("content", "")[:200]}
                    for c in chunks[:3]
                ],
            ).model_dump()
        except Exception as e:
            logger.error(f"Gemini tutor completion failed: {e}")
            return TutorResponse(
                answer="I encountered an error processing your question. Please try again.",
                is_grounded=False,
                citations=[],
            ).model_dump()

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError("Gemini does not support embeddings in this configuration")


class RetryableError(Exception):
    pass


class NonRetryableError(Exception):
    pass


def _is_retryable(error: Exception) -> bool:
    status = getattr(error, "status_code", None) or getattr(error, "status", None)
    if status is None:
        status_str = str(error).lower()
        if "429" in status_str or "rate limit" in status_str or "quota" in status_str:
            return True
        if "timeout" in status_str or "connection" in status_str:
            return True
        return False
    if status == 429 or status == 500 or status == 502 or status == 503 or status == 504:
        return True
    if status == 401 or status == 403 or status == 400 or status == 422:
        return False
    return False


def _build_provider_chain() -> list[AIProvider]:
    chain = []
    if settings.openai_api_key:
        chain.append(OpenAIProvider())
    if settings.groq_api_key:
        try:
            chain.append(GroqProvider())
        except ImportError:
            logger.warning("Groq provider skipped: groq package not installed")
    if settings.gemini_api_key:
        try:
            chain.append(GeminiProvider())
        except ImportError:
            logger.warning("Gemini provider skipped: google-generativeai package not installed")
    return chain


_provider_chain: list[AIProvider] | None = None


def get_ai_provider() -> AIProvider:
    global _provider_chain
    if _provider_chain is None:
        _provider_chain = _build_provider_chain()
    if not _provider_chain:
        raise RuntimeError("No LLM provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY.")
    return _provider_chain[0]


async def call_with_fallback(messages: list[dict], schema: type | None = None) -> dict:
    global _provider_chain
    if _provider_chain is None:
        _provider_chain = _build_provider_chain()
    last_error = None
    for provider in _provider_chain:
        try:
            return await provider.complete(messages, schema)
        except Exception as e:
            logger.warning(f"Provider {provider.__class__.__name__} failed: {e}")
            if _is_retryable(e):
                last_error = e
                continue
            raise NonRetryableError(str(e)) from e
    if last_error:
        raise RetryableError(f"All providers failed. Last error: {last_error}") from last_error
    raise RuntimeError("No LLM providers available")


async def embed_with_fallback(text: str) -> list[float]:
    global _provider_chain
    if _provider_chain is None:
        _provider_chain = _build_provider_chain()
    for provider in _provider_chain:
        try:
            return await provider.embed(text)
        except Exception as e:
            logger.warning(f"Provider {provider.__class__.__name__} embedding failed: {e}")
            continue
    raise RuntimeError("All embedding providers failed")
