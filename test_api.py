
import urllib.request
import json
req = urllib.request.Request('http://127.0.0.1:8000/api/login/', data=b'{\"username\":\"admin\",\"password\":\"admin\"}', headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['access']
    req2 = urllib.request.Request('http://127.0.0.1:8000/api/citas/', headers={'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    print(res2.read().decode('utf-8'))
except Exception as e:
    print(e.read().decode('utf-8') if hasattr(e, 'read') else str(e))

