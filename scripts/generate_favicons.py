from PIL import Image
import os

def generate():
    img_path = 'public/logo.png'
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found")
        return
        
    img = Image.open(img_path)
    width, height = img.size
    
    # The circle is located in the top square of size (0, 0, width, width)
    # logo.png size is 500x598, so cropping (0, 0, 500, 500) gets the emblem cleanly
    cropped = img.crop((0, 0, width, width))
    
    # Resampling filter safety check (Pillow compatibility)
    try:
        resample_filter = Image.Resampling.LANCZOS
    except AttributeError:
        resample_filter = Image.ANTIALIAS
        
    # Resize and save required files
    cropped.resize((16, 16), resample_filter).save('public/favicon-16x16.png')
    cropped.resize((32, 32), resample_filter).save('public/favicon-32x32.png')
    cropped.resize((180, 180), resample_filter).save('public/apple-touch-icon.png')
    cropped.resize((192, 192), resample_filter).save('public/android-chrome-192x192.png')
    cropped.resize((512, 512), resample_filter).save('public/android-chrome-512x512.png')
    
    # Save multi-size favicon.ico containing 16x16, 32x32, and 48x48 sizes
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_imgs = [cropped.resize(size, resample_filter) for size in ico_sizes]
    ico_imgs[0].save('public/favicon.ico', format='ICO', sizes=ico_sizes, append_images=ico_imgs[1:])
    
    print("Favicon assets generated successfully inside the public/ folder.")

if __name__ == '__main__':
    generate()
