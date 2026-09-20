/**
 * AgroAI — Farmer Field Worker Workspace
 * Route: /farmer-dashboard
 * Mobile-optimized workspace for field workers to view assigned fields, Mapbox boundaries/paths, submit land telemetry, and upload Cloudinary field images.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AgroMap } from '../components/map/AgroMap';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinary';
import { apiService } from '../services/api';
import type { Field, FieldImageRecord, FieldLandData } from '../services/ecosystem';
import {
  getFarmerAssignedFields,
  submitFieldData,
  recordFieldImage,
  getFieldImages,
  getFieldData,
  ECOSYSTEM_UPDATED_EVENT,
  notifyEcosystemChange,
} from '../services/ecosystem';

export const FarmerDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();

  const [assignedFields, setAssignedFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [fieldImages, setFieldImages] = useState<FieldImageRecord[]>([]);
  const [fieldSubmissions, setFieldSubmissions] = useState<FieldLandData[]>([]);

  // Workspace Active Tab: 'entry' (New Telemetry / Upload) | 'history' (Submissions Feed)
  const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');

  // Form: Soil & Land Telemetry Data
  const [moisture, setMoisture] = useState<number>(38.5);
  const [ph, setPh] = useState<number>(6.5);
  const [temp, setTemp] = useState<number>(28.0);
  const [nitrogen, setNitrogen] = useState<number>(45);
  const [phosphorus, setPhosphorus] = useState<number>(30);
  const [potassium, setPotassium] = useState<number>(35);
  const [stage, setStage] = useState('Vegetative Growth');
  const [pestObserved, setPestObserved] = useState(false);
  const [pestSeverity, setPestSeverity] = useState('Low');
  const [irrigationStatus, setIrrigationStatus] = useState('Satisfactory');
  const [notes, setNotes] = useState('');
  const [dataSubmitting, setDataSubmitting] = useState(false);
  const [dataSuccess, setDataSuccess] = useState('');

  // Form: Cloudinary Image Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'leaf' | 'crop' | 'soil' | 'pest' | 'field'>('leaf');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Disease AI analysis result state
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [analyzingLeaf, setAnalyzingLeaf] = useState(false);

  const loadFarmerData = async () => {
    try {
      const activeUid = user?.uid || 'farmer_01';
      const list = await getFarmerAssignedFields(activeUid);
      setAssignedFields(list);
      if (list.length > 0) {
        const targetField = selectedField
          ? list.find((f) => f.fieldId === selectedField.fieldId || (f as any).id === (selectedField as any).id) || list[0]
          : list[0];
        setSelectedField(targetField);
        loadFieldHistory(targetField.fieldId || (targetField as any).id);
      }
    } catch {
      // Memory fallback
    }
  };

  const loadFieldHistory = async (fieldId: string) => {
    const imgs = await getFieldImages(fieldId);
    const subs = await getFieldData(fieldId);
    setFieldImages(imgs);
    setFieldSubmissions(subs);
  };

  useEffect(() => {
    loadFarmerData();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadFarmerData);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadFarmerData);
  }, [user]);

  // Handle Field Selection
  const handleSelectField = async (f: Field) => {
    const targetId = f.fieldId || (f as any).id;
    setSelectedField(f);
    loadFieldHistory(targetId);
  };

  // Submit Soil & Land Data Form
  const handleLandDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;

    setDataSubmitting(true);
    setDataSuccess('');

    const formattedNotes = [
      notes.trim(),
      pestObserved ? `Pest Observed (${pestSeverity} severity)` : 'No Pest Symptoms',
      `Irrigation: ${irrigationStatus}`,
    ].filter(Boolean).join(' | ');

    const targetFieldId = selectedField.fieldId || (selectedField as any).id;
    await submitFieldData({
      fieldId: targetFieldId,
      farmerId: user?.uid || 'farmer_01',
      farmerName: userProfile?.fullName || 'Field Worker',
      ownerId: selectedField.ownerId || 'owner_demo',
      soilMoisture: Number(moisture),
      soilPH: Number(ph),
      temperature: Number(temp),
      nitrogen: Number(nitrogen),
      phosphorus: Number(phosphorus),
      potassium: Number(potassium),
      cropGrowthStage: stage,
      notes: formattedNotes,
    });

    setDataSubmitting(false);
    setDataSuccess('Field observation land data submitted successfully!');
    setNotes('');
    loadFieldHistory(targetFieldId);
    notifyEcosystemChange();
    setTimeout(() => setDataSuccess(''), 4000);
  };

  // Handle Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload Field Image to Cloudinary and record in Firestore
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedField) return;

    setUploading(true);
    setUploadSuccess('');
    setUploadError('');

    const res = await uploadToCloudinary(selectedFile, 'agroai_field_images');
    setUploading(false);

    if (!res.success || !res.url) {
      setUploadError(res.error || 'Failed to upload image.');
      return;
    }

    const targetFieldId = selectedField.fieldId || (selectedField as any).id;
    await recordFieldImage({
      fieldId: targetFieldId,
      farmerId: user?.uid || 'farmer_01',
      farmerName: userProfile?.fullName || 'Field Worker',
      ownerId: selectedField.ownerId || 'owner_demo',
      imageUrl: res.url,
      publicId: res.publicId,
      imageType,
      caption: caption.trim() || 'Field observation upload',
    });

    setUploadSuccess('Field image uploaded & recorded successfully!');
    setSelectedFile(null);
    setImagePreview(null);
    setCaption('');

    // Refresh images list & trigger global state sync
    loadFieldHistory(targetFieldId);
    notifyEcosystemChange();
  };

  // Trigger Disease CNN inference
  const handleAnalyzeLeaf = async (_imageUrl: string) => {
    setAnalyzingLeaf(true);
    setAiAnalysisResult(null);
    try {
      const res = await apiService.runAlgorithmPlaceholder('cnn');
      setAiAnalysisResult(`CNN Inference Triggered: ${res.result?.name || 'Leaf Scanner'} • Execution: ${res.execution_time_ms}ms • Status: Demo / Model Not Trained`);
    } catch {
      setAiAnalysisResult('CNN Interface Triggered: Leaf scanner ready (Demo / Model Not Trained Mode)');
    } finally {
      setAnalyzingLeaf(false);
    }
  };

  return (
    <div className="px-margin-lg py-margin flex flex-col gap-space-xl max-w-[1600px] w-full mx-auto">
      {/* Mobile-Friendly Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-xs font-semibold uppercase tracking-wider">
              Farmer Worker Workspace
            </span>
            <span className="font-label-sm text-xs text-on-surface-variant">• Outdoor Mobile Mode</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            Welcome, {userProfile?.fullName || 'Field Worker'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Select assigned fields, inspect Mapbox boundaries/paths, submit soil telemetry, and upload field photos.
          </p>
        </div>

        <div className="flex items-center gap-space-xs bg-surface-container px-space-md py-space-sm rounded-xl self-start sm:self-center">
          <span className="material-symbols-outlined text-secondary text-[22px]">assignment_turned_in</span>
          <span className="font-headline-sm text-sm font-semibold text-on-surface">
            {assignedFields.length} Assigned Fields
          </span>
        </div>
      </div>

      {/* Assigned Fields Selector Pills */}
      <div className="flex items-center gap-space-sm overflow-x-auto pb-space-xs">
        {assignedFields.length === 0 ? (
          <div className="p-4 text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30 w-full text-center">
            No assigned fields found in database for this worker.
          </div>
        ) : (
          assignedFields.map((f) => {
          return (
            <button
              key={f.fieldId}
              type="button"
              onClick={() => handleSelectField(f)}
              className={`px-space-md py-space-sm rounded-xl font-headline-sm text-sm transition-all shrink-0 cursor-pointer flex items-center gap-2 shadow-xs ${
                selectedField?.fieldId === f.fieldId
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">nature</span>
              <span>{f.name}</span>
              <span className="text-xs opacity-80">({f.crop})</span>
            </button>
          );
        })
        )}
      </div>

      {selectedField && (
        <>
          {/* Mapbox Interactive GIS Map View for Selected Assigned Field */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">map</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {selectedField.name} Spatial Boundaries & Route Path
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedField.fieldId.startsWith('field_') && (
                  <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    Pre-existing Demo Field
                  </span>
                )}
                <span className="font-data-mono text-xs text-secondary bg-surface-container px-2.5 py-0.5 rounded font-semibold">
                  Owner Geometry Loaded
                </span>
              </div>
            </div>

            <AgroMap
              initialCenter={[selectedField.longitude, selectedField.latitude]}
              initialZoom={15}
              boundary={selectedField.boundary}
              path={selectedField.path}
              readOnly={true}
              fieldTitle={selectedField.name}
              height="380px"
            />
          </section>

          {/* Tab Selection Row: Data Entry vs Submissions History */}
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('entry')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'entry'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Submit Land Data & Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>My Submissions History ({fieldSubmissions.length})</span>
            </button>
          </div>

          {activeTab === 'entry' ? (
            /* Twin Workspace Columns: Submit Land Data & Upload Cloudinary Image */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
              {/* Column 1: Submit Soil & Crop Land Telemetry (7 Cols) */}
              <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">format_list_bulleted</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Submit Land & Soil Telemetry</h3>
                  </div>
                  <span className="text-xs text-on-surface-variant font-data-mono">Field ID: {selectedField.fieldId}</span>
                </div>

                {dataSuccess && (
                  <div className="p-space-sm bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{dataSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleLandDataSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface flex justify-between">
                      <span>Soil Moisture (%)</span>
                      <span className="font-data-mono text-secondary">{moisture}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={moisture}
                      onChange={(e) => setMoisture(parseFloat(e.target.value))}
                      className="w-full accent-[#2d6a4f] h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface flex justify-between">
                      <span>Soil pH</span>
                      <span className="font-data-mono text-secondary">{ph}</span>
                    </label>
                    <input
                      type="range"
                      min="3.0"
                      max="10.0"
                      step="0.1"
                      value={ph}
                      onChange={(e) => setPh(parseFloat(e.target.value))}
                      className="w-full accent-[#2d6a4f] h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Ambient Temp (°C)</label>
                    <input
                      type="number"
                      value={temp}
                      onChange={(e) => setTemp(parseFloat(e.target.value))}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Nitrogen (N) mg/kg</label>
                    <input
                      type="number"
                      value={nitrogen}
                      onChange={(e) => setNitrogen(parseFloat(e.target.value))}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Phosphorus (P) mg/kg</label>
                    <input
                      type="number"
                      value={phosphorus}
                      onChange={(e) => setPhosphorus(parseFloat(e.target.value))}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Potassium (K) mg/kg</label>
                    <input
                      type="number"
                      value={potassium}
                      onChange={(e) => setPotassium(parseFloat(e.target.value))}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Crop Growth Stage</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>Germination / Seedling</option>
                      <option>Vegetative Growth</option>
                      <option>Flowering / Tillering</option>
                      <option>Yield Formation</option>
                      <option>Ripening / Harvest Ready</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Irrigation Status</label>
                    <select
                      value={irrigationStatus}
                      onChange={(e) => setIrrigationStatus(e.target.value)}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>Satisfactory</option>
                      <option>Requires Irrigation Soon</option>
                      <option>Waterlogged / Excess Water</option>
                      <option>Irrigation In Progress</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 sm:col-span-2 bg-surface p-2.5 rounded-lg border border-outline-variant/30">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                      <input
                        type="checkbox"
                        checked={pestObserved}
                        onChange={(e) => setPestObserved(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span>Pests / Diseases Observed</span>
                    </label>

                    {pestObserved && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-on-surface">Severity:</span>
                        <select
                          value={pestSeverity}
                          onChange={(e) => setPestSeverity(e.target.value)}
                          className="bg-surface h-7 px-2 rounded text-xs border border-outline-variant/40"
                        >
                          <option>Low</option>
                          <option>Moderate</option>
                          <option>Severe</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-on-surface">Field Conditions & Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Enter observations on soil condition, canopy coverage, or issues..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-surface p-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={dataSubmitting}
                      className="h-10 px-space-lg rounded-xl bg-primary text-on-primary font-headline-sm text-sm hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>{dataSubmitting ? 'Submitting Data...' : 'Submit Field Observation'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Column 2: Upload Cloudinary Image (5 Cols) */}
              <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">photo_camera</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Upload Field Photo</h3>
                  </div>
                  <span className="text-[11px] text-secondary font-semibold">
                    {isCloudinaryConfigured() ? 'Cloudinary Active' : 'Base64 Fallback'}
                  </span>
                </div>

                {uploadSuccess && (
                  <div className="p-space-sm bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-space-sm bg-error-container text-on-error-container rounded-lg text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{uploadError}</span>
                  </div>
                )}

                <form onSubmit={handleImageUpload} className="flex flex-col gap-space-md">
                  {/* File picker button */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Select Image (Camera / File)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-container file:text-on-primary hover:file:bg-primary cursor-pointer"
                    />
                  </div>

                  {imagePreview && (
                    <div className="w-full h-40 rounded-xl overflow-hidden bg-surface border border-outline-variant/30 relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Image Classification</label>
                    <select
                      value={imageType}
                      onChange={(e) => setImageType(e.target.value as any)}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="leaf">Leaf Disease Inspection</option>
                      <option value="crop">Crop Stand & Canopy</option>
                      <option value="soil">Soil Surface & Moisture</option>
                      <option value="pest">Pest Observation</option>
                      <option value="field">General Field View</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Caption</label>
                    <input
                      type="text"
                      placeholder="E.g., Early leaf spots observed on lower leaves..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="h-10 px-space-md rounded-xl bg-secondary text-on-secondary font-headline-sm text-sm hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload Image'}</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Submissions History Feed View */
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Submission History for {selectedField.name}
                </h3>
                <span className="text-xs font-semibold text-secondary">{fieldSubmissions.length} Submissions</span>
              </div>

              {fieldSubmissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  No previous submissions found for this field. Submit your first observation from the entry tab!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  {fieldSubmissions.map((sub, idx) => (
                    <div key={sub.id || idx} className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-on-surface text-sm">{sub.farmerName || 'Farmer'}</span>
                        <span className="text-on-surface-variant font-data-mono">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-surface-container p-2.5 rounded-lg text-[11px]">
                        <div>Moisture: <strong className="text-primary">{sub.soilMoisture !== undefined && sub.soilMoisture !== null ? `${sub.soilMoisture}%` : 'N/A'}</strong></div>
                        <div>pH: <strong>{sub.soilPH !== undefined && sub.soilPH !== null ? sub.soilPH : 'N/A'}</strong></div>
                        <div>Temp: <strong>{sub.temperature !== undefined && sub.temperature !== null ? `${sub.temperature}°C` : 'N/A'}</strong></div>
                        <div>N: <strong>{sub.nitrogen !== undefined && sub.nitrogen !== null ? sub.nitrogen : 'N/A'}</strong></div>
                        <div>P: <strong>{sub.phosphorus !== undefined && sub.phosphorus !== null ? sub.phosphorus : 'N/A'}</strong></div>
                        <div>K: <strong>{sub.potassium !== undefined && sub.potassium !== null ? sub.potassium : 'N/A'}</strong></div>
                      </div>
                      <div>Crop Stage: <strong className="text-on-surface">{sub.cropGrowthStage}</strong></div>
                      {sub.notes && <p className="italic text-on-surface-variant bg-surface-container/40 p-2 rounded">{sub.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Uploaded Field Image Gallery & Disease AI Scanner */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">collections</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Field Image Submissions & AI Disease Scanner
                </h3>
              </div>
              <span className="text-xs text-on-surface-variant font-data-mono">{fieldImages.length} Images Saved</span>
            </div>

            {aiAnalysisResult && (
              <div className="p-space-md bg-secondary-container text-on-secondary-container rounded-xl text-xs font-data-mono flex items-center justify-between">
                <span>{aiAnalysisResult}</span>
                <button type="button" onClick={() => setAiAnalysisResult(null)} className="text-xs underline font-semibold">Dismiss</button>
              </div>
            )}

            {fieldImages.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-4 text-center">
                No images uploaded for this field yet. Upload a leaf or field photo above.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-md">
                {fieldImages.map((img) => (
                  <div
                    key={img.id || img.imageUrl}
                    className="bg-surface rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col shadow-xs"
                  >
                    <div className="h-36 w-full relative">
                      <img src={img.imageUrl} alt={img.caption} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white font-label-sm text-[10px] uppercase font-semibold">
                        {img.imageType}
                      </span>
                    </div>
                    <div className="p-space-xs px-space-sm flex flex-col gap-1">
                      <p className="font-body-sm text-xs text-on-surface line-clamp-2 font-medium">{img.caption}</p>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeLeaf(img.imageUrl)}
                        disabled={analyzingLeaf}
                        className="mt-1 h-7 text-xs font-semibold rounded bg-surface-container hover:bg-primary-container text-secondary transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">search_activity</span>
                        <span>{analyzingLeaf ? 'Scanning...' : 'Analyze Disease AI'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

