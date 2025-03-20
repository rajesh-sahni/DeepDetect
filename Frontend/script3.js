window.onload = function () {
  console.log("DOM fully loaded");

  const liveVideo = document.getElementById("live-video");
  const liveCanvas = document.getElementById("live-canvas");
  const canvasCtx = liveCanvas.getContext("2d");
  const startButton = document.getElementById("startDetection");
  const stopButton = document.getElementById("stopDetection");

  if (!liveVideo || !liveCanvas || !startButton || !stopButton) {
    console.error("One or more elements not found! Check your HTML IDs.");
    return;
  }

  console.log("Event listeners added successfully");

  startButton.addEventListener("click", async () => {
    console.log("Start button clicked");
    await setupCamera();
    detectObjects();

    startButton.disabled = true;
    stopButton.disabled = false;
  });

  stopButton.addEventListener("click", stopDetection);
};

let detectionRunning = false;
let detectionInterval;
let detectionModel;
let videoStream = null; // Store video stream to stop later

async function setupCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const liveVideo = document.getElementById("live-video");
    liveVideo.srcObject = videoStream;
    console.log("Webcam stream obtained successfully");

    return new Promise((resolve) => {
      liveVideo.onloadedmetadata = async () => {
        await liveVideo.play();
        console.log("Webcam video is now playing");

        const liveCanvas = document.getElementById("live-canvas");
        liveCanvas.width = liveVideo.videoWidth;
        liveCanvas.height = liveVideo.videoHeight;
        resolve(liveVideo);
      };
    });
  } catch (error) {
    console.error("Error accessing webcam:", error);
  }
}

async function loadModel() {
  if (!detectionModel) {
    console.log("Loading model...");
    detectionModel = await cocoSsd.load();
    console.log("Model loaded successfully");
  }
}

async function detectObjects() {
  if (detectionRunning) return;
  detectionRunning = true;

  await loadModel();

  detectionInterval = setInterval(async () => {
    if (!detectionRunning) return;

    const liveVideo = document.getElementById("live-video");
    const liveCanvas = document.getElementById("live-canvas");
    const canvasCtx = liveCanvas.getContext("2d");

    canvasCtx.drawImage(liveVideo, 0, 0, liveCanvas.width, liveCanvas.height);
    const predictions = await detectionModel.detect(liveVideo);

    canvasCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    canvasCtx.drawImage(liveVideo, 0, 0, liveCanvas.width, liveCanvas.height);

    predictions.forEach((pred) => {
      canvasCtx.beginPath();
      canvasCtx.rect(...pred.bbox);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "red";
      canvasCtx.fillStyle = "red";
      canvasCtx.stroke();
      canvasCtx.fillText(
        `${pred.class} (${Math.round(pred.score * 100)}%)`,
        pred.bbox[0],
        pred.bbox[1] > 10 ? pred.bbox[1] - 5 : 10
      );
    });

    if (predictions.length > 0) {
      fetch("http://localhost:5000/api/live-vdo-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objects: predictions }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Server Response:", data))
        .catch((error) => console.error("Error sending data:", error));
    }
  }, 1000);
}

function stopDetection() {
  console.log("Stop button clicked");
  clearInterval(detectionInterval);
  detectionRunning = false;

  // Stop the video stream
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }

  // Clear the canvas
  const liveCanvas = document.getElementById("live-canvas");
  const canvasCtx = liveCanvas.getContext("2d");
  canvasCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

  // Reset video source
  const liveVideo = document.getElementById("live-video");
  liveVideo.srcObject = null;

  // Enable/Disable buttons
  document.getElementById("startDetection").disabled = false;
  document.getElementById("stopDetection").disabled = true;
}
