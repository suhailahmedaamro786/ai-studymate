import logging
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

_client = AsyncOpenAI(api_key=settings.openai_api_key)


class AIProvider:
    async def complete(self, messages: list[dict], schema: type) -> dict:
        raise NotImplementedError

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError

    async def complete_tutor(self, question: str, chunks: list[dict], grounded: bool) -> "TutorResult":
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    async def complete(self, messages: list[dict], schema: type) -> dict:
        try:
            response = await _client.beta.chat.completions.parse(
                model=settings.ai_model,
                messages=messages,
                response_format=schema,
            )
            return response.choices[0].message.parsed.model_dump()
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            raise

    async def embed(self, text: str) -> list[float]:
        try:
            response = await _client.embeddings.create(
                model=settings.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            raise

    async def complete_tutor(self, question: str, chunks: list[dict], grounded: bool) -> "TutorResult":
        from app.domain.tutor.response_schema import TutorResponse, Citation

        if not grounded:
            return TutorResponse(
                answer=(
                    "I don't have enough information in your uploaded materials to answer "
                    "this question accurately. Try uploading relevant study materials first, "
                    "or ask a question about content that is in your documents."
                ),
                is_grounded=False,
                citations=[],
            )

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

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        try:
            response = await _client.beta.chat.completions.parse(
                model=settings.ai_model,
                messages=messages,
                response_format=TutorResponse,
            )
            parsed = response.choices[0].message.parsed
            return parsed
        except Exception as e:
            logger.error(f"Tutor completion failed: {e}")
            return TutorResponse(
                answer="I encountered an error processing your question. Please try again.",
                is_grounded=False,
                citations=[],
            )


class TutorResult:
    def __init__(self, answer: str, is_grounded: bool, citations: list):
        self.answer = answer
        self.is_grounded = is_grounded
        self.citations = citations


_provider: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    global _provider
    if _provider is None:
        _provider = OpenAIProvider()
    return _provider
