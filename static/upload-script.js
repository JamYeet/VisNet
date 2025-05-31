// File preview functionality
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName');
  const convertButton = document.querySelector('.convert-btn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const resultsContainer = document.getElementById('resultsContainer');
  const transcriptionText = document.getElementById('transcriptionText');
  const copyButton = document.getElementById('copyButton');
  const downloadButton = document.getElementById('downloadButton');
  
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

  // Makes the container box clickable to browse files
  const uploadBox = document.querySelector('.upload-box');
  
  // Add click event to the upload box
  uploadBox.addEventListener('click', function() {
    fileInput.click();
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
      if (file.type.startsWith('video/') || 
          file.name.toLowerCase().endsWith('.mp4') ||
          file.name.toLowerCase().endsWith('.avi') ||
          file.name.toLowerCase().endsWith('.mov')) {
        fileInput.files = files;
        fileName.textContent = `Selected file: ${files[0].name}`;
        fileName.style.display = 'block';
      } else {
        alert('Please select a supported video file (.mp4, .avi, .mov)');
      }
    }
  });

  // Convert button functionality
  convertButton.addEventListener('click', async function() {
    const file = fileInput.files[0];

    if (!file) {
      alert('Please select a video file first.');
      return;
    }

    // Check file size (16MB limit)
    if (file.size > 16 * 1024 * 1024) {
      alert('File too large. Maximum size is 16MB.');
      return;
    }

    // Show loading state
    convertButton.disabled = true;
    loadingSpinner.style.display = 'block';
    resultsContainer.style.display = 'none';

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Display results
      transcriptionText.textContent = data.transcript;
      resultsContainer.style.display = 'block';
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'An error occurred while processing the video');
    } finally {
      // Reset UI
      convertButton.disabled = false;
      loadingSpinner.style.display = 'none';
    }
  });

  // Copy button functionality
  copyButton.addEventListener('click', async function() {
    const textToCopy = transcriptionText.textContent;
    
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
          textArea.remove();
          throw new Error('Copy failed');
        }
      }
      
      // Show success feedback
      copyButton.classList.add('copied');
      const feedback = copyButton.querySelector('.copy-feedback');
      feedback.classList.add('show');
      
      // Reset the button state after 2 seconds
      setTimeout(() => {
        copyButton.classList.remove('copied');
        feedback.classList.remove('show');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Update the feedback to show error
      const feedback = copyButton.querySelector('.copy-feedback');
      feedback.textContent = 'Copy failed!';
      feedback.style.background = 'rgba(231, 76, 60, 0.9)';  // Red background for error
      feedback.classList.add('show');
      
      // Reset the error feedback after 2 seconds
      setTimeout(() => {
        feedback.classList.remove('show');
        feedback.textContent = 'Copied!';
        feedback.style.background = 'rgba(46, 204, 113, 0.9)';  // Reset to original color
      }, 2000);
    }
  });

  // Download button functionality
  downloadButton.addEventListener('click', function() {
    const text = transcriptionText.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Create filename based on original video name
    const originalName = fileInput.files[0].name;
    const baseName = originalName.split('.').slice(0, -1).join('.');
    a.download = `${baseName}_transcription.txt`;
    a.href = url;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  });
});