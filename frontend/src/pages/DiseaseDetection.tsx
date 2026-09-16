import React from 'react';
import { Scan, UploadCloud, Layers, FileCode, CheckCircle2 } from 'lucide-react';

export const DiseaseDetection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scan className="w-6 h-6 text-emerald-600" />
          CNN Leaf Disease Detection Research
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Deep learning computer vision architecture for crop health diagnosis and foliage disease identification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Prototype Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Image Inference Prototype
            </h3>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer space-y-3">
              <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Select Leaf Image File</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports JPG, PNG (Max 5MB)</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <span className="font-bold block mb-1">Week 1 Status: Research & Pipeline Design</span>
            CNN model training will take place in Week 2 using PyTorch / Transfer Learning. No fake diagnosis is returned in Week 1.
          </div>
        </div>

        {/* CNN Pipeline Design */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Computer Vision Preprocessing & Model Architecture Pipeline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700">
              <span className="block text-emerald-600 font-bold mb-1">1. Input</span>
              Leaf Image (RGB)
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700">
              <span className="block text-emerald-600 font-bold mb-1">2. Preprocess</span>
              Resize (224x224) + Normalize
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700">
              <span className="block text-emerald-600 font-bold mb-1">3. Backbone</span>
              MobileNetV2 / ResNet18
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700">
              <span className="block text-emerald-600 font-bold mb-1">4. Output</span>
              Disease Class & Severity
            </div>
          </div>

          {/* Model Specification Details */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 text-xs space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                <FileCode className="w-4 h-4" /> Recommended Academic Model Specs
              </span>
              <span className="text-slate-400 text-[10px]">PyTorch Transfer Learning</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Base Backbone: MobileNetV2 (Pre-trained on ImageNet)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Input Shape: (3, 224, 224) float32 tensor</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dataset Split: 80% Train, 10% Validation, 10% Test</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Output Layer: Softmax across candidate disease categories</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
