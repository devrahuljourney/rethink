"""Regenerates every app icon from the "r." mark. Run from the app root:
   python3 scripts/app-icon/export.py assets/fonts/Bricolage-ExtraBold.ttf .
"""
import sys, os, json
sys.argv = [sys.argv[0], sys.argv[1], '/dev/null'] + sys.argv[2:]
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
import make_icon as m

root = sys.argv[3]
res = os.path.join(root, 'android/app/src/main/res')
for dens, legacy in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    d = os.path.join(res, f'mipmap-{dens}')
    os.makedirs(d, exist_ok=True)
    m.render(legacy, 'square').save(os.path.join(d, 'ic_launcher.png'))
    m.render(legacy, 'round').save(os.path.join(d, 'ic_launcher_round.png'))
    m.render(round(legacy * 108 / 48), 'foreground').save(os.path.join(d, 'ic_launcher_foreground.png'))

iconset = os.path.join(root, 'ios/rethink/Images.xcassets/AppIcon.appiconset')
contents = json.load(open(os.path.join(iconset, 'Contents.json')))
for img in contents['images']:
    pts = float(img['size'].split('x')[0])
    scale = int(img['scale'].rstrip('x'))
    px = round(pts * scale)
    name = f"icon-{img['size']}@{scale}x.png"
    m.render(px, 'full').save(os.path.join(iconset, name))
    img['filename'] = name
json.dump(contents, open(os.path.join(iconset, 'Contents.json'), 'w'), indent=2)
os.makedirs(os.path.join(here, 'out'), exist_ok=True)
m.render(512, 'full').save(os.path.join(here, 'out', 'play-store-512.png'))
print('done', len(contents['images']), 'ios images')
