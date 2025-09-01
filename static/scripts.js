document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const previewImage = document.getElementById("image-preview");
    const previewContainer = document.getElementById("preview-container");
    const submitBtn = document.getElementById("submit-btn");

    // ✅ Dark Mode Toggle
    function toggleTheme() {
        document.body.classList.toggle("dark-mode");
    }
    window.toggleTheme = toggleTheme;

    // ✅ Preview Image Function
    function previewImageFile(file) {
        const reader = new FileReader();
        reader.onload = function () {
            previewImage.src = reader.result;
            previewContainer.style.display = "block";
            submitBtn.disabled = false; // Enable submit button
        };
        reader.readAsDataURL(file);
    }

    fileInput.addEventListener("change", function (event) {
        previewImageFile(event.target.files[0]);
    });

    // ✅ Drag & Drop
    const dropZone = document.getElementById("drop-zone");
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("highlight");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("highlight");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("highlight");
        let file = e.dataTransfer.files[0];
        fileInput.files = e.dataTransfer.files;
        previewImageFile(file);
    });

    // ✅ Camera Capture
    function startCamera() {
        let video = document.getElementById("camera");
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            video.srcObject = stream;
            video.hidden = false;
            document.getElementById("capture-btn").hidden = false;
        }).catch(err => alert("Camera access denied: " + err));
    }
    window.startCamera = startCamera;

    function captureImage() {
        let video = document.getElementById("camera");
        let canvas = document.getElementById("canvas");
        let context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            let file = new File([blob], "captured.png", { type: "image/png" });
            let dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            previewImageFile(file);
        });

        video.srcObject.getTracks().forEach(track => track.stop());
        video.hidden = true;
        document.getElementById("capture-btn").hidden = true;
    }
    window.captureImage = captureImage;

    // ✅ Submit Button Action
    submitBtn.addEventListener("click", function () {
        let formData = new FormData();
        let imageFile = fileInput.files[0];

        if (imageFile) {
            formData.append("file", imageFile);
        }

        fetch("/predict", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            previewImage.src = data.image_url;
        })
        .catch(error => alert("Error: " + error.message));
    });
});
