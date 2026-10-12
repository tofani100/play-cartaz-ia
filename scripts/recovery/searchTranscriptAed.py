import json
import re

paths = [
    r'C:\Users\Samsung\.gemini\antigravity\brain\aed199fb-6cbe-4ddb-802a-37f8e697c2c8\.system_generated\logs\transcript.jsonl',
]

for p in paths:
    print(f'Checking {p}...')
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if 'Paganini' in line or 'Brasilê' in line or 'Brasile' in line:
                try:
                    obj = json.loads(line)
                    content = str(obj.get('content', ''))
                    # Look for imageUrl or base64 or prompts
                    urls = re.findall(r'https?://[^\s",\']+', content)
                    print(f"Step {obj.get('step_index')}: found {len(urls)} URLs")
                    for u in urls[:5]:
                        print("   URL:", u[:100])
                    # Look for image files mentioned
                    imgs = re.findall(r'[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)', content)
                    if imgs:
                        print("   Images:", imgs[:10])
                except Exception as e:
                    pass
