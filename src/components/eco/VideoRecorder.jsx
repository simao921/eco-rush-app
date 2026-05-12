import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, StopCircle, RotateCcw, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { analyzeWithAI } from "@/lib/analyzeClient";

const RECORDING_SECONDS = 10;
const FRAME_COUNT = 22;
const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 192;
const FRAME_QUALITY = 0.28;

const ACTION_PROMPTS = {
  apagar_luzes: `Verifica se este video mostra as luzes de teto de uma sala/corredor a serem apagadas de facto.
  Para ser valido TEM de se ver OBRIGATORIAMENTE:
  1. Um INTERRUPTOR a ser premido.
  2. A luz do TETO acesa e depois a apagar-se apos o toque no interruptor.`,
  reciclagem_correta: "Verifica se mostra alguem a colocar um residuo no ecoponto correto.",
  apanhar_lixo: "Verifica se mostra alguem a apanhar lixo do chao e a coloca-lo no caixote.",
  sala_limpa: "Verifica se a sala de aula esta limpa e organizada.",
  reducao_desperdicio: "Verifica acao de reducao de desperdicio.",
};

const RECORDING_STEPS = {
  apagar_luzes: [
    { at: 0, text: "1️⃣ Mostra a luz ACESA" },
    { at: 3, text: "2️⃣ Apaga a luz no INTERRUPTOR" },
    { at: 7, text: "3️⃣ Mostra a luz APAGADA" },
  ],
  reciclagem_correta: [
    { at: 0, text: "1️⃣ Mostra o residuo" },
    { at: 3, text: "2️⃣ Mostra o ecoponto" },
    { at: 6, text: "3️⃣ Coloca la dentro" },
  ],
  apanhar_lixo: [
    { at: 0, text: "1️⃣ Mostra o lixo no chao" },
    { at: 4, text: "2️⃣ Apanha e deita no lixo" },
  ],
};

export default function VideoRecorder({ onVideoAnalyzed, onVideoRejected, onCancel, actionKey = "apanhar_lixo" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recordingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [phase, setPhase] = useState("idle");
  const [loadingText, setLoadingText] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Erro camera:", err);
    }
  };

  const stopCamera = () => {
    recordingRef.current = false;
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const captureFrame = () => {
    const canvas = document.createElement("canvas");
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!videoRef.current) return null;
    ctx.drawImage(videoRef.current, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    return canvas.toDataURL("image/jpeg", FRAME_QUALITY).split(",")[1];
  };

  const analyzeFrames = async (frames, videoBlob) => {
    setPhase("analyzing");
    setLoadingText("A preparar dados...");
    try {
      const actionPrompt = ACTION_PROMPTS[actionKey] || ACTION_PROMPTS["apanhar_lixo"];

      setLoadingText("IA a validar acao (aguarda)...");

      const result = await analyzeWithAI({
        prompt: `Analisa este vídeo. ${actionPrompt} Responde APENAS em JSON: {"valid":boolean, "reason":"string"}.
IMPORTANTE: No campo 'reason', justifica a tua decisão falando diretamente para os alunos. NUNCA uses as palavras 'frame', 'frames', 'imagem' ou 'fotografia'. Refere-te sempre ao conteúdo como 'no vídeo' ou 'a vossa ação'.
CRÍTICO ANTIFRAUDE: Se detetares que este vídeo está a ser filmado a partir de outro ecrã (como um telemóvel, tablet, computador ou TV a mostrar um vídeo já gravado), REJEITA IMEDIATAMENTE (valid:false) e diz que não aceitas vídeos de outros ecrãs.`,
        images: frames,
      });

      const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const videoFileName = `recordings/v_${Date.now()}.${ext}`;
      const thumbFileName = `thumbnails/t_${Date.now()}.jpg`;

      const uploadVideo = supabase.storage.from('videos').upload(videoFileName, videoBlob).catch(e => console.warn("Erro video:", e));
      
      const middleFrameBase64 = (frames && frames.length > 0) ? frames[Math.floor(frames.length / 2)] : null;
      if (!middleFrameBase64) throw new Error("Nao foi possivel capturar imagens para a prova.");

      const middleFrameBlob = await (await fetch(`data:image/jpeg;base64,${middleFrameBase64}`)).blob();
      const uploadThumb = supabase.storage.from('videos').upload(thumbFileName, middleFrameBlob).catch(e => console.warn("Erro thumb:", e));

      await Promise.all([uploadVideo, uploadThumb]);
      
      const { data: { publicUrl: videoUrl } } = supabase.storage.from('videos').getPublicUrl(videoFileName);
      const { data: { publicUrl: photoUrl } } = supabase.storage.from('videos').getPublicUrl(thumbFileName);

      const final = { ...result, photo_url: photoUrl, video_url: videoUrl };
      setAnalysisResult(final);
      setPhase(result.valid ? "done" : "failed");
      if (!result.valid) onVideoRejected(final);
    } catch (error) {
      console.error("Erro na analise:", error);
      setAnalysisResult({ valid: false, reason: error.message || "A ligacao falhou. Tenta de novo." });
      setPhase("failed");
    }
  };

  const startRecording = async () => {
    setPhase("recording");
    recordingRef.current = true;
    chunksRef.current = [];
    const frames = [];
    
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mediaRecorder.onstop = () => {
      if (frames.length > 0) analyzeFrames(frames, new Blob(chunksRef.current, { type: mimeType }));
    };

    mediaRecorder.start();
    
    let secs = RECORDING_SECONDS;
    setCountdown(secs);

    const frameIntervalMs = (RECORDING_SECONDS * 1000) / FRAME_COUNT;
    
    const recordingInterval = setInterval(async () => {
      if (!recordingRef.current) {
        clearInterval(recordingInterval);
        return;
      }
      if (frames.length < FRAME_COUNT) {
        const frame = await captureFrame();
        if (frame) frames.push(frame);
      }
    }, frameIntervalMs);

    const uiTimer = setInterval(() => {
      secs--;
      if (secs < 0) secs = 0;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(uiTimer);
        stopEverything();
      }
    }, 1000);

    const stopEverything = () => {
      if (!recordingRef.current) return;
      recordingRef.current = false;
      clearInterval(recordingInterval);
      clearInterval(uiTimer);
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    };
  };

  const currentStep = (() => {
    const steps = RECORDING_STEPS[actionKey] || [];
    const elapsed = RECORDING_SECONDS - (countdown ?? RECORDING_SECONDS);
    let active = steps[0];
    for (const step of steps) { if (elapsed >= step.at) active = step; }
    return active;
  })();

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto p-2">
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border shadow-2xl" style={{ aspectRatio: "3/4" }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover" 
        />
        {phase === "recording" && (
          <>
            <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full" /> REC {countdown}s
            </div>
            {currentStep && (
              <div className="absolute bottom-6 left-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-5 py-3 rounded-2xl text-center border border-white/10 shadow-2xl">
                {currentStep.text}
              </div>
            )}
          </>
        )}
        {phase === "analyzing" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-white text-sm font-heading font-medium">{loadingText}</p>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="w-full space-y-4 px-2">
          <div className="bg-muted/50 p-4 rounded-2xl space-y-2 border border-border/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black text-center">Instruções</p>
            {(RECORDING_STEPS[actionKey] || []).map((s, i) => (
              <p key={i} className="text-xs font-body text-center leading-relaxed">{s.text}</p>
            ))}
          </div>
          <Button onClick={startRecording} size="lg" className="w-full h-16 text-lg font-heading rounded-2xl shadow-xl shadow-primary/20">
            <Video className="mr-2 h-6 w-6" /> Iniciar Gravação
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full h-12 rounded-xl text-muted-foreground">Cancelar</Button>
        </div>
      )}

      {phase === "recording" && (
        <Button variant="destructive" onClick={() => { recordingRef.current = false; setPhase("idle"); }} className="w-full h-16 text-lg font-heading rounded-2xl shadow-xl shadow-red-500/20">Parar Gravação</Button>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4 w-full px-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-2">
            <div className="text-green-600 font-black flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-6 w-6" /> VALIDADO!
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{analysisResult?.reason}</p>
          </div>
          <Button onClick={() => onVideoAnalyzed(analysisResult)} size="lg" className="w-full h-16 text-lg font-heading rounded-2xl shadow-xl shadow-primary/20">
            Submeter Agora
          </Button>
        </div>
      )}

      {phase === "failed" && (
        <div className="text-center space-y-4 w-full px-2">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-2">
            <p className="text-red-500 font-black mb-1">NÃO VALIDADO</p>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">{analysisResult?.reason}</p>
          </div>
          <Button variant="outline" onClick={() => { setPhase("idle"); setAnalysisResult(null); startCamera(); }} className="w-full h-16 text-lg font-heading rounded-2xl">
            Tentar de novo
          </Button>
        </div>
      )}
    </div>
  );
}
