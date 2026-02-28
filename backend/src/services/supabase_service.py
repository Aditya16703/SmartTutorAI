from dotenv import load_dotenv
import os
import logging
from supabase import create_client, Client

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class SupabaseService:
    _instance = None
    _client = None
    bucket_name = 'learning-sources'

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._initialize_client()

    def _initialize_client(self):
        """Initialize Supabase client"""
        try:
            # FIX: Use the correct environment variable names
            url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
            key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

            if not url or not key:
                raise ValueError(
                    "Supabase environment variables are required")

            self._client = create_client(url, key)
            logger.info("Supabase client initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise

    @property
    def client(self) -> Client:
        """Get the Supabase client instance"""
        if self._client is None:
            self._initialize_client()
        return self._client

    def update_learning_space(self, learning_space_id: str, updates: dict):
        """Update learning space with given data - with error handling"""
        logger.info(f'Updating learning space {learning_space_id}')
    
        try:
        # Define all valid columns that should exist in learning_space table
            valid_columns = [
              'summary_notes', 'audio_script', 'recommendations', 
              'quiz', 'audio_overview', 'updated_at',
              'language', 'status', 'pdf_source', 'audio_source', 'flashcards'
        ]
        
        # Filter updates to only include valid columns
            valid_updates = {}
            for key, value in updates.items():
                if key in valid_columns:
                     valid_updates[key] = value
                else:
                     logger.warning(f"Skipping unknown column '{key}' for learning_space update")
        
            if not valid_updates:
                logger.warning(f"No valid columns to update for learning_space {learning_space_id}")
                return None
        
            logger.info(f"📝 Updating learning_space {learning_space_id} with columns: {list(valid_updates.keys())}")
            response = (
                self.client
                .table("learning_space")
                .update(valid_updates)
                .eq("id", learning_space_id)
                .execute()
            )
            logger.info(f"Successfully updated learning space {learning_space_id}")
            return response
        
        except Exception as e:
            logger.error(f"Failed to update learning space {learning_space_id}: {str(e)}")
        # Return None instead of raising exception to prevent crashes
            return None

    def get_student_profile(self, user_id: str):
        """get the student profile"""
        try:
            logger.info(f"Getting student profile for {user_id}")
            response = (
                self.client
                .table("student_profile")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )

            # Return first profile if exists, otherwise None
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(
                f"Failed to get student profile for {user_id}: {str(e)}")
            return None

    def get_learning_space(self, space_id: str):
        """get the learning space data"""
        try:
            logger.info(f"Getting learning space for {space_id}")
            response = (
                self.client
                .table("learning_space")
                .select("*")
                .eq("id", space_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(
                f"Failed to get learning space for {space_id}: {str(e)}")
            return None

    def upload_file(self, file_path: str, file_data, content_type: str = 'audio/mpeg'):
        """Upload file to Supabase storage"""
        try:
            response = (
                self.client
                .storage
                .from_(self.bucket_name)
                .upload(
                    file_path, 
                    file_data,
                    file_options={"content-type": content_type}
                )
            )
            logger.info(
                f"✅ Successfully uploaded file to {self.bucket_name}/{file_path}")
            return response
        except Exception as e:
            logger.error(f"❌ Failed to upload file: {str(e)}")
            raise e

    def get_public_url(self, file_path: str):
        """Get public URL for a file"""
        try:
            public_url = (
                self.client.storage
                .from_(self.bucket_name)
                .get_public_url(file_path)
            )
            logger.info(f"🔗 Public URL for {file_path}: {public_url}")
            return public_url
        except Exception as e:
            logger.error(f"❌ Failed to get public URL: {str(e)}")
            raise e


# FIX: Create and initialize the service immediately
supabase_service = SupabaseService()