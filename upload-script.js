// File preview functionality
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName');
  
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      fileName.textContent = `Selected file: ${file.name}`;
      fileName.style.display = 'block';
    } else {
      fileName.textContent = '';
      fileName.style.display = 'none';
    }
  });
});

// Makes the container box clickable to browse files
document.addEventListener('DOMContentLoaded', function() {
    const uploadBox = document.querySelector('.upload-box');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    
    // Add click event to the upload box
    uploadBox.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Display selected filename when file is chosen
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = '';
        }
    });
    
    // Add drag and drop functionality
    uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.add('drag-over');
    });
    
    uploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.remove('drag-over');
    });
    
    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            
            // Check if it's a video file
            if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4')) {
                fileInput.files = files;
                fileName.textContent = files[0].name;
                fileName.style.display = 'block';
            } else {
                alert('Please select a video file (.mp4)');
            }
        }
    });
});

// Convert button functionality
document.addEventListener('DOMContentLoaded', function () {
  const convertButton = document.querySelector('.convert-btn');
  const fileInput = document.getElementById('fileInput');

  convertButton.addEventListener('click', function () {
    const file = fileInput.files[0];

    if (!file) {
      alert('Please select a video file first.');
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large. Maximum size is 100MB.');
      return;
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['mp4', 'avi', 'mov', 'mkv'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Please select a valid video file (.mp4, .avi, .mov, or .mkv)');
      return;
    }

    // Show loading state
    convertButton.textContent = 'Processing...';
    convertButton.disabled = true;
    
    // Add loading spinner class if you have one in CSS
    convertButton.classList.add('loading');

    const formData = new FormData();
    formData.append('video', file);

    // Use local Flask server URL - try both localhost and 127.0.0.1
    const API_URL = 'http://127.0.0.1:5000/upload';  // Change port if Flask starts on different port
    
    fetch(API_URL, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error('File too large. Maximum size is 100MB.');
          }
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Display results in a better way
          showResults(data.transcription, data.filename);
        } else {
          alert('Error: ' + (data.error || 'Unknown error occurred'));
        }
      })
      .catch(error => {
        console.error('Error:', error);
        if (error.message.includes('fetch')) {
          alert('Could not connect to the server. Make sure the Flask app is running on http://localhost:5000');
        } else {
          alert('Error: ' + error.message);
        }
      })
      .finally(() => {
        // Reset button
        convertButton.textContent = 'Convert to Text';
        convertButton.disabled = false;
        convertButton.classList.remove('loading');
      });
  });
});

// Function to display results nicely
function showResults(transcription, filename) {
  // Create a results container if it doesn't exist
  let resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'results-container';
    resultsContainer.className = 'results-container';
    
    // Insert after the upload container
    const uploadContainer = document.querySelector('.upload-container');
    uploadContainer.parentNode.insertBefore(resultsContainer, uploadContainer.nextSibling);
  }
  
  // Clear previous results
  resultsContainer.innerHTML = '';
  
  // Create results content
  const resultsHTML = `
    <div class="results-box">
      <h3>Transcription Results</h3>
      <div class="file-info">
        <strong>File:</strong> ${filename}
      </div>
      <div class="transcription-text">
        <strong>Transcription:</strong>
        <p>${transcription}</p>
      </div>
      <div class="results-actions">
        <button onclick="copyToClipboard('${transcription.replace(/'/g, "\\'")}')">Copy Text</button>
        <button onclick="downloadTranscription('${transcription.replace(/'/g, "\\'")}', '${filename}')">Download as .txt</button>
      </div>
    </div>
  `;
  
  resultsContainer.innerHTML = resultsHTML;
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    alert('Transcription copied to clipboard!');
  }).catch(function(err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Transcription copied to clipboard!');
  });
}

// Function to download transcription as text file
function downloadTranscription(transcription, videoFilename) {
  const blob = new Blob([transcription], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Create filename based on original video name
  const baseName = videoFilename.split('.').slice(0, -1).join('.');
  a.download = `${baseName}_transcription.txt`;
  a.href = url;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}