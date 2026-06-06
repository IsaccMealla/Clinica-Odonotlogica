import codecs

try:
    with codecs.open('error.html', 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
        start = text.find('Exception Value:')
        if start != -1:
            end = text.find('</pre>', start)
            print("ERROR IS:", text[start:end+6])
        else:
            print("Exception Value not found")
except Exception as e:
    print(e)
