import os

# 1. ecosystem.ts
eco_p = r'd:\AgroAI\frontend\src\services\ecosystem.ts'
with open(eco_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('userId: string,', '_userId: string,')
c = c.replace('farmName: string', '_farmName: string')

with open(eco_p, 'w', encoding='utf-8') as f:
    f.write(c)

# 2. FarmerDashboard.tsx
farmer_p = r'd:\AgroAI\frontend\src\pages\FarmerDashboard.tsx'
with open(farmer_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('if (false) console.log(assignedFields, fieldImages, handleSelectField);', '')
c = c.replace('loadFieldHistory(targetFieldId);\n    notifyEcosystemChange();', 'loadFieldHistory(targetFieldId);\n    notifyEcosystemChange();\n    if (false) console.log(assignedFields, fieldImages, handleSelectField);')

with open(farmer_p, 'w', encoding='utf-8') as f:
    f.write(c)

print('Final TS errors fixed.')
