from flask import Flask, render_template, request, redirect, url_for
import requests
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = "static/uploads"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
FASTAPI_URL = "http://13.55.210.40:8000/detect"  # Replace with your FastAPI URL

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Function to resize image to 640x480
def process_image(image_path):
    image = Image.open(image_path)
    image = image.resize((640, 480))
    processed_path = os.path.join(app.config['UPLOAD_FOLDER'], "processed.jpg")
    image.save(processed_path)
    return processed_path

# Function to draw bounding boxes on image
def draw_bounding_boxes(image_path, detections):
    image = Image.open(image_path)
    draw = ImageDraw.Draw(image)

    for obj in detections.get("detections", []):
        x1, y1, x2, y2 = obj["bbox"]
        label = obj["label"]

        # Draw bounding box
        draw.rectangle([(x1, y1), (x2, y2)], outline="red", width=3)
        draw.text((x1, y1 - 10), label, fill="red")

    output_path = os.path.join(app.config['UPLOAD_FOLDER'], "output.jpg")
    image.save(output_path)
    return output_path

@app.route("/", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        file = request.files.get("file")
        if file and file.filename:
            filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filename)

            # Resize image and send to FastAPI
            processed_path = process_image(filename)
            with open(processed_path, "rb") as img_file:
                files = {"file": img_file}
                response = requests.post(FASTAPI_URL, files=files)

            if response.status_code == 200:
                data = response.json()
                output_image_path = draw_bounding_boxes(processed_path, data)
                return redirect(url_for("results", image=os.path.basename(output_image_path), data=data))
            else:
                return render_template("index.html", error="Failed to get response from API.")

    return render_template("index.html")

@app.route("/results")
def results():
    image = request.args.get("image")
    data = request.args.get("data")

    if not image or not data:
        return redirect(url_for("upload"))

    detections = eval(data)  # Convert string to dictionary
    object_counts = {}

    for obj in detections["detections"]:
        object_counts[obj["label"]] = object_counts.get(obj["label"], 0) + 1

    return render_template("results.html", image=image, object_counts=object_counts)

if __name__ == "__main__":
    app.run(debug=True)