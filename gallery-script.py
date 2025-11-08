import os
import yaml
from pathlib import Path
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

IMG_ROOT = "assets/img/galleries"
OUTPUT_DIR = "_galleries"
VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".heic")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def title_from_slug(slug):
    return slug.replace("-", " ").title()

for folder in os.listdir(IMG_ROOT):
    folder_path = os.path.join(IMG_ROOT, folder)
    if not os.path.isdir(folder_path):
        continue

    image_files = [
        f for f in os.listdir(folder_path)
        if f.lower().endswith(VALID_EXTENSIONS)
    ]

    if not image_files:
        continue

    print(f"\n📁 Processing folder: {folder}")
    existing_images = set(os.listdir(folder_path))
    new_images = []

    for idx, original_file in enumerate(image_files, start=1):
        original_path = os.path.join(folder_path, original_file)
        new_filename = f"{idx}.jpg"
        new_path = os.path.join(folder_path, new_filename)

        # Skip if already correctly named JPG
        if original_file.lower() == new_filename:
            new_images.append(new_filename)
            continue

        # Skip if new_filename already exists
        if new_filename in existing_images:
            print(f"↪ Skipping (already exists): {new_filename}")
            new_images.append(new_filename)
            continue

        try:
            im = Image.open(original_path)
            rgb_image = im.convert("RGB")
            rgb_image.save(new_path, "JPEG", quality=90)
            print(f"✅ Converted: {original_file} → {new_filename}")
        except Exception as e:
            print(f"❌ Failed to process {original_file}: {e}")
            continue

        # Delete the original if needed
        if original_file != new_filename:
            try:
                os.remove(original_path)
            except Exception as e:
                print(f"❗ Couldn't delete original: {e}")

        new_images.append(new_filename)

    # Write markdown file
    front_matter = {
        "layout": "gallery",
        "title": title_from_slug(folder),
        "permalink": f"/gallery/{folder}/",
        "covers": [f"/{IMG_ROOT}/{folder}/{img}" for img in new_images[:4]],
        "images": [f"/{IMG_ROOT}/{folder}/{img}" for img in new_images]
    }

    out_path = os.path.join(OUTPUT_DIR, f"{folder}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("---\n")
        yaml.dump(front_matter, f, allow_unicode=True, default_flow_style=False)
        f.write("---\n\n")
        f.write(f"# {title_from_slug(folder)}\n")

    print(f"📄 Gallery generated: {out_path}")
