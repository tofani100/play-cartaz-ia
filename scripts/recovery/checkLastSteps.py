import json, sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Samsung\.gemini\antigravity\brain\3bb74701-2aa2-4011-b5f7-ad98ad45597c\.system_generated\logs\transcript.jsonl'
with open(p, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    for l in lines[-10:]:
        obj = json.loads(l)
        print(f"Step {obj.get('step_index')}: {obj.get('type')}")
        if obj.get('type') == 'PLANNER_RESPONSE':
            print(str(obj.get('content', ''))[:800])
            print('='*50)
