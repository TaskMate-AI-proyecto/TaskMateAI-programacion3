import google.generativeai as genai
from src.config.settings import settings


def get_gemini_client():
    genai.configure(api_key=settings.gemini_api_key)
    return genai


async def chat_with_gemini(message: str, history: list[dict] | None = None) -> str:
    try:
        client = get_gemini_client()
        model = client.GenerativeModel("gemini-pro")

        messages = []
        if history:
            for msg in history:
                messages.append({
                    "role": msg.get("role", "user"),
                    "parts": [msg.get("content", "")]
                })

        messages.append({
            "role": "user",
            "parts": [message]
        })

        response = model.generate_content(
            contents=messages[-1]["parts"],
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048,
            )
        )

        return response.text
    except Exception as e:
        raise ValueError(f"Error communicating with Gemini: {str(e)}")
