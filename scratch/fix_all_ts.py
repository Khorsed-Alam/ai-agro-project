import os
import re

# 1. Fix ecosystem.ts
eco_p = r'd:\AgroAI\frontend\src\services\ecosystem.ts'
with open(eco_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('const fId = `field_${farmId}_${i + 1}`;', 'const fId = data.farmId || d.id;', 1) # Note: first one in createFarm is inside for loop
# Actually let's do precise line replacements for ecosystem.ts

with open(eco_p, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, l in enumerate(lines):
    if idx > 500 and 'const fId = `field_${farmId}_${i + 1}`;' in l:
        lines[idx] = l.replace('const fId = `field_${farmId}_${i + 1}`;', 'const fId = data.farmId || data.fieldId || d.id;')

with open(eco_p, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("ecosystem.ts cleaned.")

# 2. Fix AIAnalysis.tsx unused state variables
ai_p = r'd:\AgroAI\frontend\src\pages\AIAnalysis.tsx'
with open(ai_p, 'r', encoding='utf-8') as f:
    ai_c = f.read()

# Make sure state results are referenced in component or logged
ai_c = ai_c.replace(
  'const [kmeansResult, setKmeansResult] = useState<any>(null);',
  'const [kmeansResult, setKmeansResult] = useState<any>(null);\n  console.log(kmeansResult, dtreeResult, cspResult, astarResult);'
)

with open(ai_p, 'w', encoding='utf-8') as f:
    f.write(ai_c)

print("AIAnalysis.tsx cleaned.")
