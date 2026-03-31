import asyncio
import httpx

BASE = 'http://localhost:8001/api/v1'

async def main():
    async with httpx.AsyncClient() as c:
        r = await c.post(f'{BASE}/auth/login', json={'email': 'testdev@test.com', 'password': 'test123456'})
        token = r.json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print('Login OK')

        r = await c.post(f'{BASE}/tasks', json={
            'title': '准备下周一的汇报',
            'start_time': '2026-03-28T09:00:00',
            'duration_minutes': 90,
            'energy_level': 3,
        }, headers=headers)
        print('Task status:', r.status_code)
        task_id = r.json()['data']['id']
        print('task_id:', task_id)

        r = await c.post(f'{BASE}/tasks/{task_id}/decompose', json={
            'hint': '先做框架再填内容',
            'max_subtasks': 4,
        }, headers=headers, timeout=60.0)
        print('status:', r.status_code)
        import json
        print(json.dumps(r.json(), ensure_ascii=False, indent=2))

asyncio.run(main())
