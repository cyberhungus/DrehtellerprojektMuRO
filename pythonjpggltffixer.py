import json

gltf_path = "static/models/Boot 5/Boot 5.gltf"  # Update path if needed
with open(gltf_path, 'r') as f:
    data = json.load(f)

for image in data.get('images', []):
    if 'uri' in image and image['uri'].endswith('.png'):
        image['uri'] = image['uri'].replace('.png', '.jpg')

with open(gltf_path, 'w') as f:
    json.dump(data, f, indent=4)

print("GLTF updated to load .jpg files!")