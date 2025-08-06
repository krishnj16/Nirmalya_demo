import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [predictedImage, setPredictedImage] = useState(null);
  const webcamRef = useRef(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  };

  const handleFileChange = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  const handleUpload = async () => {
    const blob = await fetch(image).then(res => res.blob());
    const formData = new FormData();
    formData.append("file", blob, "input.jpg");

    try {
      const response = await axios.post("http://localhost:5000/predict", formData, {
        responseType: "blob"
      });
      const imgUrl = URL.createObjectURL(response.data);
      setPredictedImage(imgUrl);
    } catch (err) {
      alert("Prediction failed. Is the backend running?");
    }
  };

  return (
    <div>
      <h2>Upload Image or Use Webcam</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={300}
        />
        <button onClick={capture}>Capture from Webcam</button>
      </div>

      {image && (
        <div style={{ marginBottom: "1rem" }}>
          <h3>Selected Image:</h3>
          <img src={image} alt="Uploaded" width="300" />
          <button onClick={handleUpload}>Predict</button>
        </div>
      )}

      {predictedImage && (
        <div>
          <h3>Predicted Output:</h3>
          <img src={predictedImage} alt="Prediction Result" width="300" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
