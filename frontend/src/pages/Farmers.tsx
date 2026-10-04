/**
 * AgroAI — Farmers & Agricultural Workforce Management
 * Route: /farmers
 * Browse all registered farmers, view profiles, filter availability,
 * send work proposals to assign farmers to owner fields, and manage active working contracts.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type {
  FarmerProfile,
  Field,
  Farm,
  AssignmentRequest,
  FarmerRating,
  FieldWorkerAssignment,
} from '../services/ecosystem';
import {
  getRegisteredFarmers,
  getOwnerFields,
  getFarms,
  createAssignmentRequest,
  getOwnerAssignmentRequests,
  getFarmerAssignmentRequests,
  approveAssignmentRequest,
  rejectAssignmentRequest,
  cancelAssignmentRequest,
  getFarmerRatings,
  submitFarmerRating,
  getHiredFarmerIdsForOwner,
  getFieldAssignedWorkers,
  addWorkerToField,
  removeWorkerFromField,
  freeFarmerFromOwner,
  getFarmerEmploymentMap,
  applyForFieldWork,
  getFarmerApplications,
  getOwnerIncomingApplications,
  getOwnerAccountForField,
  notifyEcosystemChange,
  ECOSYSTEM_UPDATED_EVENT,
} from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';

export const Farmers: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, formatNumber, formatDate } = useI18n();

  const isFarmer = userRole === 'farmer';
  const isOwner = userRole === 'owner' || (!isFarmer && (user?.uid || 'owner_demo') === 'owner_demo');
  const activeUid = user?.uid || (isFarmer ? 'farmer_01' : 'owner_demo');

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'assignments' | 'directory'>(
    tabFromUrl === 'directory' ? 'directory' : 'assignments'
  );

  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<AssignmentRequest[]>([]);
  const [myApplications, setMyApplications] = useState<AssignmentRequest[]>([]);
  const [incomingSpecialistApplications, setIncomingSpecialistApplications] = useState<AssignmentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Apply to Field Modal State (for Farmers)
  const [applyModalField, setApplyModalField] = useState<Field | null>(null);
  const [applyWorkType, setApplyWorkType] = useState<string>('Precision Irrigation & Water Dispatch');
  const [applyProposedRate, setApplyProposedRate] = useState<string>('$120 / day');
  const [applyCoverNote, setApplyCoverNote] = useState<string>('');
  const [submittingApplication, setSubmittingApplication] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string>('');

  // Field Parcels Search & Filters (for Field Parcels & Worker Assignments tab)
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [fieldStatusFilter, setFieldStatusFilter] = useState<'all' | 'assigned' | 'unassigned' | 'attention'>('all');

  // Assign to Field Modal state
  const [assigningField, setAssigningField] = useState<Field | null>(null);
  const [selectedWorkerForField, setSelectedWorkerForField] = useState<string>('');

  // Farmers Directory Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'working_for_you' | 'busy' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'name'>('rating');

  // Hire Proposal Modal State
  const [hireModalFarmer, setHireModalFarmer] = useState<FarmerProfile | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [workType, setWorkType] = useState<string>('Precision Irrigation & Water Dispatch');
  const [dailyRate, setDailyRate] = useState<string>('$120 / day');
  const [instructions, setInstructions] = useState<string>('');
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string>('');

  // Farmer Detail / Reviews Modal State
  const [detailFarmer, setDetailFarmer] = useState<FarmerProfile | null>(null);
  const [detailReviews, setDetailReviews] = useState<FarmerRating[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [detailModalTab, setDetailModalTab] = useState<'profile' | 'opportunities'>('profile');

  // Hired Farmers Tracking & Rate Modal State
  const [hiredFarmerIds, setHiredFarmerIds] = useState<Set<string>>(new Set());
  // farmerId → ownerId for farmers who are CURRENTLY employed (one worker = one owner)
  const [employmentMap, setEmploymentMap] = useState<Record<string, string>>({});
  const activeOwnerId = user?.uid || 'owner_demo';
  const [rateModalFarmer, setRateModalFarmer] = useState<{
    farmer: FarmerProfile;
    fieldId?: string;
    fieldName?: string;
  } | null>(null);
  const [rateScore, setRateScore] = useState<number>(5);
  const [rateHover, setRateHover] = useState<number>(0);
  const [rateComment, setRateComment] = useState<string>('');
  const [rateSelectedFieldId, setRateSelectedFieldId] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string>('');

  // Quick Action Loading Tracker
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      const activeUid = user?.uid || (userRole === 'farmer' ? 'farmer_01' : 'owner_demo');

      // 1. Load Farmers
      const farmerList = await getRegisteredFarmers();
      setFarmers(farmerList);

      // 2. Load Owner's Fields and Farms
      const ownerFieldList = await getOwnerFields(userRole === 'owner' ? activeUid : undefined);
      setFields(ownerFieldList);

      const farmList = await getFarms(userRole === 'owner' ? activeUid : undefined);
      setFarms(farmList);

      // 3. Load Sent Requests (if owner) and Incoming Requests (if farmer)
      if (userRole === 'owner' || activeUid === 'owner_demo') {
        const sent = await getOwnerAssignmentRequests(activeUid);
        setAssignmentRequests(sent);
        const incomingApps = await getOwnerIncomingApplications(activeUid);
        setIncomingSpecialistApplications(incomingApps);
      }

      // If user is a farmer, also load incoming requests and submitted applications
      if (userRole === 'farmer') {
        const incoming = await getFarmerAssignmentRequests(activeUid);
        setIncomingRequests(incoming.filter((r) => r.status === 'pending' && r.initiatedBy !== 'farmer'));
        const myApps = await getFarmerApplications(activeUid);
        setMyApplications(myApps);
      }

      // 4. Load Hired Farmer IDs for current owner (historic — used for rating eligibility)
      const hiredIds = await getHiredFarmerIdsForOwner(activeUid, false);
      setHiredFarmerIds(new Set(hiredIds));

      // 5. Current employment map (who is working for whom right now)
      const empMap = await getFarmerEmploymentMap();
      setEmploymentMap(empMap);
    } catch (err) {
      console.error('Farmers.tsx loadData error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadData);
    return () => {
      window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadData);
    };
  }, [user, userRole]);

  useEffect(() => {
    const applyFieldParam = searchParams.get('applyField');
    if (applyFieldParam && fields.length > 0) {
      const found = fields.find((f) => f.fieldId === applyFieldParam || (f as any).id === applyFieldParam);
      if (found) {
        openApplyModal(found);
      }
    }
  }, [searchParams, fields]);

  // Fields of THIS owner where the farmer is currently one of the assigned workers
  const getMyFieldsForFarmer = (farmerId: string): Field[] =>
    fields.filter((f) => getFieldAssignedWorkers(f).some((w) => w.farmerId === farmerId));

  // Compute status for a farmer relative to current owner
  // Rule: one worker works for only ONE owner at a time (but may cover many of that owner's fields).
  const getFarmerStatus = (farmer: FarmerProfile): {
    status: 'working_for_you' | 'request_pending' | 'busy' | 'available';
    assignedField?: Field;
    assignedFields?: Field[];
    pendingRequest?: AssignmentRequest;
  } => {
    // 1. Working on one or more of THIS owner's fields
    const myFields = getMyFieldsForFarmer(farmer.uid);
    if (myFields.length > 0) {
      return { status: 'working_for_you', assignedField: myFields[0], assignedFields: myFields };
    }

    // 2. Employed (not yet freed) by this owner or by another owner
    const employerId = employmentMap[farmer.uid];
    if (employerId) {
      if (employerId === activeOwnerId) {
        return { status: 'working_for_you', assignedFields: [] };
      }
      return { status: 'busy' };
    }

    // 3. Pending proposal from this owner
    const pendingReq = assignmentRequests.find(
      (r) => r.farmerId === farmer.uid && r.status === 'pending'
    );
    if (pendingReq) {
      return { status: 'request_pending', pendingRequest: pendingReq };
    }

    // 4. Free — ready to be hired by any owner
    return { status: 'available' };
  };

  // Filtered and Sorted Farmers List
  const filteredFarmers = useMemo(() => {
    return farmers
      .filter((farmer) => {
        const { status } = getFarmerStatus(farmer);

        // Status tab filter
        if (statusFilter === 'available' && status !== 'available') return false;
        if (statusFilter === 'working_for_you' && status !== 'working_for_you') return false;
        if (statusFilter === 'busy' && status !== 'busy') return false;
        if (statusFilter === 'pending' && status !== 'request_pending') return false;

        // Search text filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = farmer.fullName.toLowerCase().includes(q);
          const matchLoc = (farmer.location || '').toLowerCase().includes(q);
          const matchBio = (farmer.bio || '').toLowerCase().includes(q);
          const matchSpec = (farmer.specialization || []).some((s) => s.toLowerCase().includes(q));
          return matchName || matchLoc || matchBio || matchSpec;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        if (sortBy === 'experience') {
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        }
        return a.fullName.localeCompare(b.fullName);
      });
  }, [farmers, fields, assignmentRequests, searchQuery, statusFilter, sortBy, employmentMap]);

  // Metrics summary
  const metrics = useMemo(() => {
    let working = 0;
    let available = 0;
    let pending = 0;

    farmers.forEach((farmer) => {
      const { status } = getFarmerStatus(farmer);
      if (status === 'working_for_you') working++;
      else if (status === 'available') available++;
      else if (status === 'request_pending') pending++;
    });

    return {
      total: farmers.length,
      working,
      available,
      pending,
    };
  }, [farmers, fields, assignmentRequests, employmentMap]);

  // Open Hire Modal (Owners only — farmers apply to fields instead)
  const openHireModal = (farmer: FarmerProfile) => {
    if (userRole === 'farmer') {
      showToast(t('farmers.cannotHireColleague', 'Farmers cannot hire other farmers. You can apply for work on owner fields.'), 'info');
      return;
    }
    setHireModalFarmer(farmer);
    setDailyRate(farmer.hourlyRate || '$120 / day');
    setWorkType(t('farmers.workTypeOptions.irrigation', 'Precision Irrigation & Water Dispatch'));
    setInstructions('');
    setRequestError('');

    // Pre-select first unassigned field
    const unassignedField = fields.find((f) => !f.assignedFarmerId && !(f as any).farmerId);
    if (unassignedField) {
      setSelectedFieldId(unassignedField.fieldId || (unassignedField as any).id);
    } else if (fields.length > 0) {
      setSelectedFieldId(fields[0].fieldId || (fields[0] as any).id);
    } else {
      setSelectedFieldId('');
    }
  };

  // Open Apply Modal (Farmers applying for work on an owner's field parcel)
  const openApplyModal = (field: Field) => {
    setApplyModalField(field);
    setApplyWorkType(t('farmers.workTypeOptions.irrigation', 'Precision Irrigation & Water Dispatch'));
    const activeUid = user?.uid || 'farmer_01';
    const myProfile = farmers.find((f) => f.uid === activeUid);
    setApplyProposedRate(myProfile?.hourlyRate || '$120 / day');
    setApplyCoverNote('');
    setApplyError('');
  };

  // Farmer Submits Work Application for an Owner's Field
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalField) return;
    setSubmittingApplication(true);
    setApplyError('');

    try {
      const activeUid = user?.uid || 'farmer_01';
      const myProfile = farmers.find((f) => f.uid === activeUid);
      const farmerName = myProfile?.fullName || user?.displayName || 'Registered Specialist';

      const ownerInfo = getOwnerAccountForField(applyModalField, farms);
      const targetFarmName = ownerInfo.farmName;
      const targetOwnerId = ownerInfo.ownerId;
      const targetOwnerName = ownerInfo.name;

      const res = await applyForFieldWork({
        farmerId: activeUid,
        farmerName,
        ownerId: targetOwnerId,
        ownerName: targetOwnerName,
        farmId: applyModalField.farmId || 'farm_salinas_01',
        farmName: targetFarmName,
        fieldId: applyModalField.fieldId || (applyModalField as any).id,
        fieldName: applyModalField.name,
        workType: applyWorkType,
        proposedRate: applyProposedRate,
        message: applyCoverNote,
      });

      if (!res.success) {
        setApplyError(res.error || 'Failed to submit work application.');
        return;
      }

      showToast(
        t('farmers.applicationSuccess', { fieldName: applyModalField.name, ownerName: targetOwnerName }),
        'success'
      );
      setApplyModalField(null);
      notifyEcosystemChange();
      await loadData();
    } catch (err: any) {
      setApplyError(err?.message || 'Error submitting application.');
    } finally {
      setSubmittingApplication(false);
    }
  };

  // Owner Accepts Specialist's Work Application
  const handleOwnerAcceptApplication = async (req: AssignmentRequest) => {
    setActionLoadingId(req.id);
    try {
      const res = await approveAssignmentRequest(req.id);
      if (res.success) {
        showToast(
          t('farmers.applicationAccepted', { farmerName: req.farmerName, fieldName: req.fieldName }),
          'success'
        );
        notifyEcosystemChange();
        await loadData();
      } else {
        showToast(res.error || 'Failed to approve application', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving application', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Owner Declines Specialist's Work Application
  const handleOwnerDeclineApplication = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await rejectAssignmentRequest(requestId);
      if (res.success) {
        showToast(t('farmers.rejectSuccess', 'Assignment request declined.'), 'info');
        notifyEcosystemChange();
        await loadData();
      } else {
        showToast(res.error || 'Failed to decline application', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error declining application', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Farmer Withdraws Their Submitted Application
  const handleFarmerWithdrawApplication = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await cancelAssignmentRequest(requestId);
      if (res.success) {
        showToast('Application withdrawn successfully', 'info');
        notifyEcosystemChange();
        await loadData();
      } else {
        showToast(res.error || 'Failed to withdraw application', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error withdrawing application', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Work Proposal
  const handleSubmitHireProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireModalFarmer) return;

    if (!selectedFieldId) {
      setRequestError(t('farmers.selectFieldPlaceholder', 'Please select an available field.'));
      return;
    }

    const targetField = fields.find(
      (f) => f.fieldId === selectedFieldId || (f as any).id === selectedFieldId
    );
    if (!targetField) {
      setRequestError(t('farmers.selectFieldPlaceholder', 'Selected field could not be found.'));
      return;
    }

    setSubmittingRequest(true);
    setRequestError('');

    try {
      const activeOwnerId = user?.uid || 'owner_demo';
      const activeOwnerName = user?.displayName || 'Green Valley Agriculture';
      const farmName = farms.length > 0 ? farms[0].name : 'Primary Salinas Agricultural Estate';
      const farmId = targetField.farmId || (farms.length > 0 ? farms[0].farmId : 'farm_salinas_01');

      const result = await createAssignmentRequest({
        ownerId: activeOwnerId,
        ownerName: activeOwnerName,
        farmerId: hireModalFarmer.uid,
        farmerName: hireModalFarmer.fullName,
        farmId,
        farmName,
        fieldId: targetField.fieldId || (targetField as any).id,
        fieldName: targetField.name,
        workType,
        dailyRate,
        message: instructions,
      });

      if (!result.success) {
        setRequestError(result.error || 'Failed to submit proposal.');
        return;
      }

      showToast(t('farmers.requestSuccess', { farmerName: hireModalFarmer.fullName }), 'success');
      setHireModalFarmer(null);
      await loadData();
    } catch (err: any) {
      setRequestError(err?.message || 'Unexpected error creating work request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Simulate Farmer Acceptance (for immediate testing & demo evaluation)
  const handleSimulateAccept = async (requestId: string, farmerName: string, fieldName: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await approveAssignmentRequest(requestId);
      if (res.success) {
        showToast(t('farmers.acceptSuccess', { farmerName, fieldName }), 'success');
        await loadData();
      } else {
        showToast(res.error || 'Failed to approve request', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Farmer Acceptance (from incoming proposals banner)
  const handleFarmerAccept = async (req: AssignmentRequest) => {
    setActionLoadingId(req.id);
    try {
      const res = await approveAssignmentRequest(req.id);
      if (res.success) {
        showToast(t('farmers.acceptSuccess', { farmerName: req.farmerName, fieldName: req.fieldName }), 'success');
        await loadData();
      } else {
        showToast(res.error || 'Failed to accept proposal', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error accepting proposal', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Farmer Decline
  const handleFarmerDecline = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await rejectAssignmentRequest(requestId);
      if (res.success) {
        showToast(t('farmers.rejectSuccess', 'Assignment request declined.'), 'info');
        await loadData();
      } else {
        showToast(res.error || 'Failed to decline proposal', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error declining proposal', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Owner Cancel Sent Request
  const handleCancelRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await cancelAssignmentRequest(requestId);
      showToast(t('farmers.rejectSuccess', 'Work proposal cancelled.'), 'info');
      await loadData();
    } catch {
      showToast('Error cancelling proposal', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Owner: "Finish Work & Free Farmer"
  // Removes the farmer from ALL of this owner's fields and releases them so other owners can hire them.
  // Owner: "Finish Work & Free Farmer"
  // Removes the farmer from ALL of this owner's fields and releases them so other owners can hire them.
  const handleEndContract = async (farmer: FarmerProfile, _field?: Field) => {
    const myFields = getMyFieldsForFarmer(farmer.uid);
    const fieldList = myFields.map((f) => f.name).join(', ');
    const confirmRelease = window.confirm(
      t(
        'farmers.freeFarmerConfirm',
        `Work finished? ${farmer.fullName} will be removed from your fields${fieldList ? ` (${fieldList})` : ''} and become available for other owners to hire.`,
        { farmerName: farmer.fullName, fields: fieldList }
      )
    );
    if (!confirmRelease) return;

    setActionLoadingId(farmer.uid);
    // Optimistically update React state immediately
    setFields((prev) =>
      prev.map((f) => {
        const hasWorker = (f.assignedWorkers || []).some((w) => w.farmerId === farmer.uid);
        const hasId = (f.assignedFarmerIds || []).includes(farmer.uid);
        const direct = f.assignedFarmerId === farmer.uid || (f as any).farmerId === farmer.uid;
        if (!hasWorker && !hasId && !direct) return f;

        const remWorkers = (f.assignedWorkers || []).filter((w) => w.farmerId !== farmer.uid);
        const remIds = (f.assignedFarmerIds || []).filter((id) => id !== farmer.uid);
        const nextId = remWorkers.length > 0 ? remWorkers[0].farmerId : null;
        const nextName = remWorkers.length > 0 ? remWorkers[0].farmerName : null;
        return {
          ...f,
          assignedWorkers: remWorkers,
          assignedFarmerIds: remIds,
          assignedFarmerId: nextId,
          assignedFarmerName: nextName,
          farmerId: nextId,
          assignedTo: nextId,
        };
      })
    );
    setEmploymentMap((prev) => {
      const next = { ...prev };
      delete next[farmer.uid];
      return next;
    });
    setFarmers((prev) =>
      prev.map((f) => (f.uid === farmer.uid ? { ...f, assignedFieldsCount: 0 } : f))
    );

    try {
      const res = await freeFarmerFromOwner(activeOwnerId, farmer.uid, farmer.fullName);
      if (res.success) {
        showToast(
          t('farmers.freeFarmerSuccess', `${farmer.fullName} has been freed and is now available for hire.`, {
            farmerName: farmer.fullName,
          }),
          'success'
        );
        if (detailFarmer?.uid === farmer.uid) setDetailFarmer(null);
        notifyEcosystemChange();
        await loadData();
      } else {
        showToast(res.error || 'Failed to free farmer', 'error');
        await loadData();
      }
    } catch (err: any) {
      showToast(err?.message || 'Error freeing farmer', 'error');
      await loadData();
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Details & Reviews Modal
  const openDetailModal = async (farmer: FarmerProfile) => {
    setDetailFarmer(farmer);
    setDetailModalTab('profile');
    setLoadingReviews(true);
    try {
      const reviews = await getFarmerRatings(farmer.uid);
      setDetailReviews(reviews);
    } catch {
      setDetailReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Check if current owner has hired this farmer (currently or in the past) — rating eligibility
  const isFarmerHired = (farmerId: string): boolean => {
    if (hiredFarmerIds.has(farmerId)) return true;
    return getMyFieldsForFarmer(farmerId).length > 0;
  };

  // Open Rate & Comment Modal (Restricted to Hired Farmers)
  const openRateModal = (farmer: FarmerProfile, fieldId?: string, fieldName?: string) => {
    if (!isFarmerHired(farmer.uid)) {
      showToast(t('farmerRating.onlyHiredCanRate', 'You can only rate and comment on farmers you have hired.'), 'error');
      return;
    }
    setRateModalFarmer({ farmer, fieldId, fieldName });
    setRateScore(5);
    setRateHover(0);
    setRateComment('');
    setRateError('');

    // Pre-select field
    const matchedField = fields.find(
      (f) =>
        (fieldId && (f.fieldId === fieldId || (f as any).id === fieldId)) ||
        f.assignedFarmerId === farmer.uid ||
        (f as any).farmerId === farmer.uid
    );
    setRateSelectedFieldId(
      fieldId ||
      matchedField?.fieldId ||
      (matchedField as any)?.id ||
      (fields[0]?.fieldId || (fields[0] as any)?.id || '')
    );
  };

  // Submit Rating & Comment
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateModalFarmer) return;

    if (!rateComment.trim()) {
      setRateError(t('farmerRating.commentRequired', 'Please enter your review comment before submitting.'));
      return;
    }

    setIsSubmittingRating(true);
    setRateError('');

    try {
      const activeUid = user?.uid || (userRole === 'farmer' ? 'farmer_01' : 'owner_demo');
      const activeName = user?.displayName || 'Green Valley Agriculture';

      const targetField = fields.find(
        (f) => f.fieldId === rateSelectedFieldId || (f as any).id === rateSelectedFieldId
      );

      const res = await submitFarmerRating({
        farmerId: rateModalFarmer.farmer.uid,
        farmerName: rateModalFarmer.farmer.fullName,
        ownerId: activeUid,
        ownerName: activeName,
        fieldId: targetField?.fieldId || (targetField as any)?.id || rateModalFarmer.fieldId || 'field_north_rice',
        fieldName: targetField?.name || rateModalFarmer.fieldName || 'Assigned Field',
        rating: rateScore,
        feedback: rateComment.trim(),
      });

      if (!res.success) {
        setRateError(res.error || 'Failed to submit rating.');
        return;
      }

      showToast(t('farmerRating.ratingSuccess', 'Review and rating submitted successfully!'), 'success');
      setRateModalFarmer(null);
      await loadData();
      if (detailFarmer && detailFarmer.uid === rateModalFarmer.farmer.uid) {
        const reviews = await getFarmerRatings(detailFarmer.uid);
        setDetailReviews(reviews);
      }
    } catch (err: any) {
      setRateError(err?.message || 'Error submitting rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Tab switcher handler
  const handleTabChange = (tab: 'assignments' | 'directory') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Field Parcels filtering & metrics
  const fieldMetrics = useMemo(() => {
    let assigned = 0;
    let unassigned = 0;
    let attention = 0;

    fields.forEach((f) => {
      const hasWorker = getFieldAssignedWorkers(f).length > 0;
      if (hasWorker) assigned++;
      else unassigned++;

      const dec = evaluateFieldDecision(f);
      if (dec.status === 'Critical' || dec.status === 'Attention') attention++;
    });

    return {
      total: fields.length,
      assigned,
      unassigned,
      attention,
    };
  }, [fields]);

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const isAssigned = getFieldAssignedWorkers(f).length > 0;
      const dec = evaluateFieldDecision(f);
      const isAtt = dec.status === 'Critical' || dec.status === 'Attention';

      if (fieldStatusFilter === 'assigned' && !isAssigned) return false;
      if (fieldStatusFilter === 'unassigned' && isAssigned) return false;
      if (fieldStatusFilter === 'attention' && !isAtt) return false;

      if (fieldSearchQuery.trim()) {
        const q = fieldSearchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchCrop = (f.crop || '').toLowerCase().includes(q);
        const matchFarmer = getFieldAssignedWorkers(f).some((w) => (w.farmerName || '').toLowerCase().includes(q));
        const matchSoil = (f.soilType || '').toLowerCase().includes(q);
        return matchName || matchCrop || matchFarmer || matchSoil;
      }
      return true;
    });
  }, [fields, fieldSearchQuery, fieldStatusFilter]);

  // Can this farmer be added to the given field by the current owner?
  // → must be free OR already working for this owner, and not already on this field.
  const canAddFarmerToField = (farmer: FarmerProfile, field: Field): boolean => {
    const onField = getFieldAssignedWorkers(field).some((w) => w.farmerId === farmer.uid);
    if (onField) return false;
    const { status } = getFarmerStatus(farmer);
    return status === 'available' || status === 'working_for_you';
  };

  // Open "Add Specialist" modal for a specific field parcel (fields can have multiple workers)
  const openAssignModalForField = (field: Field) => {
    setAssigningField(field);
    const candidate =
      farmers.find((f) => canAddFarmerToField(f, field) && getFarmerStatus(f).status === 'working_for_you') ||
      farmers.find((f) => canAddFarmerToField(f, field));
    setSelectedWorkerForField(candidate ? candidate.uid : '');
    setDailyRate(candidate?.hourlyRate || '$120 / day');
    setWorkType(t('farmers.workTypeOptions.irrigation', 'Precision Irrigation & Water Dispatch'));
    setInstructions('');
    setRequestError('');
  };

  // Direct worker assignment to a field parcel (adds to existing workers)
  const handleFieldAssignDirect = async () => {
    if (!assigningField || !selectedWorkerForField) return;
    setSubmittingRequest(true);
    setRequestError('');
    try {
      const selectedFarmer = farmers.find((f) => f.uid === selectedWorkerForField);
      const workerName = selectedFarmer ? selectedFarmer.fullName : 'Specialist Worker';
      const targetId = (assigningField as any).docId || assigningField.fieldId || (assigningField as any).id;

      const res = await addWorkerToField(
        targetId,
        { farmerId: selectedWorkerForField, farmerName: workerName, workType, dailyRate },
        activeOwnerId
      );
      if (res.success) {
        showToast(
          t('farmers.directAssignSuccess', `${workerName} assigned to ${assigningField.name} successfully.`, {
            farmerName: workerName,
            fieldName: assigningField.name,
          }),
          'success'
        );
        setAssigningField(null);
        notifyEcosystemChange();
        await loadData();
      } else {
        setRequestError(res.error || 'Failed to assign worker to field.');
      }
    } catch (err: any) {
      setRequestError(err?.message || 'Error assigning worker.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Dispatch work proposal for a field parcel
  const handleFieldSendProposal = async () => {
    if (!assigningField || !selectedWorkerForField) return;
    setSubmittingRequest(true);
    setRequestError('');
    try {
      const selectedFarmer = farmers.find((f) => f.uid === selectedWorkerForField);
      if (!selectedFarmer) return;

      const activeOwnerId = user?.uid || 'owner_demo';
      const activeOwnerName = user?.displayName || 'Green Valley Agriculture';
      const farmName = farms.length > 0 ? farms[0].name : 'Primary Salinas Agricultural Estate';
      const farmId = assigningField.farmId || (farms.length > 0 ? farms[0].farmId : 'farm_salinas_01');
      const targetId = (assigningField as any).docId || assigningField.fieldId || (assigningField as any).id;

      const result = await createAssignmentRequest({
        ownerId: activeOwnerId,
        ownerName: activeOwnerName,
        farmerId: selectedFarmer.uid,
        farmerName: selectedFarmer.fullName,
        farmId,
        farmName,
        fieldId: targetId,
        fieldName: assigningField.name,
        workType,
        dailyRate,
        message: instructions,
      });

      if (!result.success) {
        setRequestError(result.error || 'Failed to submit proposal.');
        return;
      }

      showToast(t('farmers.requestSuccess', { farmerName: selectedFarmer.fullName }), 'success');
      setAssigningField(null);
      notifyEcosystemChange();
      await loadData();
    } catch (err: any) {
      setRequestError(err?.message || 'Unexpected error creating work request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Remove ONE worker from a field (others on that field stay). The farmer stays employed by
  // this owner until the owner explicitly frees them.
  const handleUnassignWorkerFromField = async (f: Field, worker?: FieldWorkerAssignment) => {
    const workers = getFieldAssignedWorkers(f);
    const targets = worker ? [worker] : workers;
    if (targets.length === 0) return;
    const workerName = worker ? worker.farmerName : targets.map((w) => w.farmerName).join(', ');
    const confirmUnassign = window.confirm(
      t('farmers.unassignConfirm', `Are you sure you want to unassign ${workerName} from ${f.name}?`, {
        farmerName: workerName,
        fieldName: f.name,
      })
    );
    if (!confirmUnassign) return;

    setActionLoadingId(worker ? `${f.fieldId}_${worker.farmerId}` : f.fieldId);
    try {
      const targetId = (f as any).docId || f.fieldId || (f as any).id;
      let allOk = true;
      for (const w of targets) {
        const res = await removeWorkerFromField(targetId, w.farmerId, activeOwnerId);
        if (!res.success) allOk = false;
      }
      if (allOk) {
        showToast(
          t('farmers.unassignedSuccess', `Worker released from field ${f.name}.`, { fieldName: f.name }),
          'success'
        );
        notifyEcosystemChange();
        await loadData();
      } else {
        showToast('Failed to unassign worker.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error unassigning worker', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* ── Top Header & Breadcrumbs ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider mb-space-xs">
            <span>{t('navigation.dashboard', 'Dashboard')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">{t('navigation.farmers', 'Farmers')}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            {t('farmers.title', 'Farmers & Agricultural Specialists')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-3xl">
            {t('farmers.subtitle', 'Discover, hire, and manage professional agricultural workers for your farm fields.')}
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            onClick={() => navigate('/messages')}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors font-label-md text-label-md text-on-surface font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>{t('navigation.oneToOneChat', '1-to-1 Chat')}</span>
          </button>
          <button
            onClick={() => navigate(userRole === 'farmer' ? '/farmer-dashboard' : '/owner-dashboard')}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              {userRole === 'farmer' ? 'assignment_turned_in' : 'admin_panel_settings'}
            </span>
            <span>{userRole === 'farmer' ? t('navigation.farmerWorkspace') : t('navigation.ownerGisWorkspace')}</span>
          </button>
        </div>
      </div>

      {/* ── BANNERS SECTION ── */}

      {/* 1. Incoming Specialist Applications Banner (For Farm Owners) */}
      {isOwner && incomingSpecialistApplications.length > 0 && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center gap-space-sm pb-space-sm border-b border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-[24px]">contact_page</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-secondary font-semibold">
                {t('farmers.incomingSpecialistApplications', 'Incoming Specialist Applications')} ({incomingSpecialistApplications.length})
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('farmers.incomingSpecialistSubtitle', 'Farmers have applied to work on your fields. Review their proposals and accept to assign.')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md">
            {incomingSpecialistApplications.map((app) => (
              <div
                key={app.id}
                className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant flex flex-col justify-between gap-space-sm shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-headline-sm text-primary font-semibold">{app.farmerName}</span>
                      <span className="text-label-sm text-on-surface-variant block">Applied for: <strong>{app.fieldName}</strong> ({app.farmName})</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-label-sm font-semibold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      {app.dailyRate || '$120 / day'}
                    </span>
                  </div>
                  {app.workType && (
                    <div className="inline-block mt-2 px-2 py-0.5 rounded bg-surface-container text-label-sm font-medium text-primary">
                      {app.workType}
                    </div>
                  )}
                  {app.message && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-2 bg-surface-container-low p-2 rounded">
                      "{app.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container">
                  <button
                    disabled={actionLoadingId === app.id}
                    onClick={() => handleOwnerDeclineApplication(app.id)}
                    className="px-space-md py-1.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {t('farmers.declineApplication', 'Decline')}
                  </button>
                  <button
                    disabled={actionLoadingId === app.id}
                    onClick={() => handleOwnerAcceptApplication(app)}
                    className="flex items-center gap-1 px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    <span>{actionLoadingId === app.id ? 'Assigning...' : t('farmers.acceptAndHire', 'Accept & Assign')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Incoming Proposals Banner (For Farmers invited by Owners) */}
      {isFarmer && incomingRequests.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center gap-space-sm pb-space-sm border-b border-primary/20">
            <span className="material-symbols-outlined text-primary text-[24px]">contact_mail</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-semibold">
                {t('farmers.incomingRequestsTitle', 'Your Incoming Work Requests')} ({incomingRequests.length})
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('farmers.incomingRequestsSubtitle', 'Farm owners have invited you to manage their agricultural fields.')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant flex flex-col justify-between gap-space-sm shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-primary font-semibold">{req.fieldName}</span>
                    <span className="px-2 py-0.5 rounded text-label-sm font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {req.dailyRate || '$120 / day'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    <strong>{req.ownerName}</strong> • {req.farmName}
                  </p>
                  {req.workType && (
                    <div className="inline-block mt-2 px-2 py-0.5 rounded bg-surface-container text-label-sm font-medium text-primary">
                      {req.workType}
                    </div>
                  )}
                  {req.message && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-2 bg-surface-container-low p-2 rounded">
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container">
                  <button
                    disabled={actionLoadingId === req.id}
                    onClick={() => handleFarmerDecline(req.id)}
                    className="px-space-md py-1.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {t('farmers.declineProposal', 'Decline')}
                  </button>
                  <button
                    disabled={actionLoadingId === req.id}
                    onClick={() => handleFarmerAccept(req)}
                    className="flex items-center gap-1 px-space-md py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{actionLoadingId === req.id ? 'Accepting...' : t('farmers.acceptProposal', 'Accept Proposal')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Submitted Work Applications Banner (For Farmers who applied to owner fields) */}
      {isFarmer && myApplications.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center gap-space-sm pb-space-sm border-b border-surface-container">
            <span className="material-symbols-outlined text-primary text-[24px]">send</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-semibold">
                {t('farmers.myApplicationsTitle', 'Your Submitted Work Applications')} ({myApplications.length})
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Track status of your work applications sent to farm owners.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md">
            {myApplications.map((app) => (
              <div
                key={app.id}
                className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/60 flex flex-col justify-between gap-space-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-headline-sm text-primary font-semibold">{app.fieldName}</span>
                      <span className="text-label-sm text-on-surface-variant block">{app.farmName} • {app.ownerName}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-label-xs font-semibold ${
                      app.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : app.status === 'rejected'
                        ? 'bg-error-container text-error'
                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                    }`}>
                      {app.status === 'approved'
                        ? 'Approved & Assigned'
                        : app.status === 'rejected'
                        ? 'Declined'
                        : t('farmers.applicationPending', 'Application Sent • Waiting for Owner Review')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-data-mono text-label-sm font-semibold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                      {app.dailyRate || '$120 / day'}
                    </span>
                    {app.workType && (
                      <span className="text-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">
                        {app.workType}
                      </span>
                    )}
                  </div>
                  {app.message && (
                    <p className="text-label-sm text-on-surface-variant italic mt-1.5 bg-surface-container-lowest p-2 rounded">
                      "{app.message}"
                    </p>
                  )}
                </div>

                {app.status === 'pending' && (
                  <div className="flex justify-end pt-space-xs border-t border-surface-container">
                    <button
                      type="button"
                      disabled={actionLoadingId === app.id}
                      onClick={() => handleFarmerWithdrawApplication(app.id)}
                      className="px-3 py-1 rounded-lg text-error hover:bg-error-container text-label-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t('farmers.withdrawApplication', 'Withdraw')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-surface-container gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('assignments')}
          className={`flex items-center gap-2 pb-3 px-3 font-label-lg text-label-lg font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{isFarmer ? 'work' : 'assignment_ind'}</span>
          <span>{isFarmer ? t('farmers.tabWorkOpportunities', 'Open Work Opportunities') : t('farmers.tabFieldAssignments', 'Field Parcels & Worker Assignments')}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-label-sm font-data-mono bg-primary-container/40 text-primary">
            {fieldMetrics.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('directory')}
          className={`flex items-center gap-2 pb-3 px-3 font-label-lg text-label-lg font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'directory'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">badge</span>
          <span>{t('farmers.tabFarmersDirectory', 'Farmers Directory')}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-label-sm font-data-mono bg-secondary-container/40 text-secondary">
            {metrics.total}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: FIELD PARCELS & WORKER ASSIGNMENTS                     ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assignments' && (
        <div className="space-y-space-xl">
          {/* Subheader & GIS Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant shadow-2xs">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">{isFarmer ? 'work' : 'landscape'}</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary font-semibold">
                  {isFarmer
                    ? t('farmers.workOpportunitiesTitle', 'Available Farm Fields & Work Opportunities')
                    : t('farmers.fieldParcelsTitle', 'Field Parcels & Worker Assignments')}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {isFarmer
                    ? t('farmers.workOpportunitiesSubtitle', 'Browse fields owned by agricultural enterprises and apply with your proposed rate and specialization.')
                    : t('farmers.fieldParcelsSubtitle', 'Manage your farm fields, monitor health status, and assign or reassign dedicated specialists.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(isFarmer ? '/farmer-dashboard' : '/owner-dashboard')}
              className="flex items-center gap-1.5 px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-semibold transition-all self-start sm:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">map</span>
              <span>{isFarmer ? 'Farmer Workspace' : t('farmers.viewInGis', 'View in GIS Map')}</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </button>
          </div>

          {/* ── Field Parcels Bento Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
            {/* Total Parcels */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                  {isFarmer ? 'Available Farm Fields' : t('farmers.totalParcels', 'Total Field Parcels')}
                </span>
                <span className="material-symbols-outlined text-primary text-[24px]">grid_view</span>
              </div>
              <div className="my-space-md">
                <span className="font-display-lg text-display-lg text-primary font-semibold tabular-nums">
                  {formatNumber(fieldMetrics.total)}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {isFarmer ? 'Open agricultural sectors across estates' : 'Active agricultural production sectors'}
                </p>
              </div>
            </div>

            {/* Assigned / Active Fields */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase text-secondary tracking-wider font-semibold">
                  {isFarmer ? 'Your Assigned Fields' : t('farmers.assignedParcels', 'Assigned Parcels')}
                </span>
                <span className="material-symbols-outlined text-secondary text-[24px]">person_check</span>
              </div>
              <div className="my-space-md">
                <span className="font-display-lg text-display-lg text-secondary font-semibold tabular-nums">
                  {formatNumber(
                    isFarmer
                      ? fields.filter((f) => getFieldAssignedWorkers(f).some((w) => w.farmerId === (user?.uid || 'farmer_01'))).length
                      : fieldMetrics.assigned
                  )}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {isFarmer ? 'Fields you are currently tasked with' : 'Parcels under active specialist management'}
                </p>
              </div>
            </div>

            {/* Unassigned / Open for Applications */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase text-amber-600 dark:text-amber-400 tracking-wider font-semibold">
                  {isFarmer ? 'Open for Applications' : t('farmers.unassignedParcels', 'Unassigned Parcels')}
                </span>
                <span className="material-symbols-outlined text-amber-500 text-[24px]">person_add</span>
              </div>
              <div className="my-space-md">
                <span className="font-display-lg text-display-lg text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                  {formatNumber(fieldMetrics.unassigned)}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {isFarmer ? 'Parcels seeking specialist workers' : 'Autonomous or awaiting worker dispatch'}
                </p>
              </div>
            </div>

            {/* Attention / Submitted Applications */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                  {isFarmer ? 'Your Applications' : t('farmers.attentionParcels', 'Needs Attention')}
                </span>
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {isFarmer ? 'send' : 'warning'}
                </span>
              </div>
              <div className="my-space-md">
                <span className="font-display-lg text-display-lg text-primary font-semibold tabular-nums">
                  {formatNumber(
                    isFarmer
                      ? myApplications.filter((a) => a.status === 'pending').length
                      : fieldMetrics.attention
                  )}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {isFarmer ? 'Submitted applications under owner review' : 'Parcels with water or pathogen alerts'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Field Parcels Toolbar ── */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-outline-variant flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                value={fieldSearchQuery}
                onChange={(e) => setFieldSearchQuery(e.target.value)}
                placeholder="Search parcels by field name, crop, soil, or assigned worker..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {fieldSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFieldSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setFieldStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer ${
                  fieldStatusFilter === 'all'
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t('farmers.filterAllParcels', 'All Parcels ({count})', { count: formatNumber(fieldMetrics.total) })}
              </button>
              <button
                type="button"
                onClick={() => setFieldStatusFilter('assigned')}
                className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer ${
                  fieldStatusFilter === 'assigned'
                    ? 'bg-secondary text-on-secondary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t('farmers.filterAssignedParcels', 'Assigned ({count})', { count: formatNumber(fieldMetrics.assigned) })}
              </button>
              <button
                type="button"
                onClick={() => setFieldStatusFilter('unassigned')}
                className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer ${
                  fieldStatusFilter === 'unassigned'
                    ? 'bg-amber-500 text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t('farmers.filterUnassignedParcels', 'Unassigned ({count})', { count: formatNumber(fieldMetrics.unassigned) })}
              </button>
              <button
                type="button"
                onClick={() => setFieldStatusFilter('attention')}
                className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer ${
                  fieldStatusFilter === 'attention'
                    ? 'bg-error text-on-error font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t('farmers.filterAttentionParcels', 'Needs Attention ({count})', { count: formatNumber(fieldMetrics.attention) })}
              </button>
            </div>
          </div>

          {/* ── Field Parcels Grid ── */}
          {filteredFields.length === 0 ? (
            <div className="bg-surface-container-lowest p-space-2xl rounded-2xl border border-outline-variant text-center space-y-space-md">
              <span className="material-symbols-outlined text-outline text-[48px]">landscape</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">No field parcels match your criteria</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                Try clearing your search query or changing the parcel status filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFieldSearchQuery('');
                  setFieldStatusFilter('all');
                }}
                className="px-space-lg py-2 rounded-xl bg-primary-container text-on-primary font-semibold text-label-md hover:bg-primary transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
              {filteredFields.map((field) => {
                const fieldWorkers = getFieldAssignedWorkers(field);
                const isAssigned = fieldWorkers.length > 0;
                const decision = evaluateFieldDecision(field);
                const ownerInfo = getOwnerAccountForField(field, farms);

                const statusColor =
                  decision.status === 'Critical'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                    : decision.status === 'Attention'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                    : decision.status === 'Healthy'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20';

                const statusIcon =
                  decision.status === 'Critical'
                    ? 'crisis_alert'
                    : decision.status === 'Attention'
                    ? 'warning'
                    : decision.status === 'Healthy'
                    ? 'check_circle'
                    : 'help_outline';

                return (
                  <div
                    key={field.fieldId || (field as any).id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant hover:border-primary/40 p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-md"
                  >
                    <div>
                      {/* ── Owner Account Header Card ── */}
                      <div className="mb-3.5 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/25">
                            <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-label-md font-bold text-on-surface truncate">
                                {ownerInfo.name}
                              </span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <span className="material-symbols-outlined text-[11px]">verified</span>
                                {t('farmers.ownerAccount', 'Owner Account')}
                              </span>
                            </div>
                            <span className="text-label-xs text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                              <span className="material-symbols-outlined text-[13px] text-primary">store</span>
                              <span className="font-medium">{ownerInfo.farmName}</span>
                              <span>•</span>
                              <span>{ownerInfo.location}</span>
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-container border border-surface-container-high text-on-surface-variant shrink-0">
                          {t('farmers.openJobsCount', '{count} Open', { count: formatNumber(1) })}
                        </span>
                      </div>

                      {/* Top Header: Field Name & Health Badge */}
                      <div className="flex items-start justify-between gap-2 pb-space-sm border-b border-surface-container">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[20px]">agriculture</span>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                              {field.name}
                            </h3>
                          </div>
                          <span className="text-label-sm text-on-surface-variant block mt-0.5">
                            ID: {field.fieldId || (field as any).id} • {field.crop || 'Crop'}
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-label-xs font-semibold border flex items-center gap-1 shrink-0 ${statusColor}`}>
                          <span className="material-symbols-outlined text-[14px]">{statusIcon}</span>
                          <span>{decision.status}</span>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-3 gap-2 py-3 bg-surface-container-low rounded-xl px-3 my-3 text-center">
                        <div>
                          <span className="text-label-xs text-on-surface-variant block font-medium">Crop</span>
                          <span className="font-label-sm font-semibold text-primary truncate block">{field.crop || 'Field Crop'}</span>
                        </div>
                        <div>
                          <span className="text-label-xs text-on-surface-variant block font-medium">Area</span>
                          <span className="font-label-sm font-semibold text-on-surface block font-data-mono">{field.areaAcres ? `${field.areaAcres} ac` : '35 ac'}</span>
                        </div>
                        <div>
                          <span className="text-label-xs text-on-surface-variant block font-medium">Soil</span>
                          <span className="font-label-sm font-semibold text-on-surface block truncate">{field.soilType || 'Loam'}</span>
                        </div>
                      </div>

                      {/* Agronomic Decision Alert / Summary */}
                      {decision.reasons && decision.reasons.length > 0 && (
                        <div className="mb-3 px-3 py-2 rounded-xl bg-surface-container text-body-sm text-on-surface-variant flex items-start gap-2">
                          <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 shrink-0">psychology</span>
                          <span className="line-clamp-2">{decision.reasons[0]}</span>
                        </div>
                      )}

                      {/* ── Assigned Workers Block (a field can have MULTIPLE workers) ── */}
                      <div className="mt-2 p-3 rounded-xl border border-surface-container bg-surface-container-low">
                        <div className="flex items-center justify-between text-label-xs uppercase font-semibold text-on-surface-variant tracking-wider mb-2">
                          <span>{t('farmers.assignedWorkersTitle', 'Assigned Workers')}</span>
                          <span className={isAssigned ? 'text-secondary font-bold' : 'text-amber-600 font-bold'}>
                            {isAssigned
                              ? t('farmers.workersCount', '{count} active', { count: formatNumber(fieldWorkers.length) })
                              : t('farmers.unassignedLabel', 'Unassigned')}
                          </span>
                        </div>

                        {isAssigned ? (
                          <ul className="space-y-2">
                            {fieldWorkers.map((worker) => {
                              const fProfile: FarmerProfile =
                                farmers.find((f) => f.uid === worker.farmerId) ||
                                ({
                                  uid: worker.farmerId,
                                  fullName: worker.farmerName,
                                  email: '',
                                  phone: '',
                                  specialization: [worker.workType || 'Specialist Operator'],
                                  averageRating: 5.0,
                                  totalRatings: 1,
                                  experienceYears: 5,
                                  hourlyRate: worker.dailyRate || '$120 / day',
                                } as unknown as FarmerProfile);
                              const rowLoadingId = `${field.fieldId}_${worker.farmerId}`;
                              return (
                                <li
                                  key={worker.farmerId}
                                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-lowest border border-surface-container"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary flex items-center justify-center font-bold text-sm shrink-0">
                                      {(worker.farmerName || 'W')[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="font-label-md text-label-md font-semibold text-on-surface truncate">
                                          {worker.farmerName}
                                        </h4>
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                          <span className="material-symbols-outlined text-[10px]">verified</span>
                                          {t('farmers.hiredBadge', 'Hired')}
                                        </span>
                                      </div>
                                      <span className="text-label-xs text-secondary font-medium block truncate">
                                        {worker.workType || 'Specialist Operator'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => navigate('/messages')}
                                      className="w-7 h-7 rounded-md hover:bg-surface-container text-primary flex items-center justify-center transition-colors cursor-pointer"
                                      title={t('farmers.chatWithWorker', 'Chat with Worker')}
                                    >
                                      <span className="material-symbols-outlined text-[16px]">chat</span>
                                    </button>
                                    {!isFarmer && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openRateModal(fProfile, field.fieldId || (field as any).id, field.name)}
                                          className="w-7 h-7 rounded-md hover:bg-amber-500/10 text-amber-500 flex items-center justify-center transition-colors cursor-pointer"
                                          title={t('farmerRating.rateAndCommentFarmer', 'Rate & Comment on Farmer')}
                                        >
                                          <span className="material-symbols-outlined text-[16px]">rate_review</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={actionLoadingId === rowLoadingId}
                                          onClick={() => handleUnassignWorkerFromField(field, worker)}
                                          className="w-7 h-7 rounded-md hover:bg-error-container text-error flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                                          title={t('farmers.removeFromField', 'Remove from this field')}
                                        >
                                          <span className="material-symbols-outlined text-[16px]">person_remove</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={actionLoadingId === worker.farmerId}
                                          onClick={() => handleEndContract(fProfile)}
                                          className="w-7 h-7 rounded-md hover:bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                                          title={t('farmers.freeFarmer', 'Finish Work & Free Farmer')}
                                        >
                                          <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="py-2 text-center">
                            <span className="text-body-sm text-on-surface-variant block mb-1">
                              {t('farmers.unassignedField', 'Unassigned — No active worker')}
                            </span>
                            <span className="text-label-xs text-on-surface-variant/80 block">
                              {isFarmer
                                ? 'This field parcel is open for specialist applications'
                                : t('farmers.unassignedFieldHint', 'Assign one or more specialists to manage field telemetry and operations')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-space-xs border-t border-surface-container flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(isFarmer ? '/farmer-dashboard' : '/owner-dashboard')}
                        className="text-label-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                        <span>{t('farmers.viewInGis', 'GIS Map')}</span>
                      </button>

                      {isFarmer ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const activeFarmerUid = user?.uid || 'farmer_01';
                            const isCurrentFarmerAssigned = fieldWorkers.some((w) => w.farmerId === activeFarmerUid);
                            const currentFarmerPendingApp = myApplications.find(
                              (a) => (a.fieldId === field.fieldId || a.fieldId === (field as any).id) && a.status === 'pending'
                            );
                            const currentEmployer = employmentMap[activeFarmerUid];
                            const isEmployedByOtherOwner = currentEmployer && currentEmployer !== (field.ownerId || 'owner_demo');

                            if (isCurrentFarmerAssigned) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-label-sm font-semibold">
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  {t('farmers.alreadyAssignedHere', 'Currently Assigned Here')}
                                </span>
                              );
                            }

                            if (currentFarmerPendingApp) {
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-label-xs font-semibold">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    {t('farmers.applicationPending', 'Application Sent • Waiting for Owner Review')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleFarmerWithdrawApplication(currentFarmerPendingApp.id)}
                                    className="px-2 py-1 rounded-lg text-error hover:bg-error-container text-label-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    {t('farmers.withdrawApplication', 'Withdraw')}
                                  </button>
                                </div>
                              );
                            }

                            if (isEmployedByOtherOwner) {
                              return (
                                <button
                                  disabled
                                  className="px-3 py-1.5 rounded-xl bg-surface-container/70 text-on-surface-variant/70 border border-outline-variant/40 text-label-sm font-medium flex items-center gap-1.5 cursor-not-allowed"
                                  title="Under contract with another owner. Ask them to free you to apply."
                                >
                                  <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                                  <span>Busy (Other Owner)</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => openApplyModal(field)}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:opacity-95 text-label-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                                <span>{t('farmers.applyForJob', 'Apply for Job')}</span>
                              </button>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAssignModalForField(field)}
                            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-label-sm font-semibold transition-all shadow-2xs cursor-pointer ${
                              isAssigned
                                ? 'bg-primary-container text-on-primary hover:bg-primary'
                                : 'bg-secondary text-on-secondary hover:opacity-95'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isAssigned ? 'group_add' : 'person_add'}
                            </span>
                            <span>
                              {isAssigned
                                ? t('farmers.addAnotherWorker', 'Add Specialist')
                                : t('farmers.assignWorker', 'Assign Worker')}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: FARMERS WORKFORCE DIRECTORY                           ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <div className="space-y-space-xl">
          {/* ── Top Metrics Bento Unit ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
              {t('farmers.totalFarmers', 'Total Farmers')}
            </span>
            <span className="material-symbols-outlined text-primary text-[24px]">groups</span>
          </div>
          <div className="my-space-md">
            <span className="font-display-lg text-display-lg text-primary font-semibold tabular-nums">
              {formatNumber(metrics.total)}
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Registered verified agricultural operators
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-secondary/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-secondary tracking-wider font-semibold">
              {t('farmers.hiredByYou', 'Hired by You')}
            </span>
            <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
          </div>
          <div className="my-space-md">
            <span className="font-display-lg text-display-lg text-secondary font-semibold tabular-nums">
              {formatNumber(metrics.working)}
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {t('farmers.hiredDescription', 'Active operators currently hired for your farm fields')}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-primary/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-primary tracking-wider font-semibold">
              {t('farmers.availableForHire', 'Available for Hire')}
            </span>
            <span className="material-symbols-outlined text-primary text-[24px]">person_add</span>
          </div>
          <div className="my-space-md">
            <span className="font-display-lg text-display-lg text-primary font-semibold tabular-nums">
              {formatNumber(metrics.available)}
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {t('farmers.availableDescription', 'Verified specialists open for work proposals and hiring')}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-amber-600 dark:text-amber-400 tracking-wider font-semibold">
              {t('farmers.pendingProposals', 'Pending Proposals')}
            </span>
            <span className="material-symbols-outlined text-amber-500 text-[24px]">pending_actions</span>
          </div>
          <div className="my-space-md">
            <span className="font-display-lg text-display-lg text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
              {formatNumber(metrics.pending)}
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Offers awaiting farmer response
            </p>
          </div>
        </div>
      </div>

      {/* ── Search, Filters & Controls Toolbar ── */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-outline-variant flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('farmers.searchPlaceholder', 'Search farmers by name, specialization, or location...')}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-container text-on-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {t('farmers.filterAll', { count: formatNumber(farmers.length) })}
          </button>
          <button
            onClick={() => setStatusFilter('working_for_you')}
            className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'working_for_you'
                ? 'bg-secondary text-on-secondary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {t('farmers.filterHired', 'Hired ({count})', { count: formatNumber(metrics.working) })}
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'available'
                ? 'bg-primary-container text-on-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {t('farmers.filterAvailable', { count: formatNumber(metrics.available) })}
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-label-md text-label-md whitespace-nowrap transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-on-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {t('farmers.filterRequests', { count: formatNumber(metrics.pending) })}
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-space-xs shrink-0">
          <span className="font-label-sm text-on-surface-variant">{t('common.filter', 'Sort:')}</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant font-label-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="rating">Highest Rated</option>
            <option value="experience">Most Experienced</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ── Farmers Grid ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-space-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] animate-spin text-primary">progress_activity</span>
          <span className="font-body-md text-body-md">{t('common.loading', 'Loading farmers...')}</span>
        </div>
      ) : filteredFarmers.length === 0 ? (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant p-space-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/60">person_search</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-space-sm">
            {t('farmers.noFarmersFound', 'No farmers match your search criteria.')}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Try adjusting your search terms or clearing the status filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-space-md px-space-md py-1.5 rounded-lg bg-surface-container font-label-md text-label-md text-primary font-semibold hover:bg-surface-container-high transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
          {filteredFarmers.map((farmer) => {
            const { status, assignedField, assignedFields, pendingRequest } = getFarmerStatus(farmer);
            const isWorking = status === 'working_for_you';
            const isPending = status === 'request_pending';
            const isAvailable = status === 'available';

            return (
              <div
                key={farmer.uid}
                className={`bg-surface-container-lowest rounded-2xl p-space-lg border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isWorking
                    ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : isPending
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : isAvailable
                    ? 'border-primary/30 bg-primary/5 hover:border-primary/60'
                    : 'border-outline-variant hover:border-primary/40'
                }`}
              >
                <div>
                  {/* Top Status Announcement Banner */}
                  {isWorking && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-label-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">verified</span>
                        <span>{t('farmers.hiredStatusBanner', 'Hired • Currently Working for You')}</span>
                      </div>
                      {assignedFields && assignedFields.length > 0 ? (
                        <span className="text-[11px] font-medium opacity-90 truncate max-w-[150px]">
                          {assignedFields.length === 1 ? assignedFields[0].name : `${assignedFields.length} of your fields`}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium opacity-90">
                          Retained Specialist
                        </span>
                      )}
                    </div>
                  )}

                  {isAvailable && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-label-xs font-semibold text-primary">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        <span>{t('farmers.availableStatusBanner', 'Available for Hire • Open for Proposals')}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Ready
                      </span>
                    </div>
                  )}

                  {isPending && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-label-xs font-semibold text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-600">pending</span>
                        <span>{t('farmers.requestPending', 'Pending Response')}</span>
                      </div>
                      <span className="text-[11px] font-medium opacity-80">Awaiting acceptance</span>
                    </div>
                  )}

                  {status === 'busy' && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-between text-label-xs font-semibold text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                        <span>{t('farmers.workingForAnotherOwnerBanner', 'Employed by Another Farm Owner • Busy')}</span>
                      </div>
                      <span className="text-[11px] font-medium opacity-80">Under Contract</span>
                    </div>
                  )}

                  {/* Card Header: Avatar, Name & Status Pill */}
                  <div className="flex items-start justify-between gap-space-sm pb-space-sm border-b border-surface-container">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary font-headline-sm font-semibold shadow-sm shrink-0">
                        {farmer.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
                            {farmer.fullName}
                          </h3>
                          {farmer.verified && (
                            <span
                              className="material-symbols-outlined text-[18px] text-secondary"
                              title={t('farmers.verifiedSpecialist', 'Verified Field Specialist')}
                            >
                              verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-label-sm text-on-surface-variant mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {farmer.location || 'Salinas Valley'}
                          </span>
                          <span>•</span>
                          <span>{farmer.experienceYears || 5} yrs exp</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isWorking && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          {t('farmers.hiredBadge', 'Hired')}
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {t('farmers.requestPending', 'Pending')}
                        </span>
                      )}
                      {isAvailable && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-primary/10 text-primary border border-primary/25 shadow-2xs">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          {t('farmers.availableForHire', 'Available for Hire')}
                        </span>
                      )}
                      {status === 'busy' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                          <span className="material-symbols-outlined text-[12px]">lock</span>
                          {t('farmers.assignedToOther', 'Busy (Other Owner)')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating & Rate Bar */}
                  <div className="flex items-center justify-between my-space-md py-space-xs px-space-sm rounded-xl bg-surface-container font-body-sm">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">star</span>
                      <span className="font-semibold text-on-surface">
                        {formatNumber(farmer.averageRating || 5.0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-on-surface-variant text-label-sm">
                        ({farmer.totalRatings || 1} {t('farmers.rating', 'reviews')})
                      </span>
                    </div>
                    <div className="font-data-mono font-semibold text-primary">
                      {farmer.hourlyRate || '$120 / day'}
                    </div>
                  </div>

                  {/* Specialization Tags */}
                  <div className="space-y-1 mb-space-md">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
                      {t('farmers.specializations', 'Specializations')}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(farmer.specialization || ['Irrigation', 'Soil Health']).map((spec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-surface-container-low text-label-sm text-on-surface border border-outline-variant font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-md">
                    {farmer.bio || 'Experienced field worker specialized in telemetry data logging and crop scouting.'}
                  </p>

                  {/* Active Context Information */}
                  {isWorking && (
                    <div className="p-space-sm rounded-xl bg-secondary/10 border border-secondary/20 flex flex-col gap-1.5 mb-space-md text-body-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">layers</span>
                          <span className="font-semibold text-secondary">
                            {assignedFields && assignedFields.length > 0
                              ? t('farmers.assignedToYourFields', 'Assigned to your field(s):')
                              : t('farmers.hiredSpecialist', 'Hired Specialist')}
                          </span>
                        </div>
                        <span className="font-label-sm text-secondary font-semibold uppercase">
                          {assignedFields && assignedFields.length > 0 ? `${assignedFields.length} Field(s)` : 'Hired'}
                        </span>
                      </div>
                      {assignedFields && assignedFields.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {assignedFields.map((f) => (
                            <span
                              key={f.fieldId || (f as any).id}
                              className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary text-label-xs font-semibold"
                            >
                              {f.name} ({f.crop})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-label-sm text-on-surface-variant">
                          Retained on contract • Ready for field tasking
                        </div>
                      )}
                    </div>
                  )}

                  {isAvailable && (
                    <div className="p-space-sm rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-between mb-space-md text-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                        <div>
                          <div className="font-semibold text-primary">{t('farmers.availableForHire', 'Available for Hire')}</div>
                          <div className="text-label-sm text-on-surface-variant">
                            {t('farmers.openForProposals', 'Open for work proposals & field assignments')}
                          </div>
                        </div>
                      </div>
                      <span className="font-label-sm text-primary font-semibold uppercase">Open</span>
                    </div>
                  )}

                  {status === 'busy' && (
                    <div className="p-space-sm rounded-xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-between mb-space-md text-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-[20px]">lock</span>
                        <div>
                          <div className="font-semibold text-on-surface">
                            {t('farmers.workingForAnotherOwner', 'Working for Another Owner')}
                          </div>
                          <div className="text-label-sm text-on-surface-variant">
                            {t('farmers.busyNotice', 'Specialist is currently under contract. Ready for hire once freed.')}
                          </div>
                        </div>
                      </div>
                      <span className="font-label-sm text-amber-600 font-semibold uppercase">Busy</span>
                    </div>
                  )}

                  {isPending && pendingRequest && (
                    <div className="p-space-sm rounded-xl bg-amber-500/10 border border-amber-500/20 mb-space-md text-body-sm">
                      <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300">
                        <span>{pendingRequest.fieldName}</span>
                        <span className="font-data-mono">{pendingRequest.dailyRate || '$120/day'}</span>
                      </div>
                      <p className="text-label-sm text-on-surface-variant mt-0.5">
                        Proposal dispatched • Waiting for farmer acceptance
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Card Action Buttons ── */}
                <div className="pt-space-md border-t border-surface-container flex flex-col gap-2">
                  {isFarmer ? (
                    /* ── Farmer Viewing Directory: Cannot Hire Colleague ── */
                    <div className="flex flex-col gap-2">
                      {farmer.uid === activeUid ? (
                        /* Self Profile */
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => openDetailModal(farmer)}
                            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-label-md text-label-md py-2.5 px-space-md rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">account_circle</span>
                            <span>{t('farmers.viewMyProfile', 'View My Profile & Reviews')}</span>
                          </button>
                          <div className="px-2.5 py-1.5 rounded-lg bg-surface-container text-label-xs text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                            <span>{t('farmers.yourSpecialistCardNotice', 'This is your public specialist profile visible to farm owners.')}</span>
                          </div>
                        </div>
                      ) : (
                        /* Colleague Profile */
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate('/messages')}
                              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md py-2 px-space-sm rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
                              <span>{t('farmers.messageColleague', 'Message Colleague')}</span>
                            </button>
                            <button
                              onClick={() => openDetailModal(farmer)}
                              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md py-2 px-space-sm rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px] text-secondary">visibility</span>
                              <span>{t('farmers.viewDetails', 'View Profile')}</span>
                            </button>
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg bg-surface-container text-label-xs text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                            <span>{t('farmers.cannotHireColleague', 'Farmers cannot hire other farmers. You can apply for work on owner fields.')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('assignments')}
                            className="text-label-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1 py-0.5 cursor-pointer"
                          >
                            <span>{t('farmers.tabWorkOpportunities', 'Browse Open Work Opportunities')}</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Owner Actions: Hire, Simulate, Message, Free, Rate ── */
                    <>
                      {/* State A: Available → Request to Work */}
                      {isAvailable && (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => openHireModal(farmer)}
                            className="w-full bg-primary text-on-primary font-label-md text-label-md py-2.5 px-space-md rounded-xl font-semibold flex items-center justify-center gap-space-xs hover:opacity-95 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>{t('farmers.hireFarmer', 'Request to Work')}</span>
                          </button>
                          {isFarmerHired(farmer.uid) && (
                            <button
                              type="button"
                              onClick={() => openRateModal(farmer, assignedField?.fieldId, assignedField?.name)}
                              className="w-full py-1.5 px-space-md rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[16px] text-amber-500">rate_review</span>
                              <span>{t('farmerRating.rateAndCommentFarmer', 'Rate & Comment on Farmer')}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* State B: Pending → Simulation Trigger (for demo) + Cancel */}
                      {isPending && pendingRequest && (
                        <div className="flex flex-col gap-1.5">
                          <button
                            disabled={actionLoadingId === pendingRequest.id}
                            onClick={() => handleSimulateAccept(pendingRequest.id, farmer.fullName, pendingRequest.fieldName)}
                            className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-2 px-space-md rounded-xl font-semibold flex items-center justify-center gap-space-xs hover:opacity-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">task_alt</span>
                            <span>
                              {actionLoadingId === pendingRequest.id ? 'Processing...' : t('farmers.simulateAccept', 'Simulate Accept (Demo)')}
                            </span>
                          </button>
                          <button
                            disabled={actionLoadingId === pendingRequest.id}
                            onClick={() => handleCancelRequest(pendingRequest.id)}
                            className="w-full bg-surface-container text-on-surface-variant hover:text-error font-label-md text-label-md py-1.5 px-space-md rounded-xl font-medium transition-colors cursor-pointer"
                          >
                            {t('farmers.cancelProposal', 'Cancel Proposal')}
                          </button>
                        </div>
                      )}

                      {/* State C: Working For You → Message, Finish & Free Farmer, Rate & Comment */}
                      {isWorking && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate('/messages')}
                              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md py-2 px-space-sm rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
                              <span>{t('farmers.messageWorker', 'Message')}</span>
                            </button>
                            <button
                              disabled={actionLoadingId === farmer.uid}
                              onClick={() => handleEndContract(farmer, assignedField)}
                              className="flex-1 px-space-md py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-600/30 font-label-md text-label-md font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                              title={t('farmers.freeFarmer', 'Finish Work & Free Farmer')}
                            >
                              <span className="material-symbols-outlined text-[16px]">task_alt</span>
                              <span>{t('farmers.freeFarmerBtn', 'Finish & Free')}</span>
                            </button>
                          </div>
                          {isFarmerHired(farmer.uid) && (
                            <button
                              type="button"
                              onClick={() => openRateModal(farmer, assignedField?.fieldId, assignedField?.name)}
                              className="w-full py-2 px-space-md rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[18px] text-amber-500">rate_review</span>
                              <span>{t('farmerRating.rateAndCommentFarmer', 'Rate & Comment on Farmer')}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* State D: Busy on Another Farm */}
                      {status === 'busy' && (
                        <div className="flex flex-col gap-1.5">
                          <button
                            disabled
                            className="w-full bg-surface-container/70 text-on-surface-variant/70 border border-outline-variant/40 font-label-md text-label-md py-2 px-space-md rounded-xl font-medium flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                            <span>{t('farmers.workingForAnotherOwner', 'Working for Another Owner')}</span>
                          </button>
                          <button
                            onClick={() => openDetailModal(farmer)}
                            className="w-full bg-surface-container text-on-surface-variant font-label-md text-label-md py-2 px-space-md rounded-xl font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            {t('farmers.viewDetails', 'View Profile & Reviews')}
                          </button>
                        </div>
                      )}

                      {/* Secondary Details Trigger */}
                      {status !== 'busy' && (
                        <button
                          onClick={() => openDetailModal(farmer)}
                          className="text-center font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors py-0.5 cursor-pointer"
                        >
                          {t('farmers.viewDetails', 'View Full Background & Reviews')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* ── Modal 1: Hire Farmer & Propose Work ── */}
      {hireModalFarmer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-md animate-fade-in"
          onClick={() => setHireModalFarmer(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-semibold text-lg">
                  {hireModalFarmer.fullName[0]}
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    {t('farmers.sendRequestTitle', 'Hire Farmer & Assign Field')}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('farmers.sendRequestSubtitle', { farmerName: hireModalFarmer.fullName })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHireModalFarmer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Error Message */}
            {requestError && (
              <div className="mt-space-md p-space-sm rounded-xl bg-error-container text-error text-body-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{requestError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitHireProposal} className="mt-space-lg space-y-space-md">
              {/* Field Selector */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.selectField', 'Select Farm & Field')} *
                </label>
                {fields.length === 0 ? (
                  <p className="text-error font-body-sm">{t('farmers.noAvailableFields')}</p>
                ) : (
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    required
                    className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="" disabled>
                      {t('farmers.selectFieldPlaceholder', 'Choose an available field...')}
                    </option>
                    {fields.map((f) => {
                      const isAssigned = Boolean(f.assignedFarmerId || (f as any).farmerId);
                      return (
                        <option key={f.fieldId || (f as any).id} value={f.fieldId || (f as any).id}>
                          {f.name} ({f.crop}) {isAssigned ? '— [Has Worker]' : '— [Available]'}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Work Responsibility / Role Preset */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.workType', 'Work Responsibility / Role')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                  {[
                    t('farmers.workTypeOptions.irrigation', 'Precision Irrigation & Water Dispatch'),
                    t('farmers.workTypeOptions.scouting', 'Disease Detection & Leaf Scouting'),
                    t('farmers.workTypeOptions.soil', 'Soil N-P-K & Telemetry Logging'),
                    t('farmers.workTypeOptions.cultivation', 'Comprehensive Field Management'),
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWorkType(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-label-sm text-left border transition-all ${
                        workType === preset
                          ? 'bg-primary-container text-on-primary border-primary font-semibold'
                          : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  placeholder={t('farmers.workTypePlaceholder')}
                  className="w-full px-space-md py-2 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Proposed Compensation */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.compensation', 'Proposed Compensation')}
                </label>
                <input
                  type="text"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder={t('farmers.compensationPlaceholder')}
                  className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Instructions & Notes */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.notesOrInstructions', 'Instructions & Field Scope')}
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('farmers.notesPlaceholder', 'Describe expected tasks, scouting schedules, and irrigation parameters...')}
                  className="w-full px-space-md py-2 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-space-sm flex items-center justify-end gap-space-sm border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setHireModalFarmer(null)}
                  className="px-space-lg py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest || fields.length === 0}
                  className="bg-primary text-on-primary font-label-md text-label-md px-space-xl py-2.5 rounded-xl font-semibold flex items-center gap-space-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
                >
                  {submittingRequest ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>{t('farmers.sending', 'Dispatching Proposal...')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>{t('farmers.sendProposal', 'Send Work Proposal')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 1.5: Apply for Field Work (Farmer → Owner) ── */}
      {applyModalField && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-md animate-fade-in"
          onClick={() => setApplyModalField(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-semibold text-lg shadow-sm">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                    {t('farmers.applyModalTitle', 'Apply for Field Work')}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('farmers.applyModalSubtitle', { fieldName: applyModalField.name })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApplyModalField(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Error Message */}
            {applyError && (
              <div className="mt-space-md p-space-sm rounded-xl bg-error-container text-error text-body-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{applyError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitApplication} className="mt-space-lg space-y-space-md">
              {/* Target Owner Account Box */}
              {(() => {
                const modalOwnerInfo = getOwnerAccountForField(applyModalField, farms);
                return (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/25">
                        <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-label-xs text-on-surface-variant font-medium">
                            {t('farmers.ownerAccount', 'Owner Account')}:
                          </span>
                          <span className="font-label-md font-bold text-primary truncate">
                            {modalOwnerInfo.name}
                          </span>
                          <span className="material-symbols-outlined text-emerald-500 text-[14px]">verified</span>
                        </div>
                        <div className="text-label-xs text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                          <span className="font-semibold text-on-surface">{modalOwnerInfo.farmName}</span>
                          <span>•</span>
                          <span>{modalOwnerInfo.location}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      {t('farmers.ownerAccount', 'Owner Account')}
                    </span>
                  </div>
                );
              })()}

              {/* Target Field Info Card */}
              <div className="p-3 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between">
                <div>
                  <div className="text-label-xs text-on-surface-variant font-medium">Target Field & Crop</div>
                  <div className="text-body-md font-semibold text-on-surface">
                    {applyModalField.name} ({applyModalField.crop})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-label-xs text-on-surface-variant font-medium">Area</div>
                  <div className="text-body-sm font-semibold text-primary">
                    {formatNumber(applyModalField.areaAcres ?? (applyModalField as any).area ?? 12)} acres
                  </div>
                </div>
              </div>

              {/* Work Role Preset / Custom */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.workType', 'Specialist Role / Responsibility')} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                  {[
                    t('farmers.workTypeOptions.irrigation', 'Precision Irrigation & Water Dispatch'),
                    t('farmers.workTypeOptions.scouting', 'Disease Detection & Leaf Scouting'),
                    t('farmers.workTypeOptions.soil', 'Soil N-P-K & Telemetry Logging'),
                    t('farmers.workTypeOptions.cultivation', 'Comprehensive Field Management'),
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setApplyWorkType(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-label-sm text-left border transition-all cursor-pointer ${
                        applyWorkType === preset
                          ? 'bg-primary-container text-on-primary border-primary font-semibold'
                          : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={applyWorkType}
                  onChange={(e) => setApplyWorkType(e.target.value)}
                  placeholder={t('farmers.workTypePlaceholder')}
                  required
                  className="w-full px-space-md py-2 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Proposed Daily Compensation */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.proposedRate', 'Your Proposed Daily Rate')} *
                </label>
                <input
                  type="text"
                  value={applyProposedRate}
                  onChange={(e) => setApplyProposedRate(e.target.value)}
                  placeholder="$120 / day"
                  required
                  className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Cover Note & Specialist Skills */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.coverNote', 'Proposal Note & Experience for Owner')}
                </label>
                <textarea
                  rows={3}
                  value={applyCoverNote}
                  onChange={(e) => setApplyCoverNote(e.target.value)}
                  placeholder={t(
                    'farmers.coverNotePlaceholder',
                    'Describe your experience with this crop, irrigation equipment familiarity, and when you can start...'
                  )}
                  className="w-full px-space-md py-2 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-space-sm flex items-center justify-end gap-space-sm border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setApplyModalField(null)}
                  className="px-space-lg py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingApplication}
                  className="bg-primary text-on-primary font-label-md text-label-md px-space-xl py-2.5 rounded-xl font-semibold flex items-center gap-space-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submittingApplication ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>{t('farmers.submittingApplication', 'Submitting Application...')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>{t('farmers.applyForJob', 'Apply for Job')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Full Farmer Details & Performance Reviews ── */}
      {detailFarmer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-md animate-fade-in"
          onClick={() => setDetailFarmer(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-space-xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center font-semibold text-xl">
                  {detailFarmer.fullName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">{detailFarmer.fullName}</h3>
                    {getFarmerStatus(detailFarmer).status === 'working_for_you' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        {t('farmers.hiredByYou', 'Hired by You')}
                      </span>
                    ) : getFarmerStatus(detailFarmer).status === 'available' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        {t('farmers.availableForHire', 'Available for Hire')}
                      </span>
                    ) : getFarmerStatus(detailFarmer).status === 'request_pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {t('farmers.requestPending', 'Pending')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-xs font-semibold bg-surface-container-high text-on-surface-variant">
                        {t('farmers.assignedToOther', 'Assigned Elsewhere')}
                      </span>
                    )}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {detailFarmer.location} • {detailFarmer.experienceYears} Years Experience
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailFarmer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Sub-Tabs: Profile & Reviews vs Work Opportunities */}
            <div className="flex items-center gap-2 border-b border-surface-container mt-space-sm">
              <button
                type="button"
                onClick={() => setDetailModalTab('profile')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 font-label-md font-semibold border-b-2 transition-all cursor-pointer ${
                  detailModalTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>{t('farmers.viewPublicProfile', 'Profile & Reviews')}</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTab('opportunities')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 font-label-md font-semibold border-b-2 transition-all cursor-pointer ${
                  detailModalTab === 'opportunities'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">work</span>
                <span>{t('farmers.workOpportunitiesTab', 'Work Opportunities')}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-data-mono bg-primary-container/40 text-primary font-bold">
                  {fields.length}
                </span>
              </button>
            </div>

            {detailModalTab === 'opportunities' ? (
              <div className="mt-space-md space-y-space-md">
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">business_center</span>
                  <div>
                    <h4 className="font-label-md font-bold text-primary">
                      {t('farmers.workOpportunitiesTab', 'Work Opportunities')}
                    </h4>
                    <p className="text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                      {t('farmers.workOpportunitiesModalDesc', 'Available jobs posted by farm owner accounts. Submit your application directly to the owner.')}
                    </p>
                  </div>
                </div>

                {fields.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant font-body-sm">
                    No open work opportunities at this moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field) => {
                      const ownerInfo = getOwnerAccountForField(field, farms);
                      const activeFarmerUid = user?.uid || 'farmer_01';
                      const fieldWorkers = getFieldAssignedWorkers(field);
                      const isAssigned = fieldWorkers.some((w) => w.farmerId === activeFarmerUid);
                      const pendingApp = myApplications.find(
                        (a) => (a.fieldId === field.fieldId || a.fieldId === (field as any).id) && a.status === 'pending'
                      );
                      const currentEmployer = employmentMap[activeFarmerUid];
                      const isEmployedByOtherOwner = currentEmployer && currentEmployer !== (field.ownerId || 'owner_demo');

                      return (
                        <div
                          key={field.fieldId || (field as any).id}
                          className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container hover:border-primary/40 transition-all flex flex-col gap-3 shadow-2xs"
                        >
                          {/* Owner Account Card Header */}
                          <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                                <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-label-sm font-bold text-on-surface truncate">
                                    {ownerInfo.name}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    <span className="material-symbols-outlined text-[10px]">verified</span>
                                    {t('farmers.ownerAccount', 'Owner Account')}
                                  </span>
                                </div>
                                <span className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                                  <span className="material-symbols-outlined text-[11px] text-primary">store</span>
                                  <span className="font-medium">{ownerInfo.farmName}</span>
                                  <span>•</span>
                                  <span>{ownerInfo.location}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Field & Job Details */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h5 className="font-label-md font-semibold text-on-surface flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[16px]">agriculture</span>
                                <span>{field.name}</span>
                              </h5>
                              <span className="text-label-xs text-on-surface-variant block mt-0.5">
                                {field.crop || 'Field Crop'} • {field.areaAcres ? `${field.areaAcres} ac` : '35 ac'} • {field.soilType || 'Loam'}
                              </span>
                            </div>

                            {/* Action Button */}
                            <div className="shrink-0">
                              {isAssigned ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                  <span>{t('farmers.alreadyAssignedHere', 'Currently Assigned')}</span>
                                </span>
                              ) : pendingApp ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  <span>Pending Review</span>
                                </span>
                              ) : isEmployedByOtherOwner ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/40 text-[11px] font-medium">
                                  <span className="material-symbols-outlined text-[14px] text-amber-500">lock</span>
                                  <span>Busy (Other Owner)</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openApplyModal(field)}
                                  className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-95 text-label-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                  <span className="material-symbols-outlined text-[16px]">send</span>
                                  <span>{t('farmers.applyForJob', 'Apply for Job')}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-space-md space-y-space-md">
              <div>
                <h4 className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">About Operator</h4>
                <p className="font-body-md text-on-surface mt-1">{detailFarmer.bio}</p>
              </div>

              <div>
                <h4 className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Contact & Rate</h4>
                <div className="flex items-center gap-space-md mt-1 font-body-sm">
                  <span className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">phone</span>
                    {detailFarmer.phone}
                  </span>
                  <span className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                    {detailFarmer.email}
                  </span>
                  <span className="font-data-mono font-semibold text-secondary">{detailFarmer.hourlyRate}</span>
                </div>
              </div>

              {/* Verified Employer Action / Rating Gate */}
              {isFarmerHired(detailFarmer.uid) ? (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">verified</span>
                    <div>
                      <span className="font-semibold text-primary text-body-sm block">
                        {t('farmerRating.verifiedEmployer', 'Verified Employer')}
                      </span>
                      <span className="text-label-xs text-on-surface-variant">
                        You have hired {detailFarmer.fullName} for field operations.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const matchedField = fields.find(
                          (f) => f.assignedFarmerId === detailFarmer.uid || (f as any).farmerId === detailFarmer.uid
                        );
                        openRateModal(detailFarmer, matchedField?.fieldId, matchedField?.name);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      <span>{t('farmerRating.rateAndCommentFarmer', 'Rate & Comment on Farmer')}</span>
                    </button>
                    {getFarmerStatus(detailFarmer).status === 'working_for_you' && (
                      <button
                        type="button"
                        disabled={actionLoadingId === detailFarmer.uid}
                        onClick={() => handleEndContract(detailFarmer)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-label-sm font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                        title={t('farmers.freeFarmer', 'Finish Work & Free Farmer')}
                      >
                        <span className="material-symbols-outlined text-[16px]">task_alt</span>
                        <span>{t('farmers.freeFarmerBtn', 'Finish & Free')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex items-center gap-2 text-on-surface-variant text-body-sm">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">lock</span>
                  <span className="text-label-sm">
                    {t('farmerRating.onlyHiredCanRate', 'Only owners who have hired this specialist can rate and comment.')}
                  </span>
                </div>
              )}

              {/* Performance Reviews & Comments */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Farm Owner Reviews & Comments ({detailReviews.length})
                  </h4>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">star</span>
                    <span>{formatNumber(detailFarmer.averageRating || 5.0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-2.5">
                  {loadingReviews ? (
                    <div className="py-4 text-center text-on-surface-variant font-body-sm">Loading reviews...</div>
                  ) : detailReviews.length === 0 ? (
                    <p className="text-on-surface-variant text-body-sm italic p-3 bg-surface-container-low rounded-xl border border-surface-container text-center">
                      No reviews recorded yet.
                    </p>
                  ) : (
                    detailReviews.map((rev) => (
                      <div key={rev.id || rev.ratingId} className="p-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1 font-body-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">{rev.ownerName || 'Farm Owner'}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-semibold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              <span>{t('farmerRating.verifiedEmployer', 'Verified Employer')}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {rev.createdAt && (
                              <span className="text-label-xs text-on-surface-variant">
                                {formatDate(rev.createdAt)}
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < rev.rating ? 'text-amber-500' : 'text-outline-variant/40'}>
                                  ★
                                </span>
                              ))}
                              <span className="ml-1 text-on-surface">{rev.rating}.0</span>
                            </div>
                          </div>
                        </div>

                        {rev.fieldName && (
                          <span className="text-label-xs text-secondary font-medium block">
                            Field: {rev.fieldName}
                          </span>
                        )}

                        {rev.feedback && (
                          <div className="mt-1 p-2.5 rounded-lg bg-surface-container-lowest text-body-sm text-on-surface flex items-start gap-2 border border-outline-variant/20 shadow-2xs">
                            <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5 shrink-0">format_quote</span>
                            <p className="italic text-on-surface leading-relaxed">{rev.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            )}

            <div className="mt-space-lg pt-space-sm border-t border-surface-container flex justify-end">
              <button
                onClick={() => setDetailFarmer(null)}
                className="px-space-lg py-2 rounded-xl bg-surface-container hover:bg-surface-container-high font-label-md text-on-surface font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Assign Specialist to Field Parcel ── */}
      {assigningField && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-md animate-fade-in"
          onClick={() => setAssigningField(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center font-semibold text-lg">
                  <span className="material-symbols-outlined text-[24px]">assignment_ind</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    {t('farmers.assignSpecialistTitle', 'Assign Specialist to {fieldName}', { fieldName: assigningField.name })}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('farmers.assignSpecialistSubtitle', 'Select a registered farmer to manage field operations')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningField(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Target Field Info Banner */}
            <div className="mt-space-md p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary block">{assigningField.name}</span>
                <span className="text-body-sm text-on-surface-variant">
                  Crop: {assigningField.crop || 'Field Crop'} • {assigningField.areaAcres ? `${assigningField.areaAcres} acres` : '35 acres'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-label-xs font-semibold bg-primary-container/30 text-primary">
                {assigningField.soilType || 'Loam'}
              </span>
            </div>

            {/* Error Message */}
            {requestError && (
              <div className="mt-space-md p-space-sm rounded-xl bg-error-container text-error text-body-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{requestError}</span>
              </div>
            )}

            {/* Form */}
            <div className="mt-space-lg space-y-space-md">
              {/* Specialist Selector */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('ownerDashboard.selectWorker', 'Select Registered Specialist')} *
                </label>
                {farmers.length === 0 ? (
                  <p className="text-error font-body-sm">{t('ownerDashboard.noRegisteredWorkers')}</p>
                ) : (
                  <select
                    value={selectedWorkerForField}
                    onChange={(e) => {
                      setSelectedWorkerForField(e.target.value);
                      const fObj = farmers.find((f) => f.uid === e.target.value);
                      if (fObj?.hourlyRate) setDailyRate(fObj.hourlyRate);
                    }}
                    required
                    className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="" disabled>
                      {t('ownerDashboard.chooseRegisteredWorker', 'Choose a registered field worker...')}
                    </option>
                    {farmers.map((farmer) => {
                      const { status } = getFarmerStatus(farmer);
                      const isAlreadyOnThisField =
                        assigningField &&
                        getFieldAssignedWorkers(assigningField).some((w) => w.farmerId === farmer.uid);
                      const isBusyWithOther = status === 'busy';
                      const isDisabled = Boolean(isAlreadyOnThisField || isBusyWithOther);

                      let statusLabel = '';
                      if (isAlreadyOnThisField) {
                        statusLabel = 'Already Assigned to this Field';
                      } else if (isBusyWithOther) {
                        statusLabel = 'Employed by Another Farm Owner • Busy';
                      } else if (status === 'working_for_you') {
                        statusLabel = 'Hired by You • Ready to Assign';
                      } else if (status === 'request_pending') {
                        statusLabel = 'Proposal Pending';
                      } else {
                        statusLabel = 'Available for Hire';
                      }

                      return (
                        <option
                          key={farmer.uid}
                          value={farmer.uid}
                          disabled={isDisabled}
                          className={isDisabled ? 'text-outline-variant opacity-60' : ''}
                        >
                          {farmer.fullName} ({farmer.hourlyRate || '$120 / day'}) — [{statusLabel}]
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Work Role Preset */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.workType', 'Work Responsibility / Role')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                  {[
                    t('farmers.workTypeOptions.irrigation', 'Precision Irrigation & Water Dispatch'),
                    t('farmers.workTypeOptions.scouting', 'Disease Detection & Leaf Scouting'),
                    t('farmers.workTypeOptions.soil', 'Soil N-P-K & Telemetry Logging'),
                    t('farmers.workTypeOptions.cultivation', 'Comprehensive Field Management'),
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWorkType(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-label-sm text-left border transition-all cursor-pointer ${
                        workType === preset
                          ? 'bg-primary-container text-on-primary border-primary font-semibold'
                          : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  placeholder={t('farmers.workTypePlaceholder', 'e.g. Irrigation Specialist')}
                  className="w-full px-space-md py-2 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Daily Compensation */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.compensation', 'Proposed Daily Compensation')}
                </label>
                <input
                  type="text"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder={t('farmers.compensationPlaceholder', '$120 / day')}
                  className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Operational Directives / Notes */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmers.notesOrInstructions', 'Operational Directives & Field Notes')}
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('farmers.notesPlaceholder', 'Describe expected tasks, scouting schedules, and irrigation parameters...')}
                  className="w-full px-space-md py-2 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-space-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setAssigningField(null)}
                  className="px-space-md py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submittingRequest || !selectedWorkerForField}
                    onClick={handleFieldSendProposal}
                    className="flex-1 sm:flex-initial px-space-md py-2.5 rounded-xl border border-secondary text-secondary hover:bg-secondary-container font-label-md text-label-md font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    title={t('farmers.sendOffer', 'Send Work Proposal')}
                  >
                    {submittingRequest ? 'Sending...' : t('farmers.sendOffer', 'Send Proposal')}
                  </button>
                  <button
                    type="button"
                    disabled={submittingRequest || !selectedWorkerForField}
                    onClick={handleFieldAssignDirect}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-space-lg py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>{submittingRequest ? 'Assigning...' : t('farmers.assignDirectly', 'Assign Directly')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 4: Rate & Comment on Hired Farmer ── */}
      {rateModalFarmer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-md animate-fade-in"
          onClick={() => setRateModalFarmer(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-lg">
                  <span className="material-symbols-outlined text-[22px] text-amber-500">rate_review</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    {t('farmerRating.rateAndCommentFarmer', 'Rate & Comment on Farmer')}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {rateModalFarmer.farmer.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRateModalFarmer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Error Banner */}
            {rateError && (
              <div className="mt-space-md p-space-sm rounded-xl bg-error-container text-error text-body-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{rateError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRating} className="mt-space-lg space-y-space-md">
              {/* Field Selector */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmerRating.associatedField', 'Associated Field Parcel')} *
                </label>
                <select
                  value={rateSelectedFieldId}
                  onChange={(e) => setRateSelectedFieldId(e.target.value)}
                  className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {fields.map((f) => (
                    <option key={f.fieldId || (f as any).id} value={f.fieldId || (f as any).id}>
                      {f.name} ({f.crop})
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-1">
                  {t('farmerRating.ratingScore', 'Performance Rating')} *
                </label>
                <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-surface-container">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRateScore(star)}
                        onMouseEnter={() => setRateHover(star)}
                        onMouseLeave={() => setRateHover(0)}
                        className="text-2xl p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                      >
                        {star <= (rateHover || rateScore) ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                  <span className="font-semibold text-body-md text-primary ml-2">
                    {rateScore} / 5.0
                  </span>
                </div>
              </div>

              {/* Review Comment (Required) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-label-sm text-label-sm font-semibold text-on-surface">
                    {t('farmerRating.commentLabel', 'Review Comment')} *
                  </label>
                  <span className="text-label-xs text-secondary font-medium">Required</span>
                </div>
                <textarea
                  rows={4}
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  placeholder={t('farmerRating.commentPlaceholder', 'Describe worker responsiveness, telemetry logging accuracy, task completion quality...')}
                  required
                  className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-space-sm flex items-center justify-end gap-space-sm border-t border-surface-container">
                <button
                  type="button"
                  disabled={isSubmittingRating}
                  onClick={() => setRateModalFarmer(null)}
                  className="px-space-lg py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRating || !rateComment.trim()}
                  className="bg-primary text-on-primary font-label-md text-label-md px-space-xl py-2.5 rounded-xl font-semibold flex items-center gap-space-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingRating ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>{t('farmerRating.submittingRating', 'Submitting Review...')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>{t('farmerRating.rateAndComment', 'Submit Rating & Comment')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 px-space-lg py-space-md rounded-xl shadow-2xl flex items-center gap-space-sm z-50 font-body-md text-body-md animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-error text-on-error'
              : toastMessage.type === 'info'
              ? 'bg-surface-container-highest text-on-surface'
              : 'bg-primary text-on-primary'
          }`}
        >
          <span className="material-symbols-outlined text-secondary text-[22px]">
            {toastMessage.type === 'error' ? 'error' : toastMessage.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};

export default Farmers;
