from PIL import Image
SRC='/root/.claude/uploads/b6b8eada-75a0-54f3-b222-a2be738b17b2/8b95bb27-image.jpg'
im=Image.open(SRC).convert('RGB'); s=1236/1110
boxes={'logo':(405,0,750,95),'collage':(48,250,640,815),'cat':(72,847,382,1157),
 'coffee':(422,847,732,1157),'dog':(770,847,1081,1157),'uber':(99,1412,575,1826)}
for k,b in boxes.items():
    im.crop(tuple(int(v*s) for v in b)).save(f'assets/{k}.png')
