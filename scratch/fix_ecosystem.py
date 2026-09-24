import os

p = r'd:\AgroAI\frontend\src\services\ecosystem.ts'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add humidity and rainfall to Field interface
if 'humidity?: number;' not in c:
    c = c.replace(
        '  temperature?: number;\n  nitrogen?: number;',
        '  temperature?: number;\n  humidity?: number;\n  rainfall?: number;\n  nitrogen?: number;'
    )

# 2. Fix line 463
import re
c = re.sub(r'const fId = [^\n]+;', 'const fId = `field_${farmId}_${i + 1}`;', c)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('ecosystem.ts fixed successfully.')
