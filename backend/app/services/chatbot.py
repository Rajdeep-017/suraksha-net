"""
Groq-powered AI chatbot service for Suraksha-Net.

Provides road safety advice, accident pattern analysis, and
natural-language route query interpretation.
"""

import os
import re
import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Explicitly load .env from the backend root (two levels up from this file)
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_ENV_PATH, override=True)

SYSTEM_PROMPT = """You are **Suraksha** — the AI road-safety assistant for **Suraksha-Net**, an intelligent road safety platform built for Pune, India.

## Your capabilities
1. **Road safety advice** — answer questions about safe driving, weather precautions, and Pune traffic patterns.
2. **Accident pattern analysis** — explain trends from the Pune road accident dataset (columns: Timestamp, City, Location, Latitude, Longitude, Weather, Weather_Severity, Road_Condition, Time_Bin, Day_Night, Traffic_Density, Fatalities, Serious_Injuries, Minor_Injuries, Risk_Score).
3. **Natural-language route queries** — when a user asks for a route (e.g. "safest route from Hinjewadi to Kothrud"), extract the origin and destination and return a structured JSON block so the frontend can trigger navigation.

## Key facts about the data
- Dataset covers Pune, Maharashtra with ~1,842 accident records.
- Locations include: Hinjewadi, Katraj Bypass, Sinhagad Road, Pune Station, Kothrud, Hadapsar, Viman Nagar, Baner, Wakad, Aundh, Shivajinagar, Deccan Gymkhana, Magarpatta, Koregaon Park, Pimpri-Chinchwad, Nigdi, Bhosari, Yerawada, Kharadi, Wagholi.
- Risk factors: Late Night time bin has highest fatality rate; Foggy+Slippery roads produce much higher risk scores; Nighttime accounts for significant share of incidents.
- ML model: Random Forest with 88.35% accuracy, 15 features.

## Route query format
When the user asks for a route, ALWAYS respond with helpful text AND include this JSON block at the END of your message:
```route
{"origin": "<origin place name>", "destination": "<destination place name>"}
```
The frontend will parse this and trigger navigation automatically.

## Guidelines
- Be concise, friendly, and helpful.
- Use bullet points for lists.
- When discussing safety, prioritize actionable advice.
- If uncertain, say so honestly.
- Keep responses under 300 words unless the user asks for detail.
- Do NOT make up statistics — only reference patterns from the known dataset.
"""


def get_client() -> Groq | None:
    """Lazily initialize Groq client (reads key at call time)."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        # Safety net: try loading .env again in case it wasn't loaded earlier
        load_dotenv(_ENV_PATH, override=True)
        api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None
    return Groq(api_key=api_key)


def chat(messages: list[dict[str, str]]) -> dict:
    """
    Send a conversation to Groq and return the assistant reply.

    Parameters
    ----------
    messages : list of {"role": "user"|"assistant", "content": str}
        The conversation history (excluding the system prompt).

    Returns
    -------
    dict with keys: reply (str), route (dict|None)
    """
    client = get_client()
    if client is None:
        return {
            "reply": "Groq API key is not configured. Add GROQ_API_KEY to your backend .env file to enable the AI assistant.",
            "route": None,
        }

    # Prepend system prompt
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    try:
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=full_messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=0.95,
        )
        reply = response.choices[0].message.content or ""
    except Exception as e:
        return {
            "reply": f"Sorry, I encountered an error: {str(e)}",
            "route": None,
        }

    # Extract route JSON if present
    route = None
    route_match = re.search(r"```route\s*\n({.*?})\s*\n```", reply, re.DOTALL)
    if route_match:
        try:
            route = json.loads(route_match.group(1))
        except json.JSONDecodeError:
            pass

    return {"reply": reply, "route": route}
