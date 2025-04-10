// Reload whole page after clicking on logo
document.querySelector(".logo").addEventListener("click", () => {
  location.reload();
});

// Function to handle image input
function handleImageInput(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const uploadedImage = document.getElementById("uploaded-image");
      uploadedImage.src = e.target.result;
      uploadedImage.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
}

//Compute Color for Labels
function computeColorforLabels(className) {
  if (className == "person") {
    color = [85, 45, 255, 200];
  } else if ((className = "cup")) {
    color = [255, 111, 0, 200];
  } else if ((className = "cellphone")) {
    color = [200, 204, 255, 200];
  } else {
    color = [0, 255, 0, 200];
  }
  return color;
}

function drawBoundingBox(predictions, image) {
  predictions.forEach((prediction) => {
    const bbox = prediction.bbox;
    const x = bbox[0];
    const y = bbox[1];
    const width = bbox[2];
    const height = bbox[3];
    const className = prediction.class;
    const confScore = prediction.score;
    const color = computeColorforLabels(className);
    console.log(x, y, width, height, className, confScore);
    let point1 = new cv.Point(x, y);
    let point2 = new cv.Point(x + width, y + height);
    cv.rectangle(image, point1, point2, color, 2);
    const text = `${className} - ${Math.round(confScore * 100) / 100}`;
    const font = cv.FONT_HERSHEY_TRIPLEX;
    const fontsize = 0.7;
    const thickness = 1;
    //Get the size of the text
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const textMetrics = context.measureText(text);
    const twidth = textMetrics.width;
    console.log("Text Width", twidth);
    cv.rectangle(
      image,
      new cv.Point(x, y - 20),
      new cv.Point(x + twidth + 150, y),
      color,
      -1
    );
    cv.putText(
      image,
      text,
      new cv.Point(x, y - 5),
      font,
      fontsize,
      new cv.Scalar(255, 255, 255, 255),
      thickness
    );
  });
}

function OpenCVReady() {
  cv["onRuntimeInitialized"] = () => {
    console.log("OpenCV Ready");

    document
      .getElementById("select-image-btn")
      .addEventListener("click", function () {
        document.getElementById("image-upload").click();
      });

    document
      .getElementById("image-upload")
      .addEventListener("change", handleImageInput);

    //Object Detection Image
    document.getElementById("run-img-btn").onclick = function () {
      console.log("Object Detection Image");
      const image = document.getElementById("uploaded-image");
      let inputImage = cv.imread(image);
      cocoSsd.load().then((model) => {
        model.detect(image).then((predictions) => {
          console.log("Predictions", predictions);
          console.log("Length of Predictions", predictions.length);
          if (predictions.length > 0) {
            drawBoundingBox(predictions, inputImage);
            cv.imshow("main-canvas", inputImage);
            inputImage.delete();

            // Send detected objects to backend
            fetch("http://localhost:5000/api/img-detect", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                predictions.map((prediction) => ({
                  objectName: prediction.class,
                  probability: prediction.score,
                }))
              ),
            })
              .then((response) => response.json())
              .then((data) => console.log("Saved to DB:", data))
              .catch((error) => console.error("Error saving data:", error));
          } else {
            cv.imshow("main-canvas", inputImage);
            inputImage.delete();
          }
        });
      });
    };
  };
}

// Show the list

async function fetchImageDetections() {
  try {
    const response = await fetch("http://localhost:5000/api/img-detections");
    const data = await response.json();
    const container = document.getElementById("img-detections-container");

    container.innerHTML = ""; // Clear previous data

    data.forEach((item) => {
      // Reverse to show latest on top
      const div = document.createElement("div");
      div.classList.add("img-detection");
      div.innerHTML = `<strong>${
        item.objectName
      }</strong> - ${item.probability.toFixed(2)}`;
      container.prepend(div); // Add new data at the top
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Initial fetch
fetchImageDetections();

// show the list page
document
  .getElementById("img-list-graph-btn")
  .addEventListener("click", function () {
    const imgListSection = document.querySelector(".img-detected-list");
    imgListSection.style.display = "block"; // Make the section visible
    imgListSection.scrollIntoView({ behavior: "smooth" }); // Scroll to the section
  });

// hide the list page
document.getElementById("img-list-hide").addEventListener("click", function () {
  document.querySelector(".img-detected-list").style.display = "none"; // Hide the section
});

// Graph

let imgChart;

async function imageGraphFetchData() {
  try {
    const response = await fetch("http://localhost:5000/api/img-detections");
    const data = await response.json();
    updateImgChart(data);
  } catch (error) {
    console.error("Error fetching image detection data:", error);
  }
}

function updateImgChart(data) {
  const groupedData = {};

  data.forEach((entry) => {
    const time = new Date(entry.detectedAt).toLocaleString(); // changed from timestamp
    if (!groupedData[time]) groupedData[time] = {};
    if (!groupedData[time][entry.objectName])
      groupedData[time][entry.objectName] = 0;
    groupedData[time][entry.objectName]++;
  });

  const timestamps = Object.keys(groupedData);
  const objectTypes = [...new Set(data.map((d) => d.objectName))];

  const datasets = objectTypes.map((name, index) => ({
    label: name,
    data: timestamps.map((time) => groupedData[time][name] || 0),
    backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
  }));

  if (imgChart) imgChart.destroy();

  const ctx = document.getElementById("img-detectionsChart").getContext("2d");
  imgChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: timestamps,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
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
}

// Initial load
imageGraphFetchData();

// Manual refresh button
document.getElementById("refresh-button-img").addEventListener("click", () => {
  fetchImageDetections();
  imageGraphFetchData();
});
