/**
 * AgroAI — Owner Enterprise Dashboard
 * Route: /owner-dashboard
 * Complete farm & field management, Mapbox GL JS geometry, farmer assignment, and monitoring feed.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { GeoPolygon, GeoLineString } from '../components/map/AgroMap';
import { AgroMap } from '../components/map/AgroMap';
import type { Farm, Field, FarmerProfile, FieldImageRecord, FieldLandData } from '../services/ecosystem';
import {
  getFarms,
  createFarm,
  createAssignmentRequest,
  deleteField,
  getOwnerFields,
  createField,
  updateField,
  getRegisteredFarmers,
  assignFarmerToField,
  getFieldImages,
  getFieldData,
  ECOSYSTEM_UPDATED_EVENT,
  notifyEcosystemChange,
} from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';

export const OwnerDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [images, setImages] = useState<FieldImageRecord[]>([]);

  // Selected Field for Detailed Monitoring Panel
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<Field | null>(null);
  const [selectedFieldSubmissions, setSelectedFieldSubmissions] = useState<FieldLandData[]>([]);
  const [selectedFieldPhotos, setSelectedFieldPhotos] = useState<FieldImageRecord[]>([]);

  // Modals
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddFieldWizard, setShowAddFieldWizard] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [selectedFieldForAssign, setSelectedFieldForAssign] = useState<Field | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [isDeletingField, setIsDeletingField] = useState(false);

  // New Farm State
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmArea, setFarmArea] = useState('420');
  const [farmDesc, setFarmDesc] = useState('');

  // New / Edit Field State
  const [fieldName, setFieldName] = useState('');
  const [fieldCrop, setFieldCrop] = useState('Rice');
  const [fieldSoil, setFieldSoil] = useState('Salinas Silty Loam');
  const [fieldArea, setFieldArea] = useState('12.5');
  const [fieldLat, setFieldLat] = useState<number>(36.677);
  const [fieldLng, setFieldLng] = useState<number>(-121.655);
  const [fieldBoundary, setFieldBoundary] = useState<GeoPolygon | null>(null);
  const [fieldPath, setFieldPath] = useState<GeoLineString | null>(null);

  // Assignment Modal & Execution State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string>('');
  const [assignSuccess, setAssignSuccess] = useState<string>('');

  const handleDeleteFieldConfirm = async () => {
    if (!fieldToDelete) return;
    setIsDeletingField(true);
    await deleteField(fieldToDelete.fieldId || (fieldToDelete as any).id);
    setIsDeletingField(false);
    setFieldToDelete(null);
    notifyEcosystemChange();
    loadEcosystemData();
  };

  const openAssignWorkerModal = (f: Field) => {
    const currentWorkerId = f.assignedFarmerId || (f as any).farmerId || '';
    setSelectedFarmerId(currentWorkerId);
    setSelectedFieldForAssign(f);
    setAssignError('');
    setAssignSuccess('');
    setIsAssigning(false);
  };

  const loadEcosystemData = async () => {
    try {
      // Fetch all farms & fields from DB (no ownerId filter — show all DB records)
      const farmList = await getFarms();
      const fieldList = await getOwnerFields();
      const farmerList = await getRegisteredFarmers();
      setFarms(farmList);
      setFields(fieldList);
      setFarmers(farmerList);

      // Select first field by default for detailed inspection if none selected
      if (fieldList.length > 0) {
        const targetField = selectedFieldForDetail
          ? fieldList.find((f) => f.fieldId === selectedFieldForDetail.fieldId || (f as any).id === (selectedFieldForDetail as any).id) || fieldList[0]
          : fieldList[0];
        setSelectedFieldForDetail(targetField);
        loadFieldTelemetry(targetField.fieldId || (targetField as any).id);
      }

      // Load all images for count card
      if (fieldList.length > 0) {
        let allImgs: FieldImageRecord[] = [];
        for (const f of fieldList) {
          const targetId = f.fieldId || (f as any).id;
          const imgs = await getFieldImages(targetId);
          allImgs = [...allImgs, ...imgs];
        }
        setImages(allImgs);
      }
    } catch {
      // Memory fallback
    }
  };

  const loadFieldTelemetry = async (fieldId: string) => {
    const subData = await getFieldData(fieldId);
    const photoData = await getFieldImages(fieldId);
    setSelectedFieldSubmissions(subData);
    setSelectedFieldPhotos(photoData);
  };

  useEffect(() => {
    loadEcosystemData();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadEcosystemData);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadEcosystemData);
  }, [user]);

  // Handle Add / Edit Farm Submit
  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    await createFarm({
      ownerId: user?.uid || 'owner_demo',
      name: farmName.trim(),
      location: farmLocation.trim() || 'Sector 4, Salinas Valley',
      areaHectares: parseFloat(farmArea) || 100,
      description: farmDesc.trim(),
    });
    setShowAddFarmModal(false);
    setFarmName('');
    setFarmLocation('');
    setFarmDesc('');
    notifyEcosystemChange();
    loadEcosystemData();
  };

  // Open Edit Wizard
  const openEditFieldWizard = (f: Field) => {
    setEditingField(f);
    setFieldName(f.name);
    setFieldCrop(f.crop);
    setFieldSoil(f.soilType);
    setFieldArea(f.areaAcres.toString());
    setFieldLat(f.latitude);
    setFieldLng(f.longitude);
    setFieldBoundary(f.boundary || null);
    setFieldPath(f.path || null);
    setShowAddFieldWizard(true);
  };

  // Handle Add or Update Field Submit
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    if (editingField) {
      const targetId = editingField.fieldId || (editingField as any).id;
      await updateField(targetId, {
        name: fieldName.trim(),
        crop: fieldCrop,
        soilType: fieldSoil,
        areaAcres: parseFloat(fieldArea) || 10,
        boundary: fieldBoundary,
        path: fieldPath,
      });
    } else {
      await createField({
        farmId: farms[0]?.farmId || (farms[0] as any)?.id || 'farm_salinas_01',
        ownerId: user?.uid || 'owner_demo',
        name: fieldName.trim(),
        crop: fieldCrop,
        soilType: fieldSoil,
        areaAcres: parseFloat(fieldArea) || 10,
        latitude: fieldLat,
        longitude: fieldLng,
        boundary: fieldBoundary,
        path: fieldPath,
        status: 'Healthy',
      });
    }

    setShowAddFieldWizard(false);
    setEditingField(null);
    setFieldName('');
    setFieldBoundary(null);
    setFieldPath(null);
    notifyEcosystemChange();
    loadEcosystemData();
  };

  // Handle Assign / Unassign Farmer
  const handleAssignFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldForAssign) {
      setAssignError('No field selected for assignment.');
      return;
    }

    const targetId = (selectedFieldForAssign as any).docId || selectedFieldForAssign.fieldId || (selectedFieldForAssign as any).id;
    if (!targetId) {
      setAssignError('Unable to identify selected field ID.');
      return;
    }

    // Validation: check if a worker selection was made
    if (!selectedFarmerId && selectedFarmerId !== '__unassign__') {
      setAssignError('Please select a worker');
      return;
    }

    setIsAssigning(true);
    setAssignError('');
    setAssignSuccess('');

    try {
      const isUnassigning = selectedFarmerId === '__unassign__';
      const workerId = isUnassigning ? null : selectedFarmerId;
      const farmer = isUnassigning ? null : farmers.find((f) => f.uid === selectedFarmerId);
      const workerName = farmer ? farmer.fullName : null;

      if (isUnassigning) {
        const success = await assignFarmerToField(targetId, null, null, user?.uid || 'owner_demo');
        if (success) {
          setAssignSuccess(`Unassigned worker from field ${selectedFieldForAssign.name}.`);
          notifyEcosystemChange();
          await loadEcosystemData();
          setTimeout(() => {
            setIsAssigning(false);
            setAssignSuccess('');
            setSelectedFieldForAssign(null);
          }, 1000);
        }
        return;
      }

      // Owner sends an assignment request (Status = Pending until farmer approves/rejects)
      const farmObj = farms.find((fm) => fm.farmId === selectedFieldForAssign.farmId) || farms[0];
      const res = await createAssignmentRequest({
        ownerId: user?.uid || 'owner_demo',
        ownerName: userProfile?.fullName || 'Farm Owner',
        farmerId: workerId!,
        farmerName: workerName || 'Farmer',
        farmId: selectedFieldForAssign.farmId || (farmObj?.farmId || 'farm_salinas_01'),
        farmName: farmObj?.name || 'Green Valley Farm',
        fieldId: targetId,
        fieldName: selectedFieldForAssign.name,
      });

      if (res.success) {
        setAssignSuccess(`Assignment request sent to ${workerName}! Status is Pending until the farmer approves.`);
        notifyEcosystemChange();
        await loadEcosystemData();
        setTimeout(() => {
          setIsAssigning(false);
          setAssignSuccess('');
          setSelectedFieldForAssign(null);
        }, 1500);
      } else {
        setIsAssigning(false);
        setAssignError(res.error || 'Failed to send assignment request. Please try again.');
      }
    } catch (err: any) {
      setIsAssigning(false);
      console.error('Assign worker exception:', err);
      setAssignError(err?.message || 'Failed to assign worker');
    }
  };

  const handleUnassignDirect = async (f: Field) => {
    const targetId = (f as any).docId || f.fieldId || (f as any).id;
    await assignFarmerToField(targetId, null, null, user?.uid || 'owner_demo');
    notifyEcosystemChange();
    await loadEcosystemData();
  };

  return (
    <div className="px-margin-lg py-margin flex flex-col gap-space-xl max-w-[1600px] w-full mx-auto">
      {/* Top Header & Overview Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-xs font-semibold uppercase tracking-wider">
              Owner Workspace
            </span>
            <span className="font-label-sm text-xs text-on-surface-variant">• Enterprise Role Active</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            Welcome back, {userProfile?.fullName || 'Farm Owner'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Manage your farms, draw Mapbox spatial field boundaries, assign field workers, and monitor telemetry.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap self-start md:self-center">
          <button
            type="button"
            onClick={() => setShowAddFarmModal(true)}
            className="h-10 px-space-md rounded-xl bg-surface-container-highest text-on-surface font-headline-sm text-body-sm hover:bg-surface-container-high transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            <span>+ Add Farm</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingField(null);
              setFieldName('');
              setFieldBoundary(null);
              setFieldPath(null);
              setShowAddFieldWizard(true);
            }}
            className="h-10 px-space-lg rounded-xl bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
            <span>+ Add New Field</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-md">
            <span className="material-symbols-outlined text-[26px]">agriculture</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Managed Farms
            </span>
            <span className="font-display-md text-display-md text-on-surface font-bold">
              {farms.length}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-md">
            <span className="material-symbols-outlined text-[26px]">square_foot</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Active Fields
            </span>
            <span className="font-display-md text-display-md text-on-surface font-bold">
              {fields.length}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-headline-md">
            <span className="material-symbols-outlined text-[26px]">group</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Registered Farmers
            </span>
            <span className="font-display-md text-display-md text-on-surface font-bold">
              {farmers.length}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-surface-container text-secondary flex items-center justify-center font-headline-md">
            <span className="material-symbols-outlined text-[26px]">photo_library</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Field Images Uploaded
            </span>
            <span className="font-display-md text-display-md text-on-surface font-bold">
              {images.length}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Mapbox GIS View */}
      <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[22px]">map</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Interactive Farm GIS Boundary Map: {selectedFieldForDetail?.name || 'All Fields Overview'}
            </h2>
          </div>
          <span className="font-data-mono text-xs text-secondary bg-surface-container px-2.5 py-1 rounded-md">
            Mapbox GL JS Enabled
          </span>
        </div>

        <AgroMap
          initialCenter={
            selectedFieldForDetail
              ? [selectedFieldForDetail.longitude, selectedFieldForDetail.latitude]
              : [-121.655, 36.677]
          }
          initialZoom={14}
          boundary={selectedFieldForDetail?.boundary}
          path={selectedFieldForDetail?.path}
          fieldTitle={selectedFieldForDetail?.name || 'Salinas Valley Farm Sector'}
          height="450px"
        />
      </section>

      {/* Main Grid: Fields & Detailed Monitoring Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* Fields List (Left 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-on-surface">Field Parcels & Worker Assignments</h3>
              <span className="text-xs font-semibold text-secondary">{fields.length} Fields Total</span>
            </div>

            <div className="flex flex-col space-y-3">
              {fields.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-body-sm">
                  No field parcels found in database. Click "+ Add Field Parcel" above to create your first field.
                </div>
              ) : (
                fields.map((f) => {
                const fieldDec = evaluateFieldDecision(f);
                const isSelected = selectedFieldForDetail?.fieldId === f.fieldId;
                const isCrit = fieldDec.status === 'Critical';
                const isAtt = fieldDec.status === 'Attention';
                return (
                  <div
                    key={f.fieldId || f.id || (f as any).docId || f.name}
                    onClick={() => {
                      setSelectedFieldForDetail(f);
                      loadFieldTelemetry(f.fieldId);
                    }}
                    className={`bg-surface p-space-md rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-space-md shadow-xs ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary-container/10'
                        : 'border-outline-variant/30 hover:border-outline-variant'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{f.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            isCrit
                              ? 'bg-error-container text-on-error-container'
                              : isAtt
                              ? 'bg-amber-100 text-amber-900'
                              : fieldDec.status === 'Insufficient Data'
                              ? 'bg-surface-container text-on-surface-variant'
                              : 'bg-primary-container text-on-primary'
                          }`}
                        >
                          {fieldDec.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant font-body-sm">
                        <span>Crop: <strong className="text-on-surface">{f.crop}</strong></span>
                        <span>Area: <strong className="text-on-surface">{f.areaAcres} Acres</strong></span>
                        <span>Soil: <strong className="text-on-surface">{f.soilType}</strong></span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-secondary font-semibold">
                        <span className="material-symbols-outlined text-[16px]">account_box</span>
                        <span>
                          Assigned Farmer: {f.assignedFarmerName || (f as any).farmerName || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditFieldWizard(f);
                        }}
                        className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                        title="Edit Field Boundaries & Details"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFieldToDelete(f);
                        }}
                        className="h-8 px-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove Field Parcel"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>

                      {f.assignedFarmerId || (f as any).farmerId ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignWorkerModal(f);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-surface-container-highest text-on-surface text-xs font-semibold hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                            <span>Reassign</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassignDirect(f);
                            }}
                            className="h-8 px-2 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Unassign Worker"
                          >
                            <span className="material-symbols-outlined text-[15px]">person_remove</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAssignWorkerModal(f);
                          }}
                          className="h-8 px-3 rounded-lg bg-primary text-on-primary font-headline-sm text-xs hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_add</span>
                          <span>Assign Worker</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Registered Farmers Directory */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-on-surface">Registered Farmers Directory</h3>
              <span className="text-xs text-on-surface-variant">{farmers.length} Registered</span>
            </div>

            <div className="flex flex-col space-y-2.5">
              {farmers.map((farmer) => {
                const assignedFieldObj = fields.find((f) => f.assignedFarmerId === farmer.uid || (f as any).farmerId === farmer.uid);
                const isAssigned = Boolean(assignedFieldObj);
                return (
                  <div
                    key={farmer.uid}
                    className="bg-surface p-space-sm px-space-md rounded-lg border border-outline-variant/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-space-sm min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {farmer.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline-sm text-xs font-semibold text-on-surface truncate">{farmer.fullName}</span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant truncate">{farmer.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isAssigned
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isAssigned ? `Assigned to ${assignedFieldObj?.name}` : 'Available'}
                      </span>

                      <button
                        type="button"
                        onClick={() => navigate(`/messages?user=${farmer.uid}`)}
                        className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer"
                        title="1-to-1 Chat with Farmer"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Telemetry & Submissions Panel (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {selectedFieldForDetail ? (
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-sm text-xs text-secondary font-semibold uppercase tracking-wider">
                    Live Telemetry Drawer
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {selectedFieldForDetail.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openEditFieldWizard(selectedFieldForDetail)}
                  className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Edit Parcel</span>
                </button>
              </div>

              {/* Quick Field Summary */}
              <div className="grid grid-cols-2 gap-2 bg-surface p-3 rounded-lg border border-outline-variant/20 text-xs">
                <div>Crop: <strong className="text-on-surface">{selectedFieldForDetail.crop}</strong></div>
                <div>Area: <strong className="text-on-surface">{selectedFieldForDetail.areaAcres} Acres</strong></div>
                <div>Soil: <strong className="text-on-surface">{selectedFieldForDetail.soilType}</strong></div>
                <div>Worker: <strong className="text-on-surface">{selectedFieldForDetail.assignedFarmerName || (selectedFieldForDetail as any).farmerName || 'None'}</strong></div>
              </div>

              {/* Latest Submissions Feed */}
              <div className="flex flex-col gap-2">
                <h4 className="font-headline-sm text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <span>Farmer Land Submissions</span>
                  <span className="text-secondary font-data-mono">{selectedFieldSubmissions.length} Records</span>
                </h4>

                {selectedFieldSubmissions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant bg-surface rounded-lg">
                    No field land data submitted yet for this field.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {selectedFieldSubmissions.map((sub, idx) => (
                      <div key={sub.id || idx} className="bg-surface p-3 rounded-lg border border-outline-variant/20 flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between text-on-surface-variant">
                          <span className="font-semibold text-on-surface">{sub.farmerName || 'Farmer'}</span>
                          <span className="font-data-mono text-[11px]">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-2 rounded text-[11px]">
                          <div>Moisture: <strong className="text-primary">{sub.soilMoisture !== undefined && sub.soilMoisture !== null ? `${sub.soilMoisture}%` : 'N/A'}</strong></div>
                          <div>pH: <strong>{sub.soilPH !== undefined && sub.soilPH !== null ? sub.soilPH : 'N/A'}</strong></div>
                          <div>Temp: <strong>{sub.temperature !== undefined && sub.temperature !== null ? `${sub.temperature}°C` : 'N/A'}</strong></div>
                          <div>N: <strong>{sub.nitrogen !== undefined && sub.nitrogen !== null ? sub.nitrogen : 'N/A'}</strong></div>
                          <div>P: <strong>{sub.phosphorus !== undefined && sub.phosphorus !== null ? sub.phosphorus : 'N/A'}</strong></div>
                          <div>K: <strong>{sub.potassium !== undefined && sub.potassium !== null ? sub.potassium : 'N/A'}</strong></div>
                        </div>
                        <div className="text-on-surface-variant text-[11px]">
                          Stage: <strong className="text-on-surface">{sub.cropGrowthStage}</strong>
                        </div>
                        {sub.notes && (
                          <p className="italic text-on-surface-variant text-[11px] bg-surface-container/30 p-1.5 rounded">
                            "{sub.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Gallery Feed */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                <h4 className="font-headline-sm text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <span>Field Inspection Photos</span>
                  <span className="text-secondary font-data-mono">{selectedFieldPhotos.length} Photos</span>
                </h4>

                {selectedFieldPhotos.length === 0 ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant bg-surface rounded-lg">
                    No photo observations uploaded for this field.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
                    {selectedFieldPhotos.map((img, idx) => (
                      <div key={img.id || idx} className="group relative rounded-lg overflow-hidden border border-outline-variant/30 bg-black/5">
                        <img
                          src={img.imageUrl}
                          alt={img.caption || 'Field observation'}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="p-1.5 bg-surface text-[10px] text-on-surface font-medium truncate">
                          {img.caption || img.imageType}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 text-center text-xs text-on-surface-variant">
              Select a field from the left panel to inspect detailed telemetry and farmer submissions.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Farm Modal */}
      {showAddFarmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest w-full max-w-md p-space-lg rounded-xl shadow-xl flex flex-col gap-space-md border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md text-on-surface">Create New Farm</h3>
              <button
                type="button"
                onClick={() => setShowAddFarmModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddFarm} className="flex flex-col gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Farm Name</label>
                <input
                  type="text"
                  required
                  placeholder="Green Valley Farm"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Farm Location</label>
                <input
                  type="text"
                  placeholder="Salinas Valley, CA"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Total Managed Hectares</label>
                <input
                  type="number"
                  value={farmArea}
                  onChange={(e) => setFarmArea(e.target.value)}
                  className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowAddFarmModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
                >
                  Save Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Field Wizard Modal */}
      {showAddFieldWizard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest w-full max-w-3xl p-space-lg rounded-xl shadow-xl flex flex-col gap-space-md border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary">add_location_alt</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {editingField ? `Edit Field: ${editingField.name}` : 'Add Field & Draw Mapbox Geometry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddFieldWizard(false);
                  setEditingField(null);
                }}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveField} className="flex flex-col gap-space-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">Field Name</label>
                  <input
                    type="text"
                    required
                    placeholder="North Rice Field"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">Crop Type</label>
                  <select
                    value={fieldCrop}
                    onChange={(e) => setFieldCrop(e.target.value)}
                    className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>Rice</option>
                    <option>Maize</option>
                    <option>Wheat</option>
                    <option>Potato</option>
                    <option>Tomato</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">Soil Classification</label>
                  <input
                    type="text"
                    value={fieldSoil}
                    onChange={(e) => setFieldSoil(e.target.value)}
                    className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">Area (Acres)</label>
                  <input
                    type="number"
                    value={fieldArea}
                    onChange={(e) => setFieldArea(e.target.value)}
                    className="w-full bg-surface h-9 px-3 rounded-lg text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Mapbox Boundary & Path Drawing Map */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Draw Field Boundary (Polygon) & Route (Path)</span>
                  <span className="text-[11px] text-secondary font-data-mono">Mapbox GL Draw Active</span>
                </label>
                <AgroMap
                  initialCenter={[fieldLng, fieldLat]}
                  initialZoom={14}
                  boundary={fieldBoundary}
                  path={fieldPath}
                  readOnly={false}
                  onGeometrySave={(b, p) => {
                    setFieldBoundary(b);
                    setFieldPath(p);
                  }}
                  fieldTitle="Draw Polygon Boundary / Path"
                  height="320px"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFieldWizard(false);
                    setEditingField(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
                >
                  {editingField ? 'Save Changes' : 'Save Field & Geometry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      {selectedFieldForAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest w-full max-w-lg p-space-lg rounded-xl shadow-2xl flex flex-col gap-space-md border border-outline-variant/30 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">Field Parcel Assignment</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Assign Worker: {selectedFieldForAssign.name}
                </h3>
              </div>
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => setSelectedFieldForAssign(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {assignError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{assignError}</span>
              </div>
            )}

            {/* Success Banner */}
            {assignSuccess && (
              <div className="p-3 bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{assignSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAssignFarmer} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Select Worker</span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Choose a registered field worker</span>
                </label>

                {farmers.length === 0 ? (
                  <div className="p-4 bg-surface rounded-lg border border-outline-variant/30 text-center text-xs text-on-surface-variant">
                    No registered farmers/workers found in database.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {farmers.map((farmer) => {
                      const isSelected = selectedFarmerId === farmer.uid;
                      const assignedCount = fields.filter((f) => f.assignedFarmerId === farmer.uid || (f as any).farmerId === farmer.uid).length;
                      return (
                        <div
                          key={farmer.uid}
                          onClick={() => {
                            if (!isAssigning) setSelectedFarmerId(farmer.uid);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/20 bg-primary-container/15'
                              : 'border-outline-variant/30 bg-surface hover:border-outline-variant'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="workerSelection"
                              checked={isSelected}
                              onChange={() => setSelectedFarmerId(farmer.uid)}
                              disabled={isAssigning}
                              className="accent-primary w-4 h-4 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center">
                              {farmer.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-on-surface">{farmer.fullName}</span>
                              <span className="text-[11px] text-on-surface-variant">{farmer.email}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-container text-secondary">
                            {assignedCount} Field{assignedCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}

                    {/* Unassign Option */}
                    <div
                      onClick={() => {
                        if (!isAssigning) setSelectedFarmerId('__unassign__');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedFarmerId === '__unassign__'
                          ? 'border-red-400 ring-2 ring-red-400/20 bg-red-50'
                          : 'border-outline-variant/20 bg-surface hover:border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="workerSelection"
                          checked={selectedFarmerId === '__unassign__'}
                          onChange={() => setSelectedFarmerId('__unassign__')}
                          disabled={isAssigning}
                          className="accent-red-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-red-700">-- Unassign Current Worker --</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant/20">
                <button
                  type="button"
                  disabled={isAssigning}
                  onClick={() => setSelectedFieldForAssign(null)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isAssigning ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Assign Worker</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Field Confirmation Modal (Section 7) */}
      {fieldToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest w-full max-w-md p-space-lg rounded-xl shadow-xl flex flex-col gap-space-md border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-red-700">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Confirm Field Removal</h3>
              </div>
              <button type="button" onClick={() => setFieldToDelete(null)} className="text-on-surface-variant hover:text-on-surface">
                ✕
              </button>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to remove <strong>{fieldToDelete.name}</strong>?
            </p>
            <p className="text-xs text-on-surface-variant bg-surface p-3 rounded-lg border border-outline-variant/20">
              This field will be deleted from your farm database. Any active worker assignment will be cleared.
            </p>

            <div className="flex items-center justify-end gap-space-sm pt-2">
              <button
                type="button"
                onClick={() => setFieldToDelete(null)}
                className="h-9 px-4 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingField}
                onClick={handleDeleteFieldConfirm}
                className="h-9 px-4 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isDeletingField ? 'Removing...' : 'Remove Field'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


