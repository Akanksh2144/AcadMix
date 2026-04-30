#!/usr/bin/env python3
"""
Set Supabase Edge Function secrets for Insights Engine v2.
Run: python set_edge_secrets.py

Requires: SUPABASE_ACCESS_TOKEN environment variable
Get token from: https://supabase.com/dashboard/account/tokens
"""
import os
import json
import urllib.request

PROJECT_REF = "axjhruxfwzymagaztney"
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")

if not TOKEN:
    TOKEN = input("Enter your Supabase access token (https://supabase.com/dashboard/account/tokens): ").strip()

# Load the service account JSON from .env
from pathlib import Path
env_path = Path(__file__).parent / ".env"
sa_json = ""
with open(env_path) as f:
    for line in f:
        if line.startswith("VERTEX_CREDENTIALS_JSON="):
            sa_json = line.split("=", 1)[1].strip().strip("'\"")
            break

if not sa_json:
    print("ERROR: VERTEX_CREDENTIALS_JSON not found in .env")
    exit(1)

secrets = [
    {"name": "GCP_PROJECT_ID", "value": "acadmix-production"},
    {"name": "GCP_LOCATION", "value": "us-central1"},
    {"name": "GOOGLE_SERVICE_ACCOUNT_JSON", "value": sa_json},
]

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/secrets"

for secret in secrets:
    data = json.dumps([secret]).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    })
    try:
        resp = urllib.request.urlopen(req)
        print(f"✓ Set {secret['name']}")
    except urllib.error.HTTPError as e:
        print(f"✗ Failed {secret['name']}: {e.read().decode()}")

print("\nDone! Edge Function secrets configured.")
