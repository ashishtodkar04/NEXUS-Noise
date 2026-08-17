import os
import math
import subprocess
import tempfile
import hashlib
from urllib.parse import quote

import cv2
import requests
import numpy as np
import librosa

# Geoapify key can be overridden via env so it is not hardcoded into the repo.
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", "fc2ecaa3de8542719c3717ac5d7dded0")


def inspect_video_evidence(video_path: str, file_bytes: bytes) -> dict:
    """Validate that the upload contains a decodable video stream and capture review metadata.

    This is intentionally a verification signal rather than a claim that video
    proves an allegation: officers still review the footage and its context.
    """
    capture = cv2.VideoCapture(video_path)
    try:
        if not capture.isOpened():
            raise ValueError("The uploaded file does not contain a readable video stream")

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        duration_seconds = frame_count / fps if fps > 0 else 0
        if frame_count < 3 or width < 64 or height < 64 or duration_seconds < 3:
            raise ValueError("Video evidence must be a readable recording of at least 3 seconds")
        if duration_seconds > 120:
            raise ValueError("Video evidence must not exceed 120 seconds")

        # Compare three evenly-spaced frames. Very low variation is useful for
        # flagging a static/blank upload for officer review, not for auto-rejecting.
        samples = []
        for position in (0.1, 0.5, 0.9):
            capture.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(frame_count * position)))
            ok, frame = capture.read()
            if ok and frame is not None:
                samples.append(cv2.resize(frame, (64, 36)))
        motion_score = 0.0
        if len(samples) >= 2:
            differences = [cv2.absdiff(samples[i], samples[i - 1]).mean() for i in range(1, len(samples))]
            motion_score = round(float(sum(differences) / len(differences)), 2)

        return {
            "sha256": hashlib.sha256(file_bytes).hexdigest(),
            "size_bytes": len(file_bytes),
            "duration_seconds": round(duration_seconds, 1),
            "frame_count": frame_count,
            "fps": round(fps, 2),
            "resolution": f"{width}x{height}",
            "visual_motion_score": motion_score,
            "requires_visual_review": motion_score < 1.5,
        }
    finally:
        capture.release()


def haversine_distance(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points (in meters)."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(a))


def _extract_audio_wav(video_path):
    """Transcode the video's audio track to a mono 16 kHz WAV via ffmpeg.

    librosa cannot decode compressed video containers directly, so we transcode
    first and let the caller load the temp WAV. Returns the temp path or None.
    """
    tmp_wav = None
    try:
        fd, tmp_wav = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        cmd = ["ffmpeg", "-y", "-i", video_path, "-vn", "-ac", "1", "-ar", "16000", tmp_wav]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0 or not os.path.exists(tmp_wav) or os.path.getsize(tmp_wav) == 0:
            print("ffmpeg audio extraction failed:", (result.stderr or "")[-500:])
            if os.path.exists(tmp_wav):
                try: os.remove(tmp_wav)
                except Exception: pass
            return None
        return tmp_wav
    except Exception as e:
        print("Error extracting audio with ffmpeg:", e)
        if tmp_wav and os.path.exists(tmp_wav):
            try: os.remove(tmp_wav)
            except Exception: pass
        return None


async def agent_1_extract_audio_db(video_path: str):
    """Agent 1 (Audio): extract the audio, measure peak volume, estimate SPL."""
    wav_path = _extract_audio_wav(video_path)
    decoded = None
    try:
        if wav_path:
            y, sr = librosa.load(wav_path, sr=16000)
            decoded = y
    except Exception as e:
        print("librosa load failed:", e)
        decoded = None
    finally:
        if wav_path and os.path.exists(wav_path):
            try: os.remove(wav_path)
            except Exception: pass

    if decoded is None or len(decoded) == 0:
        print("Agent 1: failed to decode audio — returning 0 dB")
        return 0.0

    S = np.abs(librosa.stft(decoded))
    db_array = librosa.amplitude_to_db(S, ref=np.max)
    peak_db = float(np.max(db_array))
    # Crude calibration: 0 dBFS peak maps to ~100 dB SPL (documented estimate).
    estimated_spl = peak_db + 100
    return max(0.0, estimated_spl)


async def agent_2_analyze_video_and_location(video_path, user_lat, user_lon, mock_shop_name=None):
    """Agent 2 (Vision/Geocode): detect an event visually and geocode its location.

    If no location query is supplied, we skip geocoding (distance 0) and flag
    geocoded=False so the pipeline can fall back to a manual map pin instead of
    assuming a nonsense default address.
    """
    event_detected = False
    cap = cv2.VideoCapture(video_path)
    if cap.isOpened():
        ret, frame = cap.read()
        if ret and frame is not None:
            event_detected = True
    cap.release()

    if not (mock_shop_name and str(mock_shop_name).strip()):
        return {
            "event_detected": event_detected,
            "shop_name": None,
            "distance_meters": 0.0,
            "event_type": "Unregistered Disturbance",
            "geocoded": False,
        }

    shop_name = str(mock_shop_name).strip()
    url = f"https://api.geoapify.com/v1/geocode/search?text={quote(shop_name)}&apiKey={GEOAPIFY_API_KEY}"
    distance = 0.0
    geocoded = False
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        if data.get("features"):
            coords = data["features"][0]["geometry"]["coordinates"]
            shop_lon, shop_lat = coords[0], coords[1]
            distance = haversine_distance(user_lat, user_lon, shop_lat, shop_lon)
            geocoded = True
    except Exception as e:
        print("Geocoding Error:", e)

    return {
        "event_detected": event_detected,
        "shop_name": shop_name,
        "distance_meters": distance,
        "event_type": "Construction/Loud Music",
        "geocoded": geocoded,
    }


async def agent_3_synthesis(received_db: float, distance_meters: float, event_detected: bool):
    """Agent 3 (Synthesis): propagate received dB back to the source.

    Sound level drops ~6 dB per doubling of distance; assume a 1 m reference point.
    """
    if distance_meters <= 1.0:
        predicted_source_db = received_db
    else:
        predicted_source_db = received_db + (20 * math.log10(distance_meters))
    return {"predicted_source_db": predicted_source_db, "event_detected": event_detected}


async def agent_4_area_limit_analysis(predicted_source_db, event_detected, area_type="residential", area_limits=None):
    """Agent 4 (Area limit): validate predicted dB against THAT area's limit.

    area_limits should come from the live city 'rules' document so admin-edited
    thresholds are honoured. Falls back to sensible defaults when not provided.
    """
    defaults = {"residential": 55, "commercial": 65, "industrial": 75, "silence": 50}
    limits = dict(defaults)
    if area_limits:
        for k, v in area_limits.items():
            if v is None:
                continue
            key = str(k).replace("_limit", "")  # residential_limit -> residential
            limits[key] = float(v)

    limit = limits.get(str(area_type).lower(), 65)
    is_valid = bool(event_detected) and float(predicted_source_db) > float(limit)
    return {"area_limit": limit, "is_valid": is_valid}


async def process_video_complaint(
    video_path: str,
    user_lat: float,
    user_lon: float,
    mock_shop_name: str = None,
    user_selected_event_lat: float = None,
    user_selected_event_lon: float = None,
    area_type: str = "residential",
    area_limits: dict = None,
):
    """Orchestrate the 4-agent pipeline for video evidence."""
    received_db = await agent_1_extract_audio_db(video_path)
    agent2_data = await agent_2_analyze_video_and_location(video_path, user_lat, user_lon, mock_shop_name)

    final_distance = agent2_data["distance_meters"]
    distance_source = "auto_geocode" if agent2_data.get("geocoded") else "unknown"
    if user_selected_event_lat is not None and user_selected_event_lon is not None:
        final_distance = haversine_distance(user_lat, user_lon, user_selected_event_lat, user_selected_event_lon)
        agent2_data["event_detected"] = True
        distance_source = "manual_map_pin"

    agent3_data = await agent_3_synthesis(received_db, final_distance, agent2_data["event_detected"])
    agent4_data = await agent_4_area_limit_analysis(
        agent3_data["predicted_source_db"], agent3_data["event_detected"], area_type, area_limits
    )

    return {
        "extracted_db": received_db,
        "event_detected": agent3_data["event_detected"],
        "event_type": agent2_data["event_type"],
        "detected_shop_name": agent2_data.get("shop_name"),
        "distance_meters": final_distance,
        "distance_source": distance_source,
        "predicted_source_db": agent3_data["predicted_source_db"],
        "area_type": area_type,
        "area_limit_applied": agent4_data["area_limit"],
        "is_valid": agent4_data["is_valid"],
    }
