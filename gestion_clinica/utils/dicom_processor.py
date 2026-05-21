import os
import re
from io import BytesIO
from PIL import Image
import pydicom
from django.core.exceptions import ValidationError


class BiosafetyFilterError(ValidationError):
    pass


class DICOMProcessor:
    
    @staticmethod
    def extract_patient_info(dicom_bytes):
        try:
            dataset = pydicom.dcmread(BytesIO(dicom_bytes))
            patient_name = str(dataset.get('PatientName', '')).strip()
            patient_id = str(dataset.get('PatientID', '')).strip()
            return patient_name, patient_id
        except Exception:
            return None, None
    
    @staticmethod
    def clean_patient_name(name):
        name = name.replace('^', ' ').lower().strip()
        name = re.sub(r'\s+', ' ', name)
        return name
    
    @staticmethod
    def validate_biosafety(dicom_bytes, db_patient_name):
        patient_name, patient_id = DICOMProcessor.extract_patient_info(dicom_bytes)
        
        if patient_name is None:
            return True
        
        dicom_clean = DICOMProcessor.clean_patient_name(patient_name)
        db_clean = DICOMProcessor.clean_patient_name(db_patient_name)
        
        if dicom_clean != db_clean:
            raise BiosafetyFilterError(
                f"Mismatch biosafety: DICOM has '{dicom_clean}' but patient is '{db_clean}'"
            )
        return True
    
    @staticmethod
    def extract_dicom_image(dicom_bytes):
        try:
            dataset = pydicom.dcmread(BytesIO(dicom_bytes))
            if hasattr(dataset, 'pixel_array'):
                pixel_array = dataset.pixel_array
                image = Image.fromarray(pixel_array).convert('RGB')
                img_bytes = BytesIO()
                image.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                return img_bytes
        except Exception:
            pass
        return None
    
    @staticmethod
    def is_dicom_file(file_bytes):
        return file_bytes[128:132] == b'DICM'
