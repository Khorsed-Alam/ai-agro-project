import os

base = r'd:\AgroAI\frontend\src'

# 1. Update App.tsx
app_path = os.path.join(base, 'App.tsx')
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

if 'ChatPage' not in app_content:
    app_content = app_content.replace(
        "import { Settings } from './pages/Settings';",
        "import { Settings } from './pages/Settings';\nimport { ChatPage } from './pages/ChatPage';"
    )
    app_content = app_content.replace(
        '<Route path="farmer-dashboard" element={<FarmerDashboard />} />',
        '<Route path="farmer-dashboard" element={<FarmerDashboard />} />\n            <Route path="messages" element={<ChatPage />} />'
    )
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_content)
    print("App.tsx patched.")

# 2. Update Navigation.tsx
nav_path = os.path.join(base, 'components', 'Navigation.tsx')
with open(nav_path, 'r', encoding='utf-8') as f:
    nav_content = f.read()

if '/messages' not in nav_content:
    nav_content = nav_content.replace(
        "{ name: 'Dashboard', path: '/dashboard', icon: 'home' },",
        "{ name: 'Dashboard', path: '/dashboard', icon: 'home' },\n        { name: '1-to-1 Chat', path: '/messages', icon: 'chat' },"
    )
    with open(nav_path, 'w', encoding='utf-8') as f:
        f.write(nav_content)
    print("Navigation.tsx patched.")

print("Patch script initial complete.")
