import os

p = r'd:\AgroAI\frontend\src\pages\OwnerDashboard.tsx'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useNavigate import
if 'useNavigate' not in content:
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';"
    )
    content = content.replace(
        "const { user, userProfile } = useAuth();",
        "const { user, userProfile } = useAuth();\n  const navigate = useNavigate();"
    )

# Add deleteField import and createAssignmentRequest import
if 'deleteField' not in content:
    content = content.replace(
        "import {\n  getFarms,\n  createFarm,",
        "import {\n  getFarms,\n  createFarm,\n  deleteField,\n  deleteFarm,\n  createAssignmentRequest,"
    )

# Add Delete Field modal state
if 'fieldToDelete' not in content:
    content = content.replace(
        "  const [selectedFieldForAssign, setSelectedFieldForAssign] = useState<Field | null>(null);",
        "  const [selectedFieldForAssign, setSelectedFieldForAssign] = useState<Field | null>(null);\n  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);\n  const [isDeletingField, setIsDeletingField] = useState(false);"
    )

# Add handleDeleteFieldConfirm method
if 'handleDeleteFieldConfirm' not in content:
    content = content.replace(
        "  const openAssignWorkerModal = (f: Field) => {",
        """  const handleDeleteFieldConfirm = async () => {
    if (!fieldToDelete) return;
    setIsDeletingField(true);
    await deleteField(fieldToDelete.fieldId || (fieldToDelete as any).id);
    setIsDeletingField(false);
    setFieldToDelete(null);
    notifyEcosystemChange();
    loadEcosystemData();
  };

  const openAssignWorkerModal = (f: Field) => {"""
    )

# Update handleAssignFarmer to create assignment request instead of silent assignment
if 'createAssignmentRequest' in content and 'handleAssignFarmer' in content:
    old_assign_fn = """  const handleAssignFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldForAssign) return;

    setIsAssigning(true);
    setAssignError('');
    setAssignSuccess('');

    try {
      const fieldId = selectedFieldForAssign.fieldId || (selectedFieldForAssign as any).id;
      const targetWorkerId = selectedFarmerId === '__unassign__' ? null : selectedFarmerId;
      const workerObj = farmers.find((w) => w.uid === targetWorkerId);
      const workerName = workerObj ? workerObj.fullName : null;

      const success = await assignFarmerToField(fieldId, targetWorkerId, workerName, user?.uid || 'owner_demo');

      if (success) {
        setAssignSuccess(
          targetWorkerId
            ? `Successfully assigned ${workerName} to field ${selectedFieldForAssign.name}.`
            : `Unassigned worker from field ${selectedFieldForAssign.name}.`
        );
        notifyEcosystemChange();
        setTimeout(() => {
          setSelectedFieldForAssign(null);
          loadEcosystemData();
        }, 1200);
      } else {
        setAssignError('Failed to update field assignment in database.');
      }
    } catch (err: any) {
      setAssignError(err?.message || 'Failed to update field assignment.');
    } finally {
      setIsAssigning(false);
    }
  };"""

    new_assign_fn = """  const handleAssignFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldForAssign) return;

    setIsAssigning(true);
    setAssignError('');
    setAssignSuccess('');

    try {
      const fieldId = selectedFieldForAssign.fieldId || (selectedFieldForAssign as any).id;
      if (selectedFarmerId === '__unassign__') {
        const success = await assignFarmerToField(fieldId, null, null, user?.uid || 'owner_demo');
        if (success) {
          setAssignSuccess(`Unassigned worker from field ${selectedFieldForAssign.name}.`);
          notifyEcosystemChange();
          setTimeout(() => {
            setSelectedFieldForAssign(null);
            loadEcosystemData();
          }, 1200);
        }
        return;
      }

      const farmerObj = farmers.find((w) => w.uid === selectedFarmerId);
      if (!farmerObj) {
        setAssignError('Please select a farmer.');
        return;
      }

      // Send formal assignment request
      const farmObj = farms.find((fm) => fm.farmId === selectedFieldForAssign.farmId) || farms[0];
      const res = await createAssignmentRequest({
        ownerId: user?.uid || 'owner_demo',
        ownerName: userProfile?.fullName || 'Farm Owner',
        farmerId: farmerObj.uid,
        farmerName: farmerObj.fullName,
        farmId: selectedFieldForAssign.farmId || (farmObj?.farmId || 'farm_salinas_01'),
        farmName: farmObj?.name || 'My Farm',
        fieldId: fieldId,
        fieldName: selectedFieldForAssign.name,
      });

      if (res.success) {
        setAssignSuccess(`Assignment request sent to ${farmerObj.fullName}. Status is now Pending until farmer approves.`);
        notifyEcosystemChange();
        setTimeout(() => {
          setSelectedFieldForAssign(null);
          loadEcosystemData();
        }, 1500);
      } else {
        setAssignError(res.error || 'Failed to send assignment request.');
      }
    } catch (err: any) {
      setAssignError(err?.message || 'Failed to process assignment.');
    } finally {
      setIsAssigning(false);
    }
  };"""
    content = content.replace(old_assign_fn, new_assign_fn)

# Add Delete button to Field Cards
if 'openEditFieldWizard(f);' in content and 'title="Edit Field Boundaries & Details"' in content:
    content = content.replace(
        """                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Edit</span>
                      </button>""",
        """                        <span className="material-symbols-outlined text-[15px]">edit</span>
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
                      </button>"""
    )

# Update Registered Farmers Directory items with Chat button and Available/Assigned status
old_farmers_dir = """            <div className="flex flex-col space-y-2.5">
              {farmers.map((farmer) => {
                const assignedCount = fields.filter((f) => f.assignedFarmerId === farmer.uid || (f as any).farmerId === farmer.uid).length;
                return (
                  <div
                    key={farmer.uid}
                    className="bg-surface p-space-sm px-space-md rounded-lg border border-outline-variant/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs">
                        {farmer.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-xs font-semibold text-on-surface">{farmer.fullName}</span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant">{farmer.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[11px] font-semibold">
                        {assignedCount} Assigned Field{assignedCount !== 1 ? 's' : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary text-[11px] font-semibold">
                        Farmer
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>"""

new_farmers_dir = """            <div className="flex flex-col space-y-2.5">
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
            </div>"""

content = content.replace(old_farmers_dir, new_farmers_dir)

# Append Delete Field Modal at end before final closing div
delete_modal_jsx = """
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
};"""

content = content.replace("    </div>\n  );\n};", delete_modal_jsx)

with open(p, 'w', encoding='utf-8') as f:
    f.write(content)

print("OwnerDashboard.tsx updated successfully.")
