import os
import shutil
from PIL import Image
from fastapi import UploadFile, BackgroundTasks
from pathlib import Path
from typing import List, Tuple

# Define paths for media storage
MEDIA_ROOT = Path("/var/www/media")
AVATAR_ROOT = MEDIA_ROOT / "avatars"

# Ensure directories exist
MEDIA_ROOT.mkdir(exist_ok=True)
AVATAR_ROOT.mkdir(exist_ok=True)

# Define avatar sizes
AVATAR_SIZES = {
    "small": (48, 48),
    "medium": (128, 128),
    "large": (256, 256),
    "original": None  # Original size is preserved
}

async def save_avatar(upload: UploadFile, username: str) -> str:
    """
    Save an uploaded avatar using the username as filename
    Returns the base filename (without extension)
    """
    # Always use PNG format
    filename = f"{username}.png"
    
    # Create full path
    file_path = AVATAR_ROOT / filename
    
    # Ensure folder exists
    AVATAR_ROOT.mkdir(exist_ok=True, parents=True)
    
    # Save the uploaded file temporarily
    temp_path = AVATAR_ROOT / f"temp_{filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    
    # Convert to PNG and save as original, cropping to square
    try:
        img = Image.open(temp_path)
        
        # Crop to square
        width, height = img.size
        if width != height:
            # Calculate dimensions for center crop
            size = min(width, height)
            left = (width - size) // 2
            top = (height - size) // 2
            right = left + size
            bottom = top + size
            
            # Crop the image
            img = img.crop((left, top, right, bottom))
        
        # Save the square image
        img.save(file_path, "PNG")
    finally:
        # Clean up temp file
        if temp_path.exists():
            os.remove(temp_path)
    
    return username

def generate_avatar_variants(username: str, sizes: dict = AVATAR_SIZES) -> List[Tuple[str, Tuple[int, int]]]:
    """
    Generate different sized variants of an avatar
    Returns a list of (filename, size) tuples for created files
    """
    generated_files = []
    original_path = AVATAR_ROOT / f"{username}.png"
    
    # Check if original file exists
    if not original_path.exists():
        return []
    
    # Load the original image
    img = Image.open(original_path)
    
    # Process for each size
    for size_name, dimensions in sizes.items():
        if dimensions is None:  # Skip resizing for "original"
            continue
            
        # Create a resized copy
        resized_img = img.copy()
        resized_img.thumbnail(dimensions, Image.LANCZOS)
        
        # Create the variant filename with size suffix
        variant_filename = f"{username}_{size_name}.png"
        variant_path = AVATAR_ROOT / variant_filename
        
        # Save the variant as PNG
        resized_img.save(variant_path, "PNG")
        generated_files.append((variant_filename, dimensions))
    
    return generated_files

def process_avatar_background(username: str):
    """
    Process avatar in a background task
    Generates different sizes of avatars
    """
    try:
        # Generate all avatar variants
        generate_avatar_variants(username)
    except Exception as e:
        # Log error in background task
        print(f"Error processing avatar variants: {e}")

async def upload_avatar(upload: UploadFile, username: str, background_tasks: BackgroundTasks) -> None:
    """
    Save avatar with username and schedule background processing for variants
    """
    # Save the original file
    await save_avatar(upload, username)
    
    # Schedule background processing
    background_tasks.add_task(process_avatar_background, username)

def delete_avatar(username: str):
    """
    Delete all avatar variants for a user
    """
    # Delete original
    original_path = AVATAR_ROOT / f"{username}.png"
    if original_path.exists():
        os.remove(original_path)
    
    # Delete all size variants
    for size in AVATAR_SIZES:
        if size == "original":
            continue
        
        variant_path = AVATAR_ROOT / f"{username}_{size}.png"
        if variant_path.exists():
            os.remove(variant_path) 