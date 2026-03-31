import asyncio
import httpx

BASE = 'http://localhost:8002/api/v1'

async def main():
    async with httpx.AsyncClient() as c:
        r = await c.post(f'{BASE}/auth/login', json={'email': 'testdev@test.com', 'password': 'test123456'})
        token = r.json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print('Login OK')

        # 创建父任务
        r = await c.post(f'{BASE}/tasks', json={
            'title': '准备下周一的汇报',
            'start_time': '2026-03-28T14:00:00',
            'duration_minutes': 90,
            'energy_level': 3,
        }, headers=headers)
        parent = r.json()['data']
        print(f'父任务: {parent["id"]} parent_id={parent.get("parent_id")}')

        # decompose
        r = await c.post(f'{BASE}/tasks/{parent["id"]}/decompose', json={'max_subtasks': 3}, headers=headers, timeout=60)
        subtasks = r.json()['data']['subtasks']
        print(f'AI 拆解: {len(subtasks)} 个子任务')

        # 创建子任务带 parent_id
        import json
        cursor = '2026-03-28T14:00:00'
        from datetime import datetime, timedelta
        t = datetime.fromisoformat(cursor)
        for s in subtasks:
            r = await c.post(f'{BASE}/tasks', json={
                'title': s['title'],
                'start_time': t.isoformat(),
                'duration_minutes': s['duration_minutes'],
                'color': s['color'],
                'energy_level': s['energy_level'],
                'parent_id': parent['id'],
            }, headers=headers)
            child = r.json()['data']
            print(f'  子任务: {child["title"][:20]} parent_id={child.get("parent_id")}')
            t += timedelta(minutes=s['duration_minutes'])

asyncio.run(main())
