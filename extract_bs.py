import html.parser
import codecs

class MyHTMLParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_pre = False
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag == 'pre':
            for attr in attrs:
                if attr[0] == 'class' and attr[1] == 'exception_value':
                    self.in_pre = True
            # sometimes it doesn't have a class
            self.in_pre = True

    def handle_endtag(self, tag):
        if tag == 'pre':
            self.in_pre = False

    def handle_data(self, data):
        if self.in_pre:
            self.text.append(data)

try:
    with codecs.open('error.html', 'r', encoding='utf-8', errors='ignore') as f:
        p = MyHTMLParser()
        p.feed(f.read())
        print("Exception Value is:", "".join(p.text).strip()[:1000])
except Exception as e:
    print(e)
