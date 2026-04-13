import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

// ── Configuration ────────────────────────────────────
const DETECTION_INTERVAL_MS = 2000;        // Run detection every 2s
const NO_FACE_THRESHOLD = 3;               // 3 consecutive frames (~6s) = violation
const MULTI_FACE_THRESHOLD = 2;            // 2 consecutive frames (~4s) = violation
const MIN_FACE_SIZE_RATIO = 0.05;          // Face < 5% of frame = too far
const GRACE_PERIOD_MS = 10000;             // 10s grace at start

/**
 * useAIProctor — client-side AI face detection hook
 *
 * @param {Object}   options
 * @param {Object}   options.videoRef       - React ref to the <video> element
 * @param {Function} options.onViolation    - callback(violationType: string)
 * @param {boolean}  options.enabled        - only run when webcam is active
 *
 * @returns {{ isModelLoaded, detectionStatus, faceCount }}
 */
const useAIProctor = ({ videoRef, onViolation, enabled = false }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('initializing'); // initializing | grace | monitoring | error
  const [faceCount, setFaceCount] = useState(0);

  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const noFaceCountRef = useRef(0);
  const multiFaceCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const onViolationRef = useRef(onViolation);

  // Keep callback ref fresh without re-triggering effects
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ── Load MediaPipe FaceDetector model ──
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.5,
        });
        if (!cancelled) {
          detectorRef.current = detector;
          startTimeRef.current = Date.now();
          setIsModelLoaded(true);
          setDetectionStatus('grace');
        }
      } catch (err) {
        console.warn('[AI Proctor] Model load failed:', err);
        if (!cancelled) setDetectionStatus('error');
      }
    };

    loadModel();
    return () => { cancelled = true; };
  }, [enabled]);

  // ── Detection loop ──
  const runDetection = useCallback(() => {
    const detector = detectorRef.current;
    const video = videoRef?.current;

    if (!detector || !video || video.readyState < 2) return;

    // Grace period check
    if (startTimeRef.current && Date.now() - startTimeRef.current < GRACE_PERIOD_MS) {
      setDetectionStatus('grace');
      return;
    }
    setDetectionStatus('monitoring');

    try {
      const result = detector.detect(video);
      const faces = result.detections || [];
      setFaceCount(faces.length);

      // ── No face detected ──
      if (faces.length === 0) {
        noFaceCountRef.current += 1;
        if (noFaceCountRef.current >= NO_FACE_THRESHOLD) {
          onViolationRef.current?.('no_face_detected');
          noFaceCountRef.current = 0; // reset after firing
        }
      } else {
        noFaceCountRef.current = 0;
      }

      // ── Multiple faces ──
      if (faces.length > 1) {
        multiFaceCountRef.current += 1;
        if (multiFaceCountRef.current >= MULTI_FACE_THRESHOLD) {
          onViolationRef.current?.('multiple_faces');
          multiFaceCountRef.current = 0;
        }
      } else {
        multiFaceCountRef.current = 0;
      }

      // ── Face too far (too small in frame) ──
      if (faces.length === 1) {
        const bbox = faces[0].boundingBox;
        if (bbox) {
          const faceArea = (bbox.width * bbox.height) / (video.videoWidth * video.videoHeight);
          if (faceArea < MIN_FACE_SIZE_RATIO) {
            onViolationRef.current?.('face_too_far');
          }
        }
      }
    } catch (err) {
      // Silently ignore detection errors (e.g., video not ready)
    }
  }, [videoRef]);

  // ── Start/stop detection interval ──
  useEffect(() => {
    if (!isModelLoaded || !enabled) return;

    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isModelLoaded, enabled, runDetection]);

  // ── Cleanup detector on unmount ──
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        try { detectorRef.current.close(); } catch {}
        detectorRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isModelLoaded, detectionStatus, faceCount };
};

export default useAIProctor;
