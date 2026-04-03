import re
import sys

with open(r'D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\naskah\Naskah TA 12-03-26-bak.rtf', 'r', encoding='utf-8', errors='replace') as f:
    rtf = f.read()

BACKSLASH_PLACEHOLDER = '\x00BS\x00'
BACKSLASH_CHAR = chr(92)

def strip_rtf(text):
    # Remove picture/binary data
    text = re.sub(r'\{\\pict[^}]*\}', '', text)

    # Remove \* destination groups iteratively
    pattern = re.compile(r'\{\\\*\\[a-z]+[^}]*\}', re.DOTALL)
    prev = None
    while prev != text:
        prev = text
        text = pattern.sub('', text)

    # Handle unicode escapes: \uN? or \uN<space>
    def unicode_repl(m):
        code = int(m.group(1))
        if code < 0:
            code += 65536
        try:
            return chr(code)
        except Exception:
            return '?'
    text = re.sub(r'\\u(-?\d+)\?', unicode_repl, text)
    text = re.sub(r'\\u(-?\d+) ', unicode_repl, text)

    # Handle escaped special chars
    text = text.replace(BACKSLASH_CHAR + BACKSLASH_CHAR, BACKSLASH_PLACEHOLDER)
    text = text.replace(BACKSLASH_CHAR + '{', '{')
    text = text.replace(BACKSLASH_CHAR + '}', '}')

    # Remove braces
    text = text.replace('{', '')
    text = text.replace('}', '')

    # Convert control words to text
    text = re.sub(r'\\par\b\s*', '\n', text)
    text = re.sub(r'\\line\b\s*', '\n', text)
    text = re.sub(r'\\tab\b\s*', '\t', text)
    text = re.sub(r'\\cell\b\s*', '\t', text)
    text = re.sub(r'\\row\b\s*', '\n', text)
    text = re.sub(r'\\page\b\s*', '\n\n', text)
    text = re.sub(r'\\endash\b', '-', text)
    text = re.sub(r'\\emdash\b', '--', text)
    text = re.sub(r'\\bullet\b', '* ', text)
    text = re.sub(r'\\lquote\b', "'", text)
    text = re.sub(r'\\rquote\b', "'", text)
    text = re.sub(r'\\ldblquote\b', '"', text)
    text = re.sub(r'\\rdblquote\b', '"', text)

    # Remove remaining control words (e.g., \b, \i, \fs24, etc.)
    text = re.sub(r'\\[a-zA-Z]+\d*\s?', '', text)
    text = re.sub(r'\\\*', '', text)

    # Restore backslash
    text = text.replace(BACKSLASH_PLACEHOLDER, BACKSLASH_CHAR)

    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' *\n *', '\n', text)

    return text.strip()

extracted = strip_rtf(rtf)

out_path = r'D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\naskah\thesis_text.txt'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(extracted)

print(f"TOTAL LENGTH: {len(extracted)} chars")
print(f"SAVED TO: {out_path}")
