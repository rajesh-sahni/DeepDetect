# 🔍 DeepDetect – Video Analytics & Real-Time Harmful Object Detection for Surveillance

An AI-powered web application that enables real-time image and video analytics and harmful object detection in real-time using TensorFlow.js, COCO-SSD model and OpenCV.js.

## 📸 Demo

![Demo GIF or Screenshot of UI]([link-to-your-demo-image-or-gif](https://drive.google.com/drive/u/2/folders/12iskoGeh5uakzQ2-HNBmH-VmoTBUEG09))

[🚧 Live Demo Coming Soon](#)

## 📚 Overview

**DeepDetect** is designed to enhance surveillance systems by automatically detecting harmful objects in real-time and if harmful objects like gun, knife, axe, etc... are detected the give immediately an alert sound and an email notification to the concerned authority and here you can also analyze objects from image and videos.

It utilizes machine learning models in-browser, ensuring privacy, speed, and accessibility without requiring heavy server-side computation.

✨ Key Features

🖼 Object Detection in Images  
Upload images to detect and highlight multiple objects in real-time.

🎞 Object Detection in Videos  
Analyze pre-recorded videos frame-by-frame to identify objects.

🎥 Harmful Object Detection in Live Video  
Detect weapons or suspicious items directly from live webcam feed.

📊 Data Representation with List & Graph   
View detection results in a structured list and visual graphs for quick analysis.

🚨 Harmful Object Alerts  
Get instant alert sounds and email notifications upon detecting dangerous objects.

## ⚙️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Model:** TensorFlow.js, COCO-SSD, OpenCV.js for object detection and image processing
 
## 🚀 Getting Started

### 1. Clone the repository

git clone https://github.com/rajesh-sahni/DeepDetect.git  
cd DeepDetect  

### 2. Install Dependencies
cd Backend  
npm install  

### 3. Run Backend
npm start

### 4. Run Frontend
Click on "Go Live" button

## 🗂 Folder Structure
DEEPDETECT/
├── Frontend/
│ ├── index.html
│ ├── style.css
│ ├── script.js
│ ├── script2.js
│ └── script3.js
├── Backend/
│ ├── config/
│ │ └── db.js
│ ├── models/
│ │ ├── imageSchema.js
│ │ ├── liveVideoSchema.js
│ │ └── videoSchema.js
│ ├── routes/
│ │ ├── emailCooldown.js
│ │ ├── imageRoutes.js
│ │ ├── liveVideoRoutes.js
│ │ ├── sendAlert.js
│ │ └── videoRoutes.js
│ ├── .env
│ └── server.js

