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