import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";

function ImageUploaderPage() {
  const [image, setImage] = useState(null);           // For preview
  const [predictedImage, setPredictedImage] = useState(null); // For result from backend
  const webcamRef = useRef(null);

  // Capture image from webcam
  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  };

  // When file is uploaded from computer
  const handleFileChange = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  // Upload image to backend for prediction
  const handleUpload = async () => {
    try {
      let blob;

      // If image is a data URL from webcam
      if (image.startsWith("data:image")) {
        blob = await fetch(image).then((res) => res.blob());
      } else {
        // If image is a file URL from file input
        blob = await fetch(image).then((res) => res.blob());
      }

      const formData = new FormData();
      formData.append("file", blob, "input.jpg");

      // Send to your FastAPI backend
      const response = await axios.post("http://localhost:8000/predict/", formData, {
        responseType: "blob", // backend returns image
      });

      // Create an object URL from the returned image
      const imgUrl = URL.createObjectURL(response.data);
      setPredictedImage(imgUrl);
    } catch (err) {
      console.error(err);
      alert("Prediction failed. Is the backend running?");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Trash Classifier
      </h1>

      {/* File Upload */}
      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* Webcam Capture */}
      <div style={{ marginBottom: "1rem" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={300}
        />
        <br />
        <button
          onClick={capture}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Capture from Webcam
        </button>
      </div>

      {/* Preview Selected Image */}
      {image && (
        <div style={{ marginBottom: "1rem" }}>
          <h3>Selected Image:</h3>
          <img src={image} alt="Uploaded" width={300} />
          <br />
          <button
            onClick={handleUpload}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Predict
          </button>
        </div>
      )}

      {/* Prediction Output */}
      {predictedImage && (
        <div>
          <h3>Predicted Output:</h3>
          <img src={predictedImage} alt="Prediction Result" width={300} />
        </div>
      )}
    </div>
  );
}

export default ImageUploaderPage;
