import re

NUM = re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?')
ARGC = {'M':2,'L':2,'H':1,'V':1,'C':6,'S':4,'Q':4,'T':2,'A':7,'Z':0}

def tokens(d):
    """Yield (cmd, [args]) tuples."""
    i, n = 0, len(d)
    cmd = None
    while i < n:
        ch = d[i]
        if ch.isalpha():
            cmd, i = ch, i + 1
            if cmd in 'Zz':
                yield ('Z', [])
                cmd = None
            continue
        if ch in ' ,\t\r\n':
            i += 1
            continue
        k = ARGC[cmd.upper()]
        args = []
        while len(args) < k:
            m = NUM.match(d, i)
            if not m:
                break
            # arc flags are single digits, unseparated
            if cmd.upper() == 'A' and len(args) in (3, 4):
                args.append(float(d[i]))
                i += 1
            else:
                args.append(float(m.group()))
                i = m.end()
            while i < n and d[i] in ' ,\t\r\n':
                i += 1
        yield (cmd, args)
        if cmd == 'M':
            cmd = 'L'
        elif cmd == 'm':
            cmd = 'l'

def endpoints(d):
    """All on-curve points of a subpath, in absolute coords."""
    pts, cx, cy, sx, sy = [], 0.0, 0.0, 0.0, 0.0
    for cmd, a in tokens(d):
        u = cmd.upper()
        rel = cmd.islower()
        if u == 'Z':
            cx, cy = sx, sy
            continue
        if u == 'H':
            cx = cx + a[0] if rel else a[0]
        elif u == 'V':
            cy = cy + a[0] if rel else a[0]
        else:
            x, y = a[-2], a[-1]
            cx, cy = (cx + x, cy + y) if rel else (x, y)
        if u == 'M':
            sx, sy = cx, cy
        pts.append((cx, cy))
    return pts

def bbox(d):
    p = endpoints(d)
    xs, ys = [q[0] for q in p], [q[1] for q in p]
    return min(xs), min(ys), max(xs), max(ys)

def subpaths(d):
    return [s.strip() for s in re.split(r'(?=[Mm])', d) if s.strip()]
