import { useState } from "react";
import axios from "axios";

function ImageUploaderPage() {
  const [file, setFile] = useState(null);
  const [resultImg, setResultImg] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("http://localhost:8000/predict/", formData, {
      responseType: "json",
    });

    setResultImg(`http://localhost:8000/${res.data.result_image}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Trash Classifier</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">Upload</button>

      {resultImg && (
        <div className="mt-4">
          <img src={resultImg} alt="Result" className="max-w-md" />
        </div>
      )}
    </div>
  );
}

export default ImageUploaderPage;
