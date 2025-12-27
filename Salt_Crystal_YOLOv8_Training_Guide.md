# Salt Crystal Purity Classification - YOLOv8 Training Guide

## Overview
Train a YOLOv8 model to classify salt crystals as **pure** or **impure** using Google Colab.

## Your Configuration
- **Dataset Format:** YOLO format (from Label Studio)
- **Environment:** Google Colab (Free GPU)
- **Model:** YOLOv8
- **Classes:** `pure`, `impure`
- **Dataset Size:** 100-500 images

---

## Step 1: Setup Google Colab Environment

Open a new Google Colab notebook and run:

```python
# Check GPU availability
!nvidia-smi

# Install Ultralytics (YOLOv8)
!pip install ultralytics
```

---

## Step 2: Upload and Extract Your Dataset

```python
# Upload your zipped dataset
from google.colab import files
uploaded = files.upload()  # Select your zip file when prompted

# Extract the dataset
import zipfile
import os

# Get the uploaded filename automatically
zip_filename = list(uploaded.keys())[0]
with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
    zip_ref.extractall('/content/dataset')

# View the extracted structure
!ls -la /content/dataset
```

---

## Step 3: Organize Dataset Structure

YOLO requires this folder structure:
```
dataset/
├── train/
│   ├── images/
│   └── labels/
└── valid/
    ├── images/
    └── labels/
```

Run this code to organize your data (90% training, 10% validation):

```python
import os
import shutil
import random

# ============================================
# IMPORTANT: Update these paths if your Label Studio
# export has a different folder structure
# ============================================
source_images = '/content/dataset/images'  # Path to your images folder
source_labels = '/content/dataset/labels'  # Path to your labels folder

# Create train/valid directories
os.makedirs('/content/dataset/train/images', exist_ok=True)
os.makedirs('/content/dataset/train/labels', exist_ok=True)
os.makedirs('/content/dataset/valid/images', exist_ok=True)
os.makedirs('/content/dataset/valid/labels', exist_ok=True)

# Get all image files
image_files = [f for f in os.listdir(source_images) if f.endswith(('.jpg', '.jpeg', '.png'))]
random.shuffle(image_files)

# Split 90% train, 10% validation
split_idx = int(len(image_files) * 0.9)
train_files = image_files[:split_idx]
valid_files = image_files[split_idx:]

# Copy files to train folder
for img in train_files:
    shutil.copy(os.path.join(source_images, img), '/content/dataset/train/images/')
    label = os.path.splitext(img)[0] + '.txt'
    label_path = os.path.join(source_labels, label)
    if os.path.exists(label_path):
        shutil.copy(label_path, '/content/dataset/train/labels/')

# Copy files to valid folder
for img in valid_files:
    shutil.copy(os.path.join(source_images, img), '/content/dataset/valid/images/')
    label = os.path.splitext(img)[0] + '.txt'
    label_path = os.path.join(source_labels, label)
    if os.path.exists(label_path):
        shutil.copy(label_path, '/content/dataset/valid/labels/')

print(f"Training images: {len(train_files)}")
print(f"Validation images: {len(valid_files)}")
```

---

## Step 4: Create Dataset Configuration (YAML)

```python
# Create the dataset YAML configuration
yaml_content = """path: /content/dataset
train: train/images
val: valid/images

# Classes matching your Label Studio labels
names:
  0: pure
  1: impure
"""

with open('/content/dataset/salt_crystal.yaml', 'w') as f:
    f.write(yaml_content)

print("Dataset config created!")
!cat /content/dataset/salt_crystal.yaml
```

### Verify Your Classes
Make sure the class order (0: pure, 1: impure) matches what Label Studio assigned. Check a sample label file:

```python
!cat /content/dataset/train/labels/*.txt | head -5
```

The first number in each line is the class ID (0 or 1).

---

## Step 5: Train YOLOv8 Model

```python
from ultralytics import YOLO

# Load a pretrained YOLOv8 model
# Options: yolov8n.pt (fastest), yolov8s.pt, yolov8m.pt, yolov8l.pt (most accurate)
model = YOLO('yolov8n.pt')

# Train the model
results = model.train(
    data='/content/dataset/salt_crystal.yaml',
    epochs=100,           # Number of training epochs
    imgsz=640,            # Image size (640x640)
    batch=16,             # Batch size (reduce to 8 if GPU memory error)
    patience=20,          # Early stopping - stops if no improvement for 20 epochs
    save=True,            # Save checkpoints
    project='/content/runs',
    name='salt_crystal_model'
)
```

### Training Parameters Explained
| Parameter | Description | Recommendation |
|-----------|-------------|----------------|
| `epochs` | Training iterations | Start with 100, increase if needed |
| `imgsz` | Image resolution | 640 is standard, use 320 for faster training |
| `batch` | Images per batch | 16 (reduce to 8 if memory error) |
| `patience` | Early stopping | 20 epochs without improvement |

---

## Step 6: Evaluate Model Performance

```python
# Load the best trained model
model = YOLO('/content/runs/salt_crystal_model/weights/best.pt')

# Validate on validation set
metrics = model.val()

# Print metrics
print(f"mAP50: {metrics.box.map50:.4f}")
print(f"mAP50-95: {metrics.box.map:.4f}")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall: {metrics.box.mr:.4f}")
```

### Understanding Metrics
- **mAP50**: Mean Average Precision at 50% IoU (higher is better, aim for >0.7)
- **mAP50-95**: Mean AP across IoU thresholds (stricter metric)
- **Precision**: How many detections are correct
- **Recall**: How many actual objects were detected

---

## Step 7: Test Predictions on Sample Images

```python
# Run inference on validation images
model = YOLO('/content/runs/salt_crystal_model/weights/best.pt')

results = model.predict(
    source='/content/dataset/valid/images',
    save=True,
    conf=0.5  # Confidence threshold (0.5 = 50%)
)

# Display prediction results
from IPython.display import Image, display
import glob

result_images = glob.glob('/content/runs/detect/predict/*.jpg')[:5]
for img_path in result_images:
    display(Image(filename=img_path, width=500))
    print(f"Image: {img_path}")
    print("-" * 50)
```

---

## Step 8: Download Trained Model

```python
from google.colab import files

# Download the best model weights
files.download('/content/runs/salt_crystal_model/weights/best.pt')

# Optional: Download last checkpoint
# files.download('/content/runs/salt_crystal_model/weights/last.pt')

print("Model downloaded! Use 'best.pt' for deployment.")
```

---

## Local Deployment Guide

After training, you can use your model locally on any computer.

### Install Requirements
```bash
pip install ultralytics opencv-python
```

### Run Inference on Images
```python
from ultralytics import YOLO

# Load your trained model
model = YOLO('best.pt')  # Path to your downloaded model

# Predict on a single image
results = model.predict('salt_sample.jpg', conf=0.5)

# Display results
results[0].show()

# Or save results
results[0].save('result.jpg')
```

### Run on Webcam (Real-time)
```python
from ultralytics import YOLO

model = YOLO('best.pt')

# Run on webcam (0 = default camera)
results = model.predict(source=0, show=True, conf=0.5)
```

### Run on a Folder of Images
```python
from ultralytics import YOLO

model = YOLO('best.pt')

# Process all images in a folder
results = model.predict(
    source='path/to/images/',
    save=True,
    conf=0.5
)
```

---

## Troubleshooting

### GPU Memory Error
Reduce batch size:
```python
model.train(data='...', batch=8)  # or batch=4
```

### Low Accuracy
1. Add more labeled images (aim for 500+)
2. Use a larger model: `yolov8s.pt` or `yolov8m.pt`
3. Increase epochs: `epochs=200`
4. Check label quality in Label Studio

### Class Mismatch
If predictions show wrong class names, verify class order in YAML matches Label Studio export.

### Model Not Converging
- Check that images and labels are correctly paired
- Ensure consistent image quality and lighting
- Verify bounding boxes are accurate

---

## Tips for Better Results

1. **Dataset Quality**: Consistent lighting, clear images, accurate bounding boxes
2. **Class Balance**: Similar number of pure and impure samples
3. **Augmentation**: YOLOv8 applies automatic augmentation (rotation, scaling, etc.)
4. **Transfer Learning**: Starting from pretrained weights (yolov8n.pt) helps with smaller datasets

---

## Expected Output

After successful training, you will have:
- `best.pt` - Your trained model file
- Model can detect and classify salt crystals as "pure" or "impure"
- Ready for deployment on PC, embedded systems, or web applications
