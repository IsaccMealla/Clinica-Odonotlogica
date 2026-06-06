import urllib.request, json, re

try:
    req_auth = urllib.request.Request('http://localhost:8000/api/login/', data=json.dumps({'username':'tempadmin', 'password':'temppassword'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    token = json.loads(urllib.request.urlopen(req_auth).read().decode('utf-8'))['access']
    req = urllib.request.Request('http://localhost:8000/api/citas/', headers={'Authorization': 'Bearer ' + token})
    res = urllib.request.urlopen(req).read().decode('utf-8')
    print('OK:', res[:200])
except Exception as e:
    text = e.read().decode('utf-8')
    match = re.search(r'<pre class="exception_value">(.*?)</pre>', text, re.DOTALL)
    if match:
        print('Exception:', match.group(1).strip())
    else:
        print('Exception not found in html, here is snippet:', text[:500])
