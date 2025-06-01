import os
import sys
import torch
import argparse
from flask import Flask, request, render_template, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from config import DEFAULT_MODEL_PATH

# Add the auto_avsr directory to Python path
sys.path.insert(0, "./auto_avsr")

from lightning import ModelModule
from datamodule.transforms import VideoTransform
from preparation.detectors.retinaface.detector import LandmarksDetector
from preparation.detectors.retinaface.video_process import VideoProcess

app = Flask(__name__, static_url_path='', template_folder='templates')
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Ensure required directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Initialize model and pipeline components
parser = argparse.ArgumentParser()
args, _ = parser.parse_known_args(args=[])
setattr(args, 'modality', 'video')

class InferencePipeline(torch.nn.Module):
    def __init__(self, args, ckpt_path, detector="retinaface"):
        super(InferencePipeline, self).__init__()
        self.modality = args.modality
        
        # Initialize video components
        self.landmarks_detector = LandmarksDetector(device="cuda:0" if torch.cuda.is_available() else "cpu")
        self.video_process = VideoProcess(convert_gray=False)
        self.video_transform = VideoTransform(subset="test")

        # Load model
        ckpt = torch.load(ckpt_path, map_location=lambda storage, loc: storage)
        self.modelmodule = ModelModule(args)
        self.modelmodule.model.load_state_dict(ckpt)
        self.modelmodule.eval()

    def load_video(self, data_filename):
        import torchvision
        return torchvision.io.read_video(data_filename, pts_unit="sec")[0].numpy()

    def forward(self, data_filename):
        data_filename = os.path.abspath(data_filename)
        assert os.path.isfile(data_filename), f"data_filename: {data_filename} does not exist."

        video = self.load_video(data_filename)
        landmarks = self.landmarks_detector(video)
        video = self.video_process(video, landmarks)
        video = torch.tensor(video)
        video = video.permute((0, 3, 1, 2))
        video = self.video_transform(video)
        
        with torch.no_grad():
            transcript = self.modelmodule(video)

        return transcript

# Initialize the pipeline
pipeline = InferencePipeline(args, DEFAULT_MODEL_PATH)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'mp4', 'avi', 'mov'}

# Route for the home page
@app.route('/')
@app.route('/index.html')
def home():
    return render_template('index.html')

@app.route('/upload.html')
def upload():
    return render_template('upload.html')

@app.route('/about.html')
def about():
    return render_template('about.html')

# Serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/predict', methods=['POST'])
def predict():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file uploaded'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Run inference
            transcript = pipeline(filepath)
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({'transcript': transcript})
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    # Move HTML files to templates if they exist in root
    for html_file in ['index.html', 'upload.html', 'about.html']:
        if os.path.exists(html_file) and not os.path.exists(os.path.join('templates', html_file)):
            os.rename(html_file, os.path.join('templates', html_file))
    
    # Move static files to static directory if they exist in root
    for static_file in ['style.css', 'upload-script.js', 'VisNet.png', 'file-icon.png']:
        if os.path.exists(static_file) and not os.path.exists(os.path.join('static', static_file)):
            os.rename(static_file, os.path.join('static', static_file))
    
    print("Server is running at http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)