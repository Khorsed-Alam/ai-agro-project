import os

p = r'd:\AgroAI\firestore.rules'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '      allow create: if request.auth != null &&\n        (request.resource.data.ownerId == request.auth.uid ||\n         request.resource.data.userId == request.auth.uid);\n    }',
    '      allow create: if request.auth != null &&\n        (request.resource.data.ownerId == request.auth.uid ||\n         request.resource.data.userId == request.auth.uid);\n      allow delete: if request.auth != null;\n    }'
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("firestore.rules updated.")
