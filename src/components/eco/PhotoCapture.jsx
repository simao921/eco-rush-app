import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, CheckCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/api/base44Client";
import { analyzeWithAI } from "@/lib/analyzeClient";

const PHOTO_WIDTH = 480;
const PHOTO_HEIGHT = 360;
const PHOTO_QUALITY = 0.55;

export default function PhotoCapture({ onPhotoAnalyzed, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | analyzing | done | failed
  const [analysisResult, setAnalysisResult] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Erro camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);

    const base64 = canvas.toDataURL("image/jpeg", PHOTO_QUALITY).split(",")[1];
    const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
    
    stopCamera();
    analyzePhoto(base64, blob);
  };

  const analyzePhoto = async (base64, blob) => {
    setPhase("analyzing");
    try {
      const result = await analyzeWithAI({
        prompt: `Analisa esta foto. Verifica se mostra claramente alguem a deitar lixo num caixote. Responde apenas JSON: {"valid":boolean, "reason":"string"}`,
        images: [base64],
      });

      // 2. Upload da prova em background
      const fileName = `photos/p_${Date.now()}.jpg`;
      await supabase.storage.from('videos').upload(fileName, blob);
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);
      
      setPhotoUrl(publicUrl);
      setAnalysisResult(result);
      setPhase(result.valid ? "done" : "failed");
    } catch (error) {
      console.error("Erro:", error);
      setAnalysisResult({ valid: false, reason: error.message || "Falha na ligacao com a IA." });
      setPhase("failed");
    }
  };

  const handleConfirm = () => {
    onPhotoAnalyzed({ aiAnalysis: analysisResult.reason, aiValid: true, photoUrl });
  };

  const handleReset = () => {
    setPhase("idle");
    setAnalysisResult(null);
    setPhotoUrl(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto p-2">
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border shadow-2xl aspect-video">
        {phase === "idle" && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        {(photoUrl || phase !== "idle") && (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="foto" className="w-full h-full object-cover" />
            ) : (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="text-center space-y-4 w-full px-2">
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Tira uma foto a mostrar a ação de deitar lixo no caixote
          </p>
          <Button onClick={takePhoto} className="w-full h-16 text-lg font-heading rounded-2xl shadow-xl shadow-primary/20 gap-2">
            <Camera className="h-6 w-6" /> Tirar foto
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel} className="w-full h-10 rounded-xl text-muted-foreground">Cancelar</Button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="text-center space-y-3 py-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-heading font-medium text-muted-foreground">A verificar foto com IA...</p>
        </div>
      )}

      {phase === "done" && analysisResult && (
        <div className="text-center space-y-4 w-full px-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-green-600 justify-center mb-2">
              <CheckCircle className="h-6 w-6" />
              <span className="font-heading font-black">Foto validada!</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{analysisResult.reason}</p>
          </div>
          <Button onClick={handleConfirm} className="w-full h-16 text-lg font-heading rounded-2xl shadow-xl shadow-primary/20 gap-2">
            Confirmar ação (+5 pts)
          </Button>
        </div>
      )}

      {phase === "failed" && analysisResult && (
        <div className="text-center space-y-4 w-full px-2">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-red-500 justify-center mb-2">
              <X className="h-6 w-6" />
              <span className="font-heading font-black">Foto não validada</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{analysisResult.reason}</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button variant="outline" onClick={handleReset} className="w-full h-16 text-lg font-heading rounded-2xl gap-2">
              <RotateCcw className="h-5 w-5" /> Tentar novamente
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="w-full h-10 rounded-xl text-muted-foreground">Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
