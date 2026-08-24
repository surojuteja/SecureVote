import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, RefreshCw, AlertCircle, CheckCircle2, XCircle, Sparkles, Scan } from 'lucide-react'

const videoConstraints = {
  width: 480,
  height: 360,
  facingMode: 'user',
}

export default function WebcamCapture({ onCapture, capturedImage, onRetake, verificationStatus }) {
  const webcamRef = useRef(null)
  const [cameraError, setCameraError] = useState(null)
  const [isCameraReady, setIsCameraReady] = useState(false)

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        onCapture(imageSrc)
      }
    }
  }, [onCapture])

  const handleUserMediaError = (error) => {
    console.error('Camera error:', error)
    setCameraError('Camera access denied or unavailable. Please enable camera permissions in your browser.')
  }

  if (cameraError) {
    return (
      <div className="camera-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <AlertCircle size={44} style={{ color: 'var(--danger)' }} />
        <p style={{ color: '#ffffff', fontSize: '0.85rem' }}>{cameraError}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setCameraError(null)}>
          <RefreshCw size={14} /> Retry Camera
        </button>
      </div>
    )
  }

  if (capturedImage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="camera-container">
          <img src={capturedImage} alt="Captured biometric face" />
          
          {/* Target Reticles */}
          <div className="hud-corner top-left" />
          <div className="hud-corner top-right" />
          <div className="hud-corner bottom-left" />
          <div className="hud-corner bottom-right" />

          {verificationStatus && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(6, 9, 19, 0.7)', backdropFilter: 'blur(4px)', gap: 12
            }}>
              {verificationStatus === 'verifying' && (
                <>
                  <RefreshCw className="spin" size={44} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Matching Biometric Template...</span>
                </>
              )}
              {verificationStatus === 'success' && (
                <>
                  <CheckCircle2 size={54} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--success)' }}>Face Verified Successfully!</span>
                </>
              )}
              {verificationStatus === 'failed' && (
                <>
                  <XCircle size={54} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--danger)' }}>Face Match Failed</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="camera-controls">
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetake}>
            <RefreshCw size={14} /> Retake Snapshot
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="camera-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={() => setIsCameraReady(true)}
          onUserMediaError={handleUserMediaError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          mirrored
        />

        {/* Biometric HUD Reticles & Target Guide */}
        {isCameraReady && (
          <div className="camera-hud-overlay">
            <div className="hud-corner top-left" />
            <div className="hud-corner top-right" />
            <div className="hud-corner bottom-left" />
            <div className="hud-corner bottom-right" />
            <div className="face-target-guide" />
            <div className="hud-scan-line" />
            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.65)', padding: '3px 10px', borderRadius: 20, color: 'var(--primary)', border: '1px solid rgba(0,240,255,0.3)' }}>
                <Scan size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Align face inside oval
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="camera-controls">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={capture}
          disabled={!isCameraReady}
        >
          <Camera size={15} /> Capture Biometric Snapshot
        </button>
      </div>
    </div>
  )
}
