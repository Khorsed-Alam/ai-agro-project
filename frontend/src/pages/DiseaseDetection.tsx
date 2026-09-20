import React, { useRef, useState } from 'react';
import { apiService } from '../services/api';

type DiagnosisState = 'idle' | 'loading' | 'result';

export const DiseaseDetection: React.FC = () => {
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      if (!preview) return;
      setDiagnosisState('loading');
      setTimeout(() => setDiagnosisState('result'), 1500);
      return;
    }
    setDiagnosisState('loading');
    try {
      const res = await apiService.analyzeDiseaseImage(selectedFile);
      setApiResponse(res);
      // Log disease scan to activity log stream
      await apiService.createLog({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'Disease',
        field: 'Uploaded Leaf Image',
        description: `Foliar scan result: ${res.predicted_disease} (${res.confidence_percent || 94.8}%)`,
        engine: 'CNN MobileNetV2',
        status: 'Action Flagged'
      });
    } catch {
      console.warn('Backend processing error, showing fallback response.');
    } finally {
      setDiagnosisState('result');
    }
  };

  const handleReset = () => {
    setDiagnosisState('idle');
    setPreview(null);
    setSelectedFile(null);
    setFileName(null);
    setApiResponse(null);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="px-margin-lg py-margin flex flex-col gap-space-xl max-w-[1600px] mx-auto w-full">

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '15px' }}>filter_center_focus</span>
              <span>AI &amp; Analysis</span>
              <span>/</span>
              <span>Disease Detection Studio</span>
            </div>
            <h1 className="font-display-lg text-on-surface tracking-tight">Disease Detection Studio</h1>
            <p className="font-body-lg text-on-surface-variant">
              CNN-powered leaf disease analysis via computer vision and transfer learning
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0 bg-surface-container-low px-space-md py-space-sm rounded-xl shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="flex flex-col">
              <span className="font-label-sm text-on-surface font-semibold">CNN Model: Research Ready</span>
              <span className="font-label-sm text-on-surface-variant">MobileNetV2 backbone — Training pending</span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">

          {/* Left: Upload + Analyze */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)', borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
                <h2 className="font-headline-sm text-on-surface font-semibold">Image Upload &amp; Analysis</h2>
                <p className="font-label-md text-on-surface-variant mt-space-xs">Upload a leaf image to run CNN inference</p>
              </div>

              <div className="p-space-lg flex flex-col gap-space-md">
                {/* Upload Zone */}
                {!preview ? (
                  <button
                    type="button"
                    className="relative w-full flex flex-col items-center justify-center gap-space-md p-space-xl rounded-xl cursor-pointer transition-colors"
                    style={{
                      border: '2px dashed rgba(193,200,194,0.6)',
                      backgroundColor: '#f8f9ff'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileSelect(file);
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '32px' }}>
                        upload_file
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-body-sm text-on-surface font-semibold">Drop a leaf image here</p>
                      <p className="font-label-md text-on-surface-variant mt-space-xs">or click to browse • JPG, PNG (Max 5MB)</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(193,200,194,0.4)' }}>
                    <img src={preview} alt="Selected leaf" className="w-full h-56 object-cover" />
                    <button
                      className="absolute top-2 right-2 w-8 h-8 bg-inverse-surface/80 text-inverse-on-surface rounded-full flex items-center justify-center"
                      onClick={handleReset}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-inverse-surface/70 px-space-md py-space-xs">
                      <span className="font-label-sm text-inverse-on-surface">{fileName}</span>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />

                {/* Analyze Button */}
                <button
                  disabled={!preview || diagnosisState === 'loading'}
                  onClick={handleAnalyze}
                  className="w-full h-10 bg-primary-container text-on-primary rounded-lg font-label-md font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-space-xs transition-all"
                >
                  {diagnosisState === 'loading' ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 animate-spin" style={{ borderTopColor: '#ffffff' }} />
                      <span>Analyzing Image...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                      <span>Analyze Image</span>
                    </>
                  )}
                </button>

                {/* Research note */}
                <div className="p-space-md rounded-lg bg-amber-50 font-body-sm text-amber-900"
                  style={{ border: '1px solid #fcd34d' }}>
                  <span className="font-semibold block">Research Mode Active</span>
                  CNN model training will use PyTorch / Transfer Learning.
                  {diagnosisState === 'result' && ' Results shown below are demonstration outputs only.'}
                </div>
              </div>
            </div>

            {/* Diagnosis Result */}
            {diagnosisState === 'result' && (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden"
                style={{ border: '1px solid rgba(193,200,194,0.4)' }}>
                <div className="px-space-lg py-space-md flex items-center gap-space-sm"
                  style={{ backgroundColor: 'rgba(255,218,214,0.2)', borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
                  <span className="material-symbols-outlined text-error" style={{ fontSize: '20px' }}>biotech</span>
                  <h3 className="font-headline-sm text-on-surface font-semibold">CNN Inference Result</h3>
                  <span className="ml-auto font-label-sm px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    {apiResponse?.status || 'Demo / Model Not Trained'}
                  </span>
                </div>
                <div className="p-space-lg space-y-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-on-surface font-semibold">
                      {apiResponse?.predicted_disease || 'Early Blight (Alternaria solani)'}
                    </span>
                    <span className="font-data-mono text-secondary font-semibold">
                      {apiResponse?.confidence_percent || 94.8}% confidence
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between font-label-sm text-on-surface-variant mb-space-xs">
                      <span>Confidence Score</span>
                      <span>{apiResponse?.confidence_percent || 94.8}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full overflow-hidden" style={{ height: '8px' }}>
                      <div className="h-full rounded-full bg-error" style={{ width: `${apiResponse?.confidence_percent || 94.8}%` }} />
                    </div>
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    ⚠️ {apiResponse?.treatment_recommendation || 'Apply copper hydroxide fungicide spray at 2.5 g/L.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: CNN Pipeline */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            {/* CNN Pipeline Steps */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md flex items-center gap-space-xs"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)', borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>account_tree</span>
                <h2 className="font-headline-sm text-on-surface font-semibold">Computer Vision Pipeline Architecture</h2>
              </div>

              <div className="p-space-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mb-space-lg">
                  {[
                    { step: '1', label: 'Input', desc: 'Leaf Image (RGB)', icon: 'image' },
                    { step: '2', label: 'Preprocess', desc: 'Resize 224×224 + Normalize', icon: 'transform' },
                    { step: '3', label: 'Backbone', desc: 'MobileNetV2 / ResNet18', icon: 'hub' },
                    { step: '4', label: 'Output', desc: 'Disease Class & Severity', icon: 'output' },
                  ].map(({ step, label, desc, icon }) => (
                    <div key={step} className="flex flex-col items-center text-center p-space-md rounded-xl gap-space-sm"
                      style={{ backgroundColor: '#f8f9ff', border: '1px solid rgba(193,200,194,0.3)' }}>
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-semibold">
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                      </div>
                      <div className="font-label-md font-semibold text-secondary uppercase tracking-wider">{label}</div>
                      <div className="font-body-sm text-on-surface-variant">{desc}</div>
                    </div>
                  ))}
                </div>

                {/* Model Specifications */}
                <div className="rounded-xl p-space-lg space-y-space-md font-mono text-sm"
                  style={{ backgroundColor: '#27313f', color: '#eaf1ff' }}>
                  <div className="flex items-center justify-between pb-space-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-secondary-fixed font-semibold flex items-center gap-space-xs">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>terminal</span>
                      Recommended Academic Model Specs
                    </span>
                    <span className="font-label-sm text-on-surface-variant" style={{ color: 'rgba(234,241,255,0.5)' }}>
                      PyTorch Transfer Learning
                    </span>
                  </div>
                  <div className="space-y-space-sm font-body-sm" style={{ fontSize: '13px' }}>
                    {[
                      'Base Backbone: MobileNetV2 (Pre-trained on ImageNet)',
                      'Input Shape: (3, 224, 224) float32 tensor',
                      'Dataset Split: 80% Train, 10% Validation, 10% Test',
                      'Output Layer: Softmax across candidate disease categories',
                      'Optimizer: Adam (lr=0.001) with CosineAnnealingLR',
                    ].map((spec) => (
                      <div key={spec} className="flex items-start gap-space-sm">
                        <span className="material-symbols-outlined text-secondary-fixed shrink-0" style={{ fontSize: '14px' }}>
                          check_circle
                        </span>
                        <span style={{ color: 'rgba(234,241,255,0.8)' }}>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disease Class Reference */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)', borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
                <h2 className="font-headline-sm text-on-surface font-semibold">Target Disease Classifications</h2>
              </div>
              <div className="p-space-lg grid grid-cols-2 md:grid-cols-3 gap-space-sm">
                {[
                  { name: 'Leaf Septoria', severity: 'High', color: '#ba1a1a' },
                  { name: 'Powdery Mildew', severity: 'Moderate', color: '#b45309' },
                  { name: 'Early Blight', severity: 'Moderate', color: '#b45309' },
                  { name: 'Late Blight', severity: 'Critical', color: '#7f1d1d' },
                  { name: 'Leaf Rust', severity: 'Moderate', color: '#b45309' },
                  { name: 'Healthy', severity: 'None', color: '#296b3c' },
                ].map(({ name, severity, color }) => (
                  <div key={name} className="p-space-sm rounded-lg flex items-center gap-space-sm"
                    style={{ backgroundColor: '#f8f9ff', border: '1px solid rgba(193,200,194,0.3)' }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div>
                      <div className="font-body-sm text-on-surface font-medium">{name}</div>
                      <div className="font-label-sm" style={{ color }}>{severity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
