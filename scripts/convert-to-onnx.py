"""
Convert YOLOv8 PyTorch model to ONNX format for Node.js inference.
Run this script to generate best.onnx from best.pt
"""

from ultralytics import YOLO
import os

# Paths
MODEL_PATH = "C:/Development/python/yolo/inference/best.pt"
OUTPUT_DIR = "C:/Development/python/yolo/inference"

def convert_to_onnx():
    print(f"Loading model from: {MODEL_PATH}")

    # Load the trained YOLOv8 model
    model = YOLO(MODEL_PATH)

    print("Converting to ONNX format...")

    # Export to ONNX format
    # Settings optimized for Node.js ONNX Runtime
    model.export(
        format='onnx',
        imgsz=320,          # Match inference size used in training
        opset=12,           # ONNX opset version (12 is widely compatible)
        simplify=True,      # Simplify the model graph
        dynamic=False,      # Fixed input size for better performance
        half=False          # Use FP32 for CPU compatibility
    )

    # The export creates the file next to the .pt file
    onnx_path = MODEL_PATH.replace('.pt', '.onnx')

    if os.path.exists(onnx_path):
        size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
        print(f"\nSuccess! ONNX model saved to: {onnx_path}")
        print(f"Model size: {size_mb:.2f} MB")
    else:
        print("Error: ONNX file was not created")
        return False

    return True

if __name__ == "__main__":
    success = convert_to_onnx()
    if success:
        print("\nYou can now use best.onnx in the NestJS backend")
    else:
        print("\nConversion failed. Please check the error messages above.")
