"""
Face Authentication Service.
Uses OpenCV for image processing and DeepFace for face verification.
Handles face detection, embedding generation, and comparison.
"""
import os
import uuid
import base64
import logging
import pickle
import numpy as np
from io import BytesIO
from PIL import Image
import cv2

logger = logging.getLogger(__name__)

# DeepFace is imported lazily to handle environments where it's not installed
_deepface = None


def _get_deepface():
    """Lazy-load DeepFace to avoid slow startup."""
    global _deepface
    if _deepface is None:
        try:
            from deepface import DeepFace
            _deepface = DeepFace
            logger.info('DeepFace loaded successfully.')
        except ImportError:
            logger.warning(
                'DeepFace is not installed. Face verification will use fallback mode. '
                'Install with: pip install deepface'
            )
    return _deepface


class FaceService:
    """Service for face detection, embedding, and verification."""

    def __init__(self, config):
        self.upload_folder = config.get('UPLOAD_FOLDER', 'uploads/faces')
        self.threshold = config.get('FACE_MATCH_THRESHOLD', 0.70)
        self.model_name = 'VGG-Face'
        self.detector_backend = 'opencv'
        os.makedirs(self.upload_folder, exist_ok=True)

    def save_face_image(self, image_b64, filename=None):
        """
        Save a base64-encoded image to disk after validation and resizing.
        Returns the saved file path.
        """
        try:
            image_data = self._decode_base64_image(image_b64)
            img = Image.open(BytesIO(image_data))

            # Convert RGBA to RGB if needed
            if img.mode == 'RGBA':
                img = img.convert('RGB')

            # Resize to max 640px on longest side for storage efficiency
            max_size = 640
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size), Image.LANCZOS)

            if filename is None:
                filename = f'{uuid.uuid4().hex}.jpg'

            filepath = os.path.join(self.upload_folder, filename)
            img.save(filepath, 'JPEG', quality=85)
            logger.info(f'Face image saved: {filepath}')
            return filepath

        except Exception as e:
            logger.error(f'Error saving face image: {str(e)}')
            raise ValueError(f'Failed to save face image: {str(e)}')

    def detect_face(self, image_b64):
        """
        Detect faces in a base64-encoded image.
        Returns the number of faces detected and face locations.
        """
        try:
            image_data = self._decode_base64_image(image_b64)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                raise ValueError('Invalid image data.')

            # Use OpenCV Haar Cascade for face detection
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            return len(faces), faces

        except ValueError:
            raise
        except Exception as e:
            logger.error(f'Face detection error: {str(e)}')
            raise ValueError(f'Face detection failed: {str(e)}')

    def generate_face_embedding(self, image_b64):
        """
        Generate a face embedding vector from a base64-encoded image.
        Returns the embedding as a serialized numpy array (bytes).
        """
        DeepFace = _get_deepface()

        try:
            # Save temp image for DeepFace processing
            image_data = self._decode_base64_image(image_b64)
            temp_filename = f'temp_{uuid.uuid4().hex}.jpg'
            temp_path = os.path.join(self.upload_folder, temp_filename)

            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError('Invalid image data.')

            cv2.imwrite(temp_path, img)

            if DeepFace is not None:
                try:
                    embeddings = DeepFace.represent(
                        img_path=temp_path,
                        model_name=self.model_name,
                        detector_backend=self.detector_backend,
                        enforce_detection=True
                    )

                    if not embeddings or len(embeddings) == 0:
                        raise ValueError('No face detected in the image.')

                    if len(embeddings) > 1:
                        raise ValueError('Multiple faces detected. Please ensure only one face is visible.')

                    embedding_vector = np.array(embeddings[0]['embedding'], dtype=np.float32)
                    serialized = pickle.dumps(embedding_vector)

                    logger.info('Face embedding generated successfully via DeepFace.')
                    return serialized

                except ValueError:
                    raise
                except Exception as e:
                    logger.warning(f'DeepFace embedding failed, using fallback: {str(e)}')
                    return self._fallback_embedding(img)
            else:
                return self._fallback_embedding(img)

        except ValueError:
            raise
        except Exception as e:
            logger.error(f'Embedding generation error: {str(e)}')
            raise ValueError(f'Failed to generate face embedding: {str(e)}')
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

    def verify_face(self, image_b64, stored_embedding_bytes):
        """
        Verify a live face image against a stored embedding.
        Returns (is_match: bool, confidence: float).
        """
        DeepFace = _get_deepface()

        try:
            # Generate embedding for the live image
            live_embedding_bytes = self.generate_face_embedding(image_b64)

            stored_embedding = pickle.loads(stored_embedding_bytes)
            live_embedding = pickle.loads(live_embedding_bytes)

            # Compute cosine similarity
            similarity = self._cosine_similarity(live_embedding, stored_embedding)

            is_match = similarity >= self.threshold
            logger.info(f'Face verification: similarity={similarity:.4f}, threshold={self.threshold}, match={is_match}')

            return is_match, float(similarity)

        except ValueError:
            raise
        except Exception as e:
            logger.error(f'Face verification error: {str(e)}')
            raise ValueError(f'Face verification failed: {str(e)}')

    def enroll_face(self, image_b64, voter_id_str):
        """
        Complete face enrollment workflow:
        1. Validate image
        2. Detect exactly one face
        3. Generate embedding
        4. Save image
        Returns (filepath, embedding_bytes).
        """
        # Step 1: Detect face
        num_faces, _ = self.detect_face(image_b64)

        if num_faces == 0:
            raise ValueError('No face detected in the image. Please ensure your face is clearly visible.')

        if num_faces > 1:
            raise ValueError('Multiple faces detected. Please ensure only one face is visible in the image.')

        # Step 2: Generate embedding
        embedding_bytes = self.generate_face_embedding(image_b64)

        # Step 3: Save image
        filename = f'voter_{voter_id_str}_{uuid.uuid4().hex[:8]}.jpg'
        filepath = self.save_face_image(image_b64, filename)

        logger.info(f'Face enrolled for voter {voter_id_str}')
        return filepath, embedding_bytes

    def _decode_base64_image(self, image_b64):
        """Decode a base64 image string to bytes."""
        try:
            # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
            if ',' in image_b64:
                image_b64 = image_b64.split(',', 1)[1]
            return base64.b64decode(image_b64)
        except Exception as e:
            raise ValueError(f'Invalid base64 image data: {str(e)}')

    def _fallback_embedding(self, img):
        """
        Fallback embedding using image histogram when DeepFace is unavailable.
        This is less accurate but allows the system to function for development.
        """
        logger.warning('Using fallback histogram-based embedding (less accurate).')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (128, 128))
        hist = cv2.calcHist([resized], [0], None, [256], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        embedding = np.array(hist, dtype=np.float32)
        return pickle.dumps(embedding)

    @staticmethod
    def _cosine_similarity(a, b):
        """Compute cosine similarity between two vectors."""
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot / (norm_a * norm_b))
