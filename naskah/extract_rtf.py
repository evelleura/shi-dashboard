"""
RTF to plain text converter with proper nested group handling.
Strips all formatting, images, and metadata - preserves only text content.
"""
import re

INPUT = r'D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\naskah\Naskah TA 12-03-26-bak.rtf'
OUTPUT = r'D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\naskah\thesis_text.txt'

with open(INPUT, 'r', encoding='utf-8', errors='replace') as f:
    rtf = f.read()

# Destinations to skip entirely (their content is metadata, not document text)
SKIP_DESTINATIONS = {
    'fonttbl', 'colortbl', 'stylesheet', 'listtable', 'listoverridetable',
    'info', 'pict', 'blipuid', 'datafield', 'themedata', 'colorschememapping',
    'latentstyles', 'datastore', 'mmathPr', 'generator', 'operator',
    'fldinst', 'xmlnstbl', 'ftnsep', 'ftnsepc', 'aftnsep', 'aftnsepc',
    'header', 'headerl', 'headerr', 'headerf', 'footer', 'footerl',
    'footerr', 'footerf', 'pnseclvl', 'pgptbl',
    'revtbl', 'rsidtbl', 'panose', 'picprop', 'sp', 'shp', 'shpinst',
    'shprslt', 'nonshppict', 'objdata', 'objclass', 'result',
    'object', 'objemb', 'word', 'atnid', 'atnauthor', 'atndate',
    'atnicn', 'annotation', 'atnref', 'atrfstart', 'atrfend',
}

# These control words produce text output
TEXT_CONTROLS = {
    'par': '\n',
    'line': '\n',
    'tab': '\t',
    'cell': '\t',
    'row': '\n',
    'page': '\n\n',
    'sectd': '',
    'endash': '-',
    'emdash': '--',
    'bullet': '* ',
    'lquote': "'",
    'rquote': "'",
    'ldblquote': '"',
    'rdblquote': '"',
    '~': ' ',  # non-breaking space
}


def rtf_to_text(raw):
    """Parse RTF using a stack-based state machine to handle nested groups."""
    output = []
    i = 0
    length = len(raw)

    # Stack: each entry is (skip_depth, in_skip)
    # skip_depth tracks how many levels of skipped groups we're in
    group_stack = []
    skip = False  # whether current group content should be skipped
    skip_depth = 0  # nesting depth within skipped groups

    while i < length:
        ch = raw[i]

        if ch == '{':
            group_stack.append(skip)
            # Check if this group starts with \* (optional destination)
            # or a known skip destination
            j = i + 1
            # Skip whitespace
            while j < length and raw[j] in ' \r\n':
                j += 1

            if j < length and raw[j] == '\\':
                # Check for \* pattern
                if j + 1 < length and raw[j + 1] == '*':
                    # Optional destination - check what follows
                    k = j + 2
                    while k < length and raw[k] in ' \r\n':
                        k += 1
                    if k < length and raw[k] == '\\':
                        m = re.match(r'\\([a-zA-Z]+)', raw[k:])
                        if m:
                            dest_name = m.group(1).lower()
                            if dest_name in SKIP_DESTINATIONS:
                                skip = True
                            # Skip all \* groups as they're optional metadata
                            skip = True
                    else:
                        skip = True
                else:
                    # Check for destination without \*
                    m = re.match(r'\\([a-zA-Z]+)', raw[j:])
                    if m:
                        dest_name = m.group(1).lower()
                        if dest_name in SKIP_DESTINATIONS:
                            skip = True

            if skip:
                skip_depth += 1
            i += 1

        elif ch == '}':
            if skip_depth > 0:
                skip_depth -= 1
            if group_stack:
                skip = group_stack.pop()
            else:
                skip = False
            if skip_depth == 0 and not skip:
                skip = False
            i += 1

        elif ch == '\\' and not skip:
            i += 1
            if i >= length:
                break
            ch2 = raw[i]

            if ch2 == '\\':
                output.append('\\')
                i += 1
            elif ch2 == '{':
                output.append('{')
                i += 1
            elif ch2 == '}':
                output.append('}')
                i += 1
            elif ch2 == '~':
                output.append(' ')  # non-breaking space
                i += 1
            elif ch2 == '_':
                output.append('-')  # non-breaking hyphen
                i += 1
            elif ch2 == "'":
                # Hex-encoded char: \'XX
                if i + 2 < length:
                    hex_str = raw[i+1:i+3]
                    try:
                        code = int(hex_str, 16)
                        if code > 31:  # skip control chars
                            output.append(chr(code))
                    except ValueError:
                        pass
                    i += 3
                else:
                    i += 1
            elif ch2 == '\r' or ch2 == '\n':
                # Escaped newline = \par equivalent
                output.append('\n')
                i += 1
            elif ch2 == '*':
                # \* - we handle this at group level
                i += 1
            elif ch2.isalpha():
                # Control word
                m = re.match(r'([a-zA-Z]+)(-?\d+)?[ ]?', raw[i:])
                if m:
                    word = m.group(1).lower()
                    i += m.end()

                    if word == 'u':
                        # Unicode escape: \uN
                        num_str = m.group(2)
                        if num_str:
                            code = int(num_str)
                            if code < 0:
                                code += 65536
                            try:
                                output.append(chr(code))
                            except (ValueError, OverflowError):
                                output.append('?')
                            # Skip the replacement char that follows
                            if i < length and raw[i] == '?':
                                i += 1
                    elif word in TEXT_CONTROLS:
                        output.append(TEXT_CONTROLS[word])
                    # else: formatting control word, skip it
                else:
                    i += 1
            else:
                i += 1

        elif ch == '\\' and skip:
            # Inside skip group, just advance past control words
            i += 1
            if i < length:
                ch2 = raw[i]
                if ch2 == "'" and i + 2 < length:
                    i += 3
                elif ch2.isalpha():
                    m = re.match(r'[a-zA-Z]+(-?\d+)?[ ]?', raw[i:])
                    if m:
                        i += m.end()
                    else:
                        i += 1
                else:
                    i += 1
        else:
            if not skip and ch not in '\r\n':
                output.append(ch)
            i += 1

    text = ''.join(output)

    # Remove long hex strings (image data that leaked through)
    text = re.sub(r'[0-9a-f]{40,}', '', text)

    # Clean up
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' *\n *', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


extracted = rtf_to_text(rtf)

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(extracted)

print(f"TOTAL LENGTH: {len(extracted)} chars")
print(f"SAVED TO: {OUTPUT}")
# Preview first 3000 chars
print("---PREVIEW---")
print(extracted[:3000])
