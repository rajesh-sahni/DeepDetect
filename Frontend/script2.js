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

// Show the list

async function fetchVideoDetections() {
  try {
    const response = await fetch("http://localhost:5000/api/vdo-detections");
    const data = await response.json();
    const container = document.getElementById("vdo-detections-container");

    container.innerHTML = ""; // Clear previous data

    data.reverse().forEach((entry) => {
      entry.objects.forEach((obj) => {
        const div = document.createElement("div");
        div.classList.add("vdo-detection");
        div.innerHTML = `<strong>${obj.class}</strong> - ${obj.score.toFixed(
          2
        )}`;
        container.prepend(div);
      });
    });
  } catch (error) {
    console.error("Error fetching video detections:", error);
  }
}

// Initial fetch
fetchVideoDetections();

// show the list page
document
  .getElementById("vdo-list-graph-btn")
  .addEventListener("click", function () {
    const imgListSection = document.querySelector(".vdo-detected-list");
    imgListSection.style.display = "block"; // Make the section visible
    imgListSection.scrollIntoView({ behavior: "smooth" }); // Scroll to the section
  });

// hide the list page
document.getElementById("vdo-list-hide").addEventListener("click", function () {
  document.querySelector(".vdo-detected-list").style.display = "none"; // Hide the section
});

// Graph

let chartInstance;

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

async function videoGraphFetchData() {
  try {
    const response = await fetch("http://localhost:5000/api/vdo-detections");
    const data = await response.json();
    updateChartData(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function updateChartData(data) {
  const timestamps = data.map((entry) => formatTime(entry.timestamp));

  const objectClasses = {};
  data.forEach((entry, i) => {
    entry.objects.forEach((obj) => {
      if (!objectClasses[obj.class]) {
        objectClasses[obj.class] = new Array(data.length).fill(0);
      }
      objectClasses[obj.class][i]++;
    });
  });

  const datasets = Object.keys(objectClasses).map((cls, index) => ({
    label: cls,
    data: objectClasses[cls],
    backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
  }));

  if (chartInstance) {
    chartInstance.data.labels = timestamps;
    chartInstance.data.datasets = datasets;
    chartInstance.update();
  } else {
    createChart(timestamps, datasets);
  }
}

function createChart(labels, datasets) {
  const ctx = document.getElementById("video-detectionsChart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
        x: {
          ticks: {
            callback: function (value, index) {
              return labels[index];
            },
          },
        },
      },
      plugins: {
        legend: { display: true },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
        },
      },
    },
  });
}

videoGraphFetchData();

// Manual refresh button
document.getElementById("refresh-button-vdo").addEventListener("click", () => {
  fetchVideoDetections();
  videoGraphFetchData();
});
