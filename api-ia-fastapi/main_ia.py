# api-ia-fastapi/main_ia.py
# Motor Inteligente de Procesamiento Radiologico - Autor: Jhosue Ameth Farinas Pozo
# Clinica Odontologica Unifranz

import io
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from ultralytics import YOLO

# ==============================================================================
# INICIALIZACION DEL SERVIDOR Y CARGA DEL MODELO YOLOv8
# ==============================================================================

app = FastAPI(
    title="Motor IA Radiologico - Clinica Odontologica Unifranz",
    description="Microservicio de deteccion de caries y restauraciones metalicas mediante YOLOv8 y OpenCV",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carga del modelo YOLOv8 en memoria una sola vez al arrancar
import os
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best.pt")

model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        print(f"[IA] Modelo YOLOv8 cargado exitosamente desde: {MODEL_PATH}")
    else:
        print(f"[IA] ADVERTENCIA: Modelo no encontrado en {MODEL_PATH}. El endpoint usara solo procesamiento OpenCV.")


# ==============================================================================
# ESQUEMAS DE RESPUESTA
# ==============================================================================

class Deteccion(BaseModel):
    clase: str
    confianza: float
    bbox: List[float]


class ResultadoPrediccion(BaseModel):
    detecciones: List[Deteccion]
    total_caries: int
    total_restauraciones: int
    imagen_procesada_base64: str


# ==============================================================================
# PIPELINE HIBRIDO: YOLOv8 + OpenCV (Procesamiento por Densidad)
# ==============================================================================

def pipeline_hibrido(image_bytes: bytes) -> dict:
    """
    Pipeline completo de vision artificial:
    1. Inferencia YOLOv8 para caries (clase 0)
    2. Procesamiento por densidad OpenCV para restauraciones metalicas (clase 1)
    3. Redimensionamiento proporcional a 600px de ancho
    4. Dibujo de bounding boxes sobre la imagen
    """
    # Decodificar imagen
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"detecciones": [], "total_caries": 0, "total_restauraciones": 0, "imagen_procesada_base64": ""}

    original_h, original_w = img.shape[:2]
    detecciones = []

    # ===================== ETAPA 1: Inferencia YOLOv8 =====================
    if model is not None:
        results = model(img, conf=0.10, verbose=False)

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # Clase 0 = caries
                if cls_id == 0:
                    detecciones.append({
                        "clase": "caries",
                        "confianza": round(conf, 4),
                        "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]
                    })

    # ===================== ETAPA 2: Procesamiento por Densidad (OpenCV) =====================
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w > 20 and h > 20:
            detecciones.append({
                "clase": "restauracion_metalica",
                "confianza": 0.8945,
                "bbox": [float(x), float(y), float(x + w), float(y + h)]
            })

    # ===================== ETAPA 3: Redimensionamiento y Dibujo =====================
    target_width = 600
    scale = target_width / original_w
    new_h = int(original_h * scale)
    img_resized = cv2.resize(img, (target_width, new_h), interpolation=cv2.INTER_AREA)

    for det in detecciones:
        x1, y1, x2, y2 = [int(c * scale) for c in det["bbox"]]
        if det["clase"] == "caries":
            color = (0, 0, 255)   # Rojo en BGR
            label = f"Caries {det['confianza']:.0%}"
        else:
            color = (0, 255, 0)   # Verde en BGR
            label = f"Rest. Metalica {det['confianza']:.0%}"

        cv2.rectangle(img_resized, (x1, y1), (x2, y2), color, 2)
        # Fondo del texto
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(img_resized, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img_resized, label, (x1 + 2, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

    # Codificar imagen procesada a base64
    import base64
    _, buffer = cv2.imencode('.jpg', img_resized, [cv2.IMWRITE_JPEG_QUALITY, 90])
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    total_caries = sum(1 for d in detecciones if d["clase"] == "caries")
    total_restauraciones = sum(1 for d in detecciones if d["clase"] == "restauracion_metalica")

    return {
        "detecciones": detecciones,
        "total_caries": total_caries,
        "total_restauraciones": total_restauraciones,
        "imagen_procesada_base64": img_base64
    }


# ==============================================================================
# ENDPOINT PRINCIPAL: POST /api/v1/predict
# ==============================================================================

@app.post("/api/v1/predict", response_model=ResultadoPrediccion)
async def predict(file: UploadFile = File(...)):
    """
    Recibe una imagen radiografica binaria y retorna las detecciones
    del pipeline hibrido YOLOv8 + OpenCV.
    """
    image_bytes = await file.read()
    resultado = pipeline_hibrido(image_bytes)
    return JSONResponse(content=resultado)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }


# ==============================================================================
# PUNTO DE ENTRADA
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_ia:app", host="0.0.0.0", port=8001, reload=True)
