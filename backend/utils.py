import cv2
import os
import uuid

def draw_boxes(image_path, result):
    img = cv2.imread(image_path)
    for box in result.boxes:
        xyxy = box.xyxy[0].cpu().numpy().astype(int)
        label = result.names[int(box.cls[0])]
        conf = float(box.conf[0])

        cv2.rectangle(img, xyxy[:2], xyxy[2:], (0, 255, 0), 2)
        cv2.putText(img, f"{label} {conf:.2f}", (xyxy[0], xyxy[1]-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    out_path = os.path.join("uploads", f"result_{uuid.uuid4().hex}.jpg")
    cv2.imwrite(out_path, img)
    return out_path
