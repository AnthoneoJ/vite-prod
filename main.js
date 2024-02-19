import './style.css'

// Load environment variables
const portNum = process.env.PORT_NUM || 3001;

// Get a reference to the elements
const imageUploader = document.getElementById("imageFileInput");
const imageUrlInput = document.getElementById("imageUrlInput");
const promptInput = document.getElementById("promptInput");
const submitButton = document.querySelector("#submitButton");
const qwenOutput = document.querySelector("#qwenOutput");
// Attach an event listeners
imageUploader.addEventListener("change", imageFileChanged);
imageUrlInput.addEventListener("input", imageUrlChanged);
submitButton.addEventListener("click", submitReplicate);

var imageDataURL = "";

// Define the model here
// the example below is for https://replicate.com/lucataco/qwen-vl-chat?input=http
const model_code = process.env.MODEL_CODE || "50881b153b4d5f72b3db697e2bbad23bb1277ab741c5b52d80cd6ee17ea660e9";

// Set up the API options here
const proxyUrl = `http://localhost:${portNum}/api/predictions`; //proxy is required due to CORS policy
const proxyUrlImage = `http://localhost:${portNum}/imagehosting/upload`; //proxy is required due to CORS policy
//const apiUrl = "https://api.replicate.com/v1/predictions";
var requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};


function imageFileChanged(event) {
  const file = event.target.files[0];
  if (!file) return;
  imageUrlInput.value = "";
  const reader = new FileReader();
  reader.onload = (e) => {
    console.log(e.target);
    imageDataURL = e.target.result;
  };
  reader.readAsDataURL(file);
}

function imageUrlChanged(event) {
  const imageUrl = imageUrlInput.value.trim();
  if (imageUrl === "") return;
  imageDataURL = "";
  imageUploader.value = "";
}

function submitReplicate() {
  const promptText = promptInput.value;

  let imageUrlPromise;

  // Detect whether the input is a URL or path
  if (imageDataURL !== "") {
    // File
    const reqImageHostOpts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source: imageDataURL.split(',')[1] })
    };

    // Fetch the image data and resolve the promise when done
    imageUrlPromise = new Promise((resolve, reject) => {
      fetch(proxyUrlImage, reqImageHostOpts)
        .then(response => response.json())
        .then(data => {
          console.log(`Image data:`);
          console.log(data);
          resolve(data.data.url);
        })
        .catch(error => reject(error));
    });
  } else {
    // URL
    imageUrlPromise = Promise.resolve(imageUrlInput.value);
  }

  // Once the image URL is ready, update request data and options, then run replicate
  imageUrlPromise.then(imageUrl => {
    const requestData = {
      version: model_code,
      input: {
        image: imageUrl,
        prompt: promptText
      }
    };

    // Update request options
    requestOptions.body = JSON.stringify(requestData);

    runReplicate();
  }).catch(error => {
    console.error('Error fetching image data:', error);
  });
}

function runReplicate() {
  console.log('runReplicate() invoked');
  console.log(`Request:`);
  console.log(requestOptions);
  fetch(proxyUrl, requestOptions)
    .then(response => response.json())
    .then(data => {
      console.log(`Initial data:`);
      console.log(data);
      const getUrl = data.urls.get;
      qwenOutput.innerHTML = 'Waiting for output...';
      pollPrediction(getUrl);
    })
    .catch(error => console.error('Error:', error));
}

function pollPrediction(predictionUrl) {
  fetch('/api/predictions/' + encodeURIComponent(predictionUrl))
    .then(response => response.json())
    .then(data => {
      qwenOutput.innerHTML = `Status: ${data.status}`;
      if (data.status === 'succeeded') {
        console.log(`Received data:`);
        console.log(data);
        qwenOutput.innerHTML = `Qwen: ${data.output}`;
      } else {
        // If the status is not "succeeded" yet, continue polling
        setTimeout(() => pollPrediction(predictionUrl), 3000); // Poll every 3 second (adjust as needed)
      }
    })
    .catch(error => console.error('Error:', error));
}
