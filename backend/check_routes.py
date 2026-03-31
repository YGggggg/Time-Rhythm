import urllib.request, json
r = urllib.request.urlopen('http://localhost:8001/openapi.json')
data = json.load(r)
for p in data['paths']:
    print(p)
