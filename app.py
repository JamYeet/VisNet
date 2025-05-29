from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
import cv2
import numpy as np
from werkzeug.utils import secure_filename
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variable to store loaded model
model = None
device = None

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
import cv2
import numpy as np
from werkzeug.utils import secure_filename
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variable to store loaded model
model = None
device = None

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model(model_path):
    """Load your trained .pth model"""
    global model, device
    
    try:
        # Determine device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {device}")
        
        # Load the checkpoint
        checkpoint = torch.load(model_path, map_location=device)
        logger.info(f"Checkpoint keys: {list(checkpoint.keys()) if isinstance(checkpoint, dict) else 'Not a dict'}")
        
        # Check if it's a state_dict or complete model
        if isinstance(checkpoint, dict):
            # It's a state_dict - you need to define your model architecture here
            
            # PLACEHOLDER: Replace this with your actual model class/architecture
            # You need to import and instantiate your model here
            # Example:
            # from your_model_file import YourModelClass
            # model = YourModelClass(input_size=..., hidden_size=..., num_classes=...)
            
            logger.error("Model saved as state_dict. You need to define your model architecture.")
            logger.error("Please uncomment and modify the model instantiation code above.")
            logger.error("Available keys in checkpoint: " + str(list(checkpoint.keys())))
            
            # Uncomment and modify these lines once you define your model:
            # model.load_state_dict(checkpoint)
            # model.to(device)
            # model.eval()
            
            return False
            
        else:
            # It's a complete model
            model = checkpoint
            model.to(device)
            model.eval()
            logger.info("Model loaded successfully")
            return True
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False


def preprocess_video(video_path):
    """
    Preprocess video for your model
    Adjust this function based on your model's input requirements
    """
    try:
        # Open video file
        cap = cv2.VideoCapture(video_path)
        frames = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Add your preprocessing steps here
            # Example preprocessing (adjust based on your model):
            # - Resize frame
            # - Extract lip region
            # - Normalize
            # - Convert to tensor
            
            # Placeholder preprocessing - replace with your actual preprocessing
            frame_resized = cv2.resize(frame, (224, 224))  # Example size
            frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)
        
        cap.release()
        
        # Convert to tensor format expected by your model
        # This is a placeholder - adjust based on your model's input format
        if frames:
            frames_tensor = torch.tensor(np.array(frames), dtype=torch.float32)
            frames_tensor = frames_tensor.permute(0, 3, 1, 2)  # (frames, channels, height, width)
            frames_tensor = frames_tensor / 255.0  # Normalize to [0, 1]
            return frames_tensor.unsqueeze(0)  # Add batch dimension
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error preprocessing video: {str(e)}")
        return None

def predict_transcription(preprocessed_video):
    """
    Run inference with your model
    Adjust this function based on your model's output format
    """
    try:
        with torch.no_grad():
            # Move input to device
            preprocessed_video = preprocessed_video.to(device)
            
            # Run inference
            output = model(preprocessed_video)
            
            # Process output based on your model
            # This is a placeholder - replace with your actual post-processing
            
            # Example for sequence-to-sequence models:
            # if hasattr(output, 'logits'):
            #     logits = output.logits
            # else:
            #     logits = output
            
            # For text generation models, you might need to decode:
            # predicted_ids = torch.argmax(logits, dim=-1)
            # transcription = tokenizer.decode(predicted_ids[0], skip_special_tokens=True)
            
            # Placeholder transcription - replace with actual model output processing
            transcription = "Placeholder transcription - replace with your model's actual output processing"
            
            return transcription
            
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return None

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and transcription"""
    try:
        # Check if file is present
        if 'video' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        if model is None:
            return jsonify({'success': False, 'error': 'Model not loaded'}), 500
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Preprocess video
            logger.info(f"Processing video: {filename}")
            preprocessed_video = preprocess_video(temp_path)
            
            if preprocessed_video is None:
                return jsonify({'success': False, 'error': 'Failed to process video'}), 500
            
            # Run transcription
            transcription = predict_transcription(preprocessed_video)
            
            if transcription is None:
                return jsonify({'success': False, 'error': 'Failed to generate transcription'}), 500
            
            logger.info("Transcription completed successfully")
            
            return jsonify({
                'success': True,
                'transcription': transcription,
                'filename': filename
            })
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
    
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(device) if device else None
    })

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({'success': False, 'error': 'File too large. Maximum size is 100MB.'}), 413

if __name__ == '__main__':
    # Load your model
    MODEL_PATH = r'D:\UTS\Y3S1\Deep Learning\VisNet\model_avg_10.pth' # File location
    
    if not os.path.exists(MODEL_PATH):
        logger.error(f"Model file not found: {MODEL_PATH}")
        logger.error("Please place your .pth model file in the same directory and update MODEL_PATH")
        exit(1)
    
    logger.info("Loading model...")
    if not load_model(MODEL_PATH):
        logger.error("Failed to load model. Exiting.")
        exit(1)
    
    logger.info("Starting Flask server...")
    app.run(host='127.0.0.1', port=5000, debug=True)