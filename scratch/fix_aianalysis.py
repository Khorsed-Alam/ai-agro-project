import os

p = r'd:\AgroAI\frontend\src\pages\AIAnalysis.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<text class="fill-on-surface-variant font-data-mono text-[10px]" x="188" y="88">High Sinkage</text>',
    '<text className="fill-on-surface-variant font-data-mono text-[10px]" x="188" y="88">High Sinkage</text>'
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('AIAnalysis SVG text class fixed successfully.')
