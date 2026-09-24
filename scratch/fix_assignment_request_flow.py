import os

p = r'd:\AgroAI\frontend\src\pages\OwnerDashboard.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Make sure createAssignmentRequest is imported
if 'createAssignmentRequest' not in c:
    c = c.replace(
        "import {\n  getFarms,\n  createFarm,\n",
        "import {\n  getFarms,\n  createFarm,\n  createAssignmentRequest,\n"
    )

old_assign_fn = """      const success = await assignFarmerToField(
        targetId,
        workerId,
        workerName,
        user?.uid || 'owner_demo'
      );

      if (success) {
        setAssignSuccess('Worker assigned successfully');
        notifyEcosystemChange();
        await loadEcosystemData();
        setTimeout(() => {
          setIsAssigning(false);
          setAssignSuccess('');
          setSelectedFieldForAssign(null);
        }, 1000);
      } else {"""

new_assign_fn = """      if (isUnassigning) {
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
      return;"""

c = c.replace(old_assign_fn, new_assign_fn)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("OwnerDashboard.tsx updated with assignment request flow.")
