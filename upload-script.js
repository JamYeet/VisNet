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
        fileInput.click(); // Trigger the hidden file input
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
        uploadBox.classList.add('drag-over'); // Add visual feedback
    });
    
    uploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
    });
    
    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files; // Set the files to the input
            fileName.textContent = files[0].name;
        }
    });
  });