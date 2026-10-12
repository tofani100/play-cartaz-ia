import json

with open(r'C:\Users\Samsung\.gemini\antigravity\brain\aed199fb-6cbe-4ddb-802a-37f8e697c2c8\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        obj = json.loads(line)
        idx = obj.get('step_index')
        if idx in [49, 50, 51, 128, 129, 130, 157, 158]:
            print(f"=== STEP {idx} ({obj.get('type')}) ===")
            content = str(obj.get('content', ''))
            print(content[:1500])
            print("\n" + "="*50 + "\n")
