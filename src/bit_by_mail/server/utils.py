import json
import re
import importlib.metadata
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

async def check_for_updates():
    try:
        current_version = importlib.metadata.version("bit-by-mail")
        client = AsyncHTTPClient()
        req = HTTPRequest(
            url="https://pypi.org/simple/bit-by-mail/",
            headers={"Accept": "application/vnd.pypi.simple.v1+json"},
            user_agent="bit-by-mail"
        )
        res = await client.fetch(req)
        data = json.loads(res.body)
        versions = data.get("versions", [])
        if versions:
            latest_version = versions[-1]
            def parse_v(v):
                return [int(x) for x in re.findall(r'\d+', v)]

            if parse_v(latest_version) > parse_v(current_version):
                print("\n" + "="*60)
                print(f"🚀 UPDATE AVAILABLE: A new version of bit-by-mail is out!")
                print(f"   Current version: {current_version}")
                print(f"   Latest version:  {latest_version}")
                print(f"\n   To update, stop this server (Ctrl+C) and run:")
                print(f"   pip install --upgrade bit-by-mail")
                print("="*60 + "\n")
    except Exception:
        pass
