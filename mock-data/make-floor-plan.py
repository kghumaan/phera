from PIL import Image, ImageDraw, ImageFont

W, H = 1400, 900
img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)

def font(sz, bold=False):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, sz)
        except Exception:
            continue
    return ImageFont.load_default()

title_f = font(46, bold=True)
sub_f = font(24)
floor_f = font(30, bold=True)
num_f = font(40, bold=True)
meta_f = font(22)

d.text((50, 34), "Rambagh Palace — Guest Room Block", font=title_f, fill="black")
d.text((52, 92), "Reserved rooms for the Anjali & Rohan wedding · July 2026", font=sub_f, fill="#333333")
d.line((50, 132, W-50, 132), fill="black", width=3)

# rooms: (number, bed_type, capacity)
floors = {
    "Floor 2 — Garden Wing": [
        ("201", "King", 2), ("202", "Twin", 2), ("203", "King + Cot", 3),
        ("204", "King", 2), ("205", "2 Queens", 4), ("206", "Queen", 2),
    ],
    "Floor 3 — Palace Wing": [
        ("301", "Queen", 2), ("302", "Queen", 2), ("303", "Suite", 4),
        ("304", "King", 2), ("305", "Twin", 2), ("306", "Junior Suite", 3),
    ],
}

box_w, box_h, gap = 195, 150, 20
y = 175
for floor_name, rooms in floors.items():
    d.text((52, y), floor_name, font=floor_f, fill="#8a1a3a")
    y += 46
    x = 52
    for (num, bed, cap) in rooms:
        d.rectangle((x, y, x+box_w, y+box_h), outline="black", width=3)
        d.text((x+16, y+14), num, font=num_f, fill="black")
        d.text((x+16, y+72), bed, font=meta_f, fill="#222222")
        d.text((x+16, y+104), f"Sleeps {cap}", font=meta_f, fill="#222222")
        x += box_w + gap
    y += box_h + 55

d.text((52, y+6), "12 rooms total · floors and bed types as marked", font=sub_f, fill="#333333")

out = "mock-data/hotel-floor-plan.png"
img.save(out, "PNG")
print("wrote", out, img.size)
