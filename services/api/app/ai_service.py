import os
from typing import List, Dict
import requests

AI_API_KEY = os.getenv("AI_API_KEY")
AI_API_URL = os.getenv("AI_API_URL", "https://api.groq.com/openai/v1/chat/completions")


def build_messages(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
) -> List[Dict[str, str]]:
    messages = [{"role": "system", "content": system_prompt}]

    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    messages.append({"role": "user", "content": user_message})
    return messages


def generate_ai_reply(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
) -> str:
    if not AI_API_KEY:
        return "Clé API IA absente."

    messages = build_messages(system_prompt, history, user_message)

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500
    }

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(AI_API_URL, json=payload, headers=headers, timeout=60)

    if response.status_code != 200:
        return f"Erreur IA: {response.status_code} - {response.text}"

    data = response.json()
    return data["choices"][0]["message"]["content"]