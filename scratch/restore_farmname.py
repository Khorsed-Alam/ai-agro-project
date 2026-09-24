import os

eco_p = r'd:\AgroAI\frontend\src\services\ecosystem.ts'
with open(eco_p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('_farmName', 'farmName')
c = c.replace('export async function createDefaultFieldsForFarm(\n  farmId: string,\n  ownerId: string,\n  farmName: string\n)', 'export async function createDefaultFieldsForFarm(\n  farmId: string,\n  ownerId: string,\n  _farmName: string\n)')

with open(eco_p, 'w', encoding='utf-8') as f:
    f.write(c)

farmer_p = r'd:\AgroAI\frontend\src\pages\FarmerDashboard.tsx'
with open(farmer_p, 'r', encoding='utf-8') as f:
    fc = f.read()

fc = fc.replace('_farmName', 'farmName')

with open(farmer_p, 'w', encoding='utf-8') as f:
    f.write(fc)

print('farmName restored.')
