"""Quick test: send a WhatsApp message via Meta Cloud API."""
import asyncio
import httpx

PHONE_NUMBER_ID = "1118318808023968"
ACCESS_TOKEN = "EAASLGuf9IEEBRCIDK8Es2ewdYMw3fgEnTG2VZAM84ZA8Kpo8KLpwIaHvFHbmTp6gmrdBmHvIZAZCIavwxODi0xw2ONTLB0k9a1SJzQqngoiMep1jHwuCl8V3hUudK864Gj5Gj8bCwyrPKfUVNWByWwRrxnm8PwOVwKsg2C3Y05LqaAIcCzZBzgCNxExOW0mnmsQiCc8hyXRWlUNYDCgOdI69nsiKgMxywCzi1JSvEk46d5Sf7Bxi2IZBRqdH8j4oFomx0pM7wueB7besc6fE3rq0j5"
TO_PHONE = "917680979214"

async def main():
    url = f"https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": TO_PHONE,
        "type": "text",
        "text": {"body": "\U0001f44b *Namaste! I'm Ami* \u2014 your child's college assistant.\n\nHere's what I can help you with:\n\n\U0001f4ca  *attendance* \u2014 Attendance report\n\U0001f393  *grades* \u2014 Semester grades & CGPA\n\U0001f4c5  *timetable* \u2014 Today's classes\n\U0001f4da  *subjects* \u2014 Current subjects & faculty\n\U0001f4cb  *exams* \u2014 Exam schedule\n\U0001f4dd  *marks* \u2014 CIA / internal marks\n\U0001f468\u200d\U0001f3eb  *mentor* \u2014 Mentor details\n\U0001f4b0  *fees* \u2014 Fee payment status\n\U0001f3af  *placements* \u2014 Placement updates\n\U0001f4c4  *report* \u2014 Full progress report link\n\nJust type any keyword! \U0001f680"},
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json=payload, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

asyncio.run(main())
