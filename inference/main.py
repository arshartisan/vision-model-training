from ultralytics import YOLO
import cv2
import time
import torch

# Check if CUDA is available
print("=" * 50)
print("Salt Crystal Detection - Optimized")
print("=" * 50)

if torch.cuda.is_available():
    print(f"GPU detected: {torch.cuda.get_device_name(0)}")
    device = 'cuda'
else:
    print("No GPU detected, using CPU")
    device = 'cpu'

# Load the trained model with GPU acceleration
print("Loading model...")
model = YOLO('./best.pt')
model.to(device)

# Open camera (0 = first/only camera)
cap = cv2.VideoCapture(0)

# Set camera resolution (1280x720 for better performance)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# Verify camera opened
if not cap.isOpened():
    print("ERROR: Cannot open camera")
    print("Try changing cv2.VideoCapture(0) to cv2.VideoCapture(1)")
    exit()

# Get actual camera resolution
actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"Camera resolution: {actual_width}x{actual_height}")

print("=" * 50)
print("Camera opened successfully!")
print("Press 'q' to quit, 's' to save screenshot")
print("=" * 50)

# FPS calculation variables
prev_time = time.time()
fps = 0
fps_list = []  # For averaging FPS

while True:
    # Read frame from camera
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Run YOLO inference with optimized settings
    # imgsz=320 for faster processing (lower = faster but less accurate)
    results = model(frame, conf=0.5, imgsz=320, verbose=False, device=device)

    # Get detection counts
    detections = results[0].boxes
    class_ids = detections.cls.tolist() if len(detections) > 0 else []

    # Count impure (0) and pure (1) - based on classes.txt order
    impure_count = class_ids.count(0)
    pure_count = class_ids.count(1)
    total_count = len(class_ids)

    # Draw results on frame
    annotated_frame = results[0].plot()

    # Calculate FPS (smoothed average)
    current_time = time.time()
    instant_fps = 1 / (current_time - prev_time)
    prev_time = current_time

    fps_list.append(instant_fps)
    if len(fps_list) > 30:  # Average over 30 frames
        fps_list.pop(0)
    fps = sum(fps_list) / len(fps_list)

    # Add info overlay (background box for readability)
    cv2.rectangle(annotated_frame, (5, 5), (350, 115), (0, 0, 0), -1)

    # FPS with color coding (green=good, yellow=ok, red=slow)
    fps_color = (0, 255, 0) if fps >= 15 else (0, 255, 255) if fps >= 10 else (0, 0, 255)
    cv2.putText(annotated_frame, f"FPS: {fps:.1f}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, fps_color, 2)
    cv2.putText(annotated_frame, f"Pure: {pure_count} | Impure: {impure_count}", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(annotated_frame, f"Total Crystals: {total_count}", (10, 85),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    cv2.putText(annotated_frame, f"Device: {device.upper()}", (10, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (128, 128, 128), 1)

    # Display the frame
    cv2.imshow('Salt Crystal Detection - Press Q to Quit', annotated_frame)

    # Keyboard controls
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):  # Quit
        print("\nQuitting...")
        break
    elif key == ord('s'):  # Save screenshot
        filename = f"screenshot_{int(time.time())}.jpg"
        cv2.imwrite(filename, annotated_frame)
        print(f"Screenshot saved: {filename}")

# Cleanup
cap.release()
cv2.destroyAllWindows()
print(f"Average FPS: {fps:.1f}")
print("Camera released. Program ended.")
