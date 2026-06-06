import urllib.request
from urllib.error import HTTPError
import re

try:
    req = urllib.request.Request("http://localhost:8000/api/citas/", headers={'User-Agent': 'Mozilla/5.0'})
    urllib.request.urlopen(req)
    print("Success")
except HTTPError as e:
    html = e.read().decode('utf-8')
    title = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    print("Title:", title.group(1).strip() if title else "No title")
    
    exception = re.search(r'Exception Value:.*?<pre.*?>(.*?)</pre>', html, re.IGNORECASE | re.DOTALL)
    if exception:
        print("Exception Value:", exception.group(1).strip())
    else:
        # Fallback to look for the first exception-value class
        exception2 = re.search(r'<table class="meta">.*?<th>Exception Value:</th>\s*<td><pre>(.*?)</pre></td>', html, re.IGNORECASE | re.DOTALL)
        if exception2:
            print("Exception Value:", exception2.group(1).strip())
        else:
            print("Could not parse exception value. Saving to error.html")
            with open("error.html", "w") as f:
                f.write(html)
except Exception as e:
    print("Error:", e)
