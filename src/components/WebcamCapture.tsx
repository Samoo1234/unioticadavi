import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface WebcamCaptureProps {
  onCapture: (imageUrl: string) => void;
  currentImage?: string;
}

export function WebcamCapture({ onCapture, currentImage }: WebcamCaptureProps) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleOpen = () => {
    setOpen(true);
    setCapturedImage(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        {currentImage && (
          <Box
            component="img"
            src={currentImage}
            alt="Foto do cliente"
            sx={{
              width: 150,
              height: 150,
              borderRadius: 2,
              objectFit: 'cover',
              border: '2px solid #ddd'
            }}
          />
        )}
        <Button
          variant="outlined"
          startIcon={<CameraIcon />}
          onClick={handleOpen}
          fullWidth
        >
          {currentImage ? 'Alterar Foto' : 'Capturar Foto'}
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Capturar Foto
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    borderRadius: 8,
                    backgroundColor: '#000'
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Posicione-se na frente da câmera
                </Typography>
              </>
            ) : (
              <>
                <img
                  src={capturedImage}
                  alt="Foto capturada"
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    borderRadius: 8
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Foto capturada com sucesso!
                </Typography>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          {!capturedImage ? (
            <>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={capturePhoto}
              >
                Capturar
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<RefreshIcon />}
                onClick={retakePhoto}
              >
                Tirar Novamente
              </Button>
              <Button
                variant="contained"
                onClick={confirmPhoto}
              >
                Confirmar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
