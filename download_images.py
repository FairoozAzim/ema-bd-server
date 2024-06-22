import os
import gdown
import json
import sys
import requests
# Ensure the standard output uses 'utf-8' encoding
sys.stdout.reconfigure(encoding='utf-8')

alumni = 'student_alumni.json'

# Read the JSON file and parse it into a Python list
with open(alumni, 'r', encoding='utf-8') as file:
    data_array = json.load(file)



# Folder to save the downloaded images
output_folder = 'uploads/alumni'

# Create the folder if it doesn't exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)


# Function to extract the Google Drive file ID from a link
def get_drive_file_id(drive_link):
    return drive_link.split('id=')[1]

# Function to download an image from a URL
def download_image(url, output_path):
    if 'drive.google.com' in url:
        file_id = get_drive_file_id(url)
        gdown.download(f'https://drive.google.com/uc?export=download&id={file_id}', output_path, quiet=False)
    else:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(output_path, 'wb') as out_file:
                out_file.write(response.content)
        else:
            print(f"Failed to download image from {url}")

# Loop through each item in the JSON array
for item in data_array:
    name = (item['Name *']).lower()
    image_link = item['ImageLink']
    if image_link == "":
        continue
    
    
    # Create a valid file name from the name (e.g., replacing spaces with underscores)
    file_name = f"{name.replace(' ', '_')}.jpg"
    output_path = os.path.join(output_folder, file_name)
    
    # Download the image
    download_image(image_link, output_path)

print("Download completed.")