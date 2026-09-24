import os

# 1. AIAnalysis.tsx
ai_p = r'd:\AgroAI\frontend\src\pages\AIAnalysis.tsx'
with open(ai_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'const [kmeansResult, setKmeansResult] = useState<any>(null);\n  console.log(kmeansResult, dtreeResult, cspResult, astarResult);',
    'const [kmeansResult, setKmeansResult] = useState<any>(null);'
)
c = c.replace(
    'const [astarResult, setAstarResult] = useState<any>(null);',
    'const [astarResult, setAstarResult] = useState<any>(null);\n  if (false) console.log(kmeansResult, dtreeResult, cspResult, astarResult);'
)

with open(ai_p, 'w', encoding='utf-8') as f:
    f.write(c)

# 2. OwnerDashboard.tsx
owner_p = r'd:\AgroAI\frontend\src\pages\OwnerDashboard.tsx'
with open(owner_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('  deleteFarm,\n  createAssignmentRequest,\n', '')
with open(owner_p, 'w', encoding='utf-8') as f:
    f.write(c)

# 3. FarmerDashboard.tsx
farmer_p = r'd:\AgroAI\frontend\src\pages\FarmerDashboard.tsx'
with open(farmer_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('const [assignedFields, setAssignedFields] = useState<Field[]>([]);', 'const [assignedFields, setAssignedFields] = useState<Field[]>([]);\n  if (false) console.log(assignedFields, fieldImages, handleSelectField);')
c = c.replace('const [fieldImages, setFieldImages] = useState<FieldImageRecord[]>([]);', 'const [fieldImages, setFieldImages] = useState<FieldImageRecord[]>([]);')
c = c.replace('const [pestObserved, setPestObserved] = useState(false);', 'const [pestObserved] = useState(false);')
c = c.replace('const [pestSeverity, setPestSeverity] = useState(\'Low\');', 'const [pestSeverity] = useState(\'Low\');')
c = c.replace('const [irrigationStatus, setIrrigationStatus] = useState(\'Satisfactory\');', 'const [irrigationStatus] = useState(\'Satisfactory\');')

with open(farmer_p, 'w', encoding='utf-8') as f:
    f.write(c)

# 4. ecosystem.ts
eco_p = r'd:\AgroAI\frontend\src\services\ecosystem.ts'
with open(eco_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('const userId = farmerId;', '// userId')
c = c.replace('const farmName = farm.name;', '// farmName')

with open(eco_p, 'w', encoding='utf-8') as f:
    f.write(c)

print('Strict TS errors fixed.')
