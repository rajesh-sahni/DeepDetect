window.onload = function () {
  console.log("DOM fully loaded");

  const liveVideo = document.getElementById("live-video");
  const liveCanvas = document.getElementById("live-canvas");
  const canvasCtx = liveCanvas.getContext("2d");
  const alertSound = document.getElementById("alertSound");
  const alertBox = document.getElementById("alertBox");
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

    liveVideo.style.display = "none";
    liveCanvas.style.display = "block";

    startButton.disabled = true;
    stopButton.disabled = false;
  });

  stopButton.addEventListener("click", stopDetection);
};

let detectionRunning = false;
let detectionInterval;
let detectionModel;
let videoStream = null;

const suspiciousObjects = [
  "knife",
  "gun",
  "baseball bat",
  "bat",
  "fire extinguisher",
  "scissors",
  "sword",
  "axe",
  "stick",
  "person",
];

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

  const alertSound = document.getElementById("alertSound");
  const alertBox = document.getElementById("alertBox");

  detectionInterval = setInterval(async () => {
    if (!detectionRunning) return;

    const liveVideo = document.getElementById("live-video");
    const liveCanvas = document.getElementById("live-canvas");
    const canvasCtx = liveCanvas.getContext("2d");

    canvasCtx.drawImage(liveVideo, 0, 0, liveCanvas.width, liveCanvas.height);
    const predictions = await detectionModel.detect(liveVideo);

    canvasCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    canvasCtx.drawImage(liveVideo, 0, 0, liveCanvas.width, liveCanvas.height);

    let suspiciousDetected = false;

    predictions.forEach((pred) => {
      const [x, y, width, height] = pred.bbox;
      const label = `${pred.class} - ${pred.score.toFixed(2)}`;

      // Assign colors (optional custom logic)
      let color = "red";
      if (pred.class === "person") color = "blueviolet";
      else if (pred.class === "motorcycle") color = "orange";

      // Draw bounding box
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(x, y, width, height);

      // Draw background rectangle for label
      canvasCtx.font = "16px Arial";
      const textWidth = canvasCtx.measureText(label).width;
      const textHeight = 18;
      canvasCtx.fillStyle = color;
      canvasCtx.fillRect(x, y - textHeight, textWidth + 6, textHeight);

      // Draw label text
      canvasCtx.fillStyle = "white";
      canvasCtx.fillText(label, x + 3, y - 3);

      if (
        suspiciousObjects.includes(pred.class.toLowerCase()) &&
        pred.score > 0.6
      ) {
        suspiciousDetected = true;
      }
    });

    if (suspiciousDetected) {
      if (alertSound.paused) alertSound.play();
      alertBox.style.display = "block";

      fetch("http://localhost:5000/api/send-alert", {
        method: "POST",
      })
        .then(() => console.log("Email triggered"))
        .catch((err) => console.error("Error sending email", err));
    } else {
      alertSound.pause();
      alertSound.currentTime = 0;
      alertBox.style.display = "none";
    }

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

  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }

  const liveCanvas = document.getElementById("live-canvas");
  const canvasCtx = liveCanvas.getContext("2d");
  canvasCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

  const liveVideo = document.getElementById("live-video");
  liveVideo.srcObject = null;

  document.getElementById("startDetection").disabled = false;
  document.getElementById("stopDetection").disabled = true;

  document.getElementById("alertBox").style.display = "none";
  const alertSound = document.getElementById("alertSound");
  alertSound.pause();
  alertSound.currentTime = 0;
}
// List
async function fetchLiveDetections() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/live-vdo-detections"
    );
    const data = await response.json();
    const container = document.getElementById("live-detections-container");

    container.innerHTML = "";

    data.reverse().forEach((item) => {
      const timestamp = new Date(item.timestamp).toLocaleString();

      const div = document.createElement("div");
      div.classList.add("live-detection");
      div.innerHTML = `<strong>${item.class}</strong> - ${item.score.toFixed(
        2
      )} <br> <small>${timestamp}</small>`;
      container.prepend(div);
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchLiveDetections();

document
  .getElementById("live-list-graph-btn")
  .addEventListener("click", function () {
    const imgListSection = document.querySelector(".live-detected-list");
    imgListSection.style.display = "block";
    imgListSection.scrollIntoView({ behavior: "smooth" });
  });

document
  .getElementById("live-list-hide")
  .addEventListener("click", function () {
    document.querySelector(".live-detected-list").style.display = "none";
  });

let chart;

async function liveGraphFetchData() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/live-vdo-detections"
    );
    const data = await response.json();

    const groupedData = {};

    data.forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleString();
      if (!groupedData[time]) groupedData[time] = {};
      if (!groupedData[time][entry.class]) groupedData[time][entry.class] = 0;
      groupedData[time][entry.class]++;
    });

    const timestamps = Object.keys(groupedData);
    const objectTypes = [...new Set(data.map((d) => d.class))];

    const datasets = objectTypes.map((type, index) => ({
      label: type,
      data: timestamps.map((time) => groupedData[time][type] || 0),
      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
    }));

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("live-detectionsChart"), {
      type: "bar",
      data: {
        labels: timestamps,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: { wheel: { enabled: true }, mode: "x" },
          },
        },
        scales: {
          x: {
            stacked: false,
            ticks: {
              autoSkip: false,
              maxRotation: 90,
              minRotation: 45,
            },
          },
          y: {
            stacked: false,
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : null;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

liveGraphFetchData();

document.getElementById("refresh-button-live").addEventListener("click", () => {
  fetchLiveDetections();
  liveGraphFetchData();
});
