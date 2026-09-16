import React, { useEffect, useState } from 'react';
import type { Field } from '../types';
import { apiService } from '../services/api';
import { Sprout, Droplets, Thermometer, CloudRain, Info } from 'lucide-react';
import { DEMO_DATA_LABEL } from '../data/sampleFields';

export const Fields: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getFields().then((data) => {
      setFields(data);
      setLoading(false);
    });
  }, []);

  const getStatusStyle = (status: Field['status']) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Dry':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-600" />
            Field Environmental Data Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and agronomic metrics per field sector.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
          <Info className="w-4 h-4 text-amber-600" />
          {DEMO_DATA_LABEL}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading field dataset...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 hover:shadow-md transition-shadow"
            >
              {/* Field Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{field.name}</h3>
                  <span className="text-xs text-slate-500">Crop: <strong className="text-slate-700">{field.crop}</strong></span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusStyle(field.status)}`}>
                  {field.status}
                </span>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium block">Soil Moisture</span>
                    <span className="text-sm font-bold text-slate-800">{field.soilMoisture}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Sprout className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium block">Soil pH</span>
                    <span className="text-sm font-bold text-slate-800">{field.soilPH} pH</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium block">Temperature</span>
                    <span className="text-sm font-bold text-slate-800">{field.temperature}°C</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <CloudRain className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium block">Rainfall</span>
                    <span className="text-sm font-bold text-slate-800">{field.rainfall} mm</span>
                  </div>
                </div>
              </div>

              {/* Requirement footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Water Priority:</span>
                <span className="font-bold text-slate-800">{field.waterRequirement}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
