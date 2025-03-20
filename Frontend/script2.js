document.addEventListener("DOMContentLoaded", async () => {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const selectVideoBtn = document.getElementById("select-video-btn");
  const runButton = document.getElementById("run-vdo-btn");

  let model;

  // Load COCO-SSD model
  async function loadModel() {
    console.log("Loading COCO-SSD model...");
    model = await cocoSsd.load();
    console.log("✅ Model Loaded Successfully!");
  }

  // Load the model when the page loads
  loadModel();

  // Select video when clicking "Select Video" button
  selectVideoBtn.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const objectURL = URL.createObjectURL(file);
        video.src = objectURL;
        video.load();
        video.onloadeddata = () => {
          console.log("✅ Video Loaded Successfully.");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        };
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  });

  // Detect objects in the video
  async function detectObjects() {
    if (!video.src || video.videoWidth === 0 || video.videoHeight === 0) {
      alert("⚠ Please select and play a video first.");
      return;
    }

    console.log("🔍 Starting object detection...");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const interval = 500; // Process frames every 500ms

    const processFrame = async () => {
      if (video.paused || video.ended) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const predictions = await model.detect(canvas);

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      predictions.forEach((pred) => {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]);

        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        const probability = (pred.score * 100).toFixed(2);
        ctx.fillText(
          `${pred.class} - ${probability}%`,
          pred.bbox[0],
          pred.bbox[1] - 5
        );
      });

      // Prepare data for database
      const detectedData = {
        timestamp: video.currentTime,
        objects: predictions.map((pred) => ({
          class: pred.class,
          score: parseFloat(pred.score.toFixed(2)), // Ensure correct decimal format
          bbox: pred.bbox, // Bounding box coordinates
        })),
      };

      // Send detected objects to backend
      fetch("http://localhost:5000/api/vdo-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detectedData),
      })
        .then((response) => response.json())
        .then((data) => console.log("✅ Data stored in database:", data))
        .catch((error) => console.error("❌ Error sending data:", error));

      setTimeout(processFrame, interval);
    };

    processFrame();
  }

  // Start detection when clicking "Run"
  runButton.addEventListener("click", () => {
    console.log("▶ Run button clicked...");
    if (!video.src) {
      alert("⚠ Please upload a video first.");
      return;
    }
    video.play();
    video.addEventListener("playing", detectObjects, { once: true });
  });
});
