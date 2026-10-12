import json

p = r'C:\Users\Samsung\.gemini\antigravity\brain\3bb74701-2aa2-4011-b5f7-ad98ad45597c\.system_generated\logs\transcript.jsonl'
with open(p, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('type') == 'USER_INPUT':
            print(f"Step {obj.get('step_index')}:")
            print(str(obj.get('content', ''))[:500])
            print('-'*40)
