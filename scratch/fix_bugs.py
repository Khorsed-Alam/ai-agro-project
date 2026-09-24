import os

# 1. Update ecosystem.ts
eco_p = r'd:\AgroAI\frontend\src\services\ecosystem.ts'
with open(eco_p, 'r', encoding='utf-8') as f:
    c = f.read()

# Filter out deleted fields in getOwnerFields
old_get_owner = """      snap.forEach((d) => {
        const data = d.data() as any;
        const fId = data.farmId || data.fieldId || d.id;"""

new_get_owner = """      snap.forEach((d) => {
        const data = d.data() as any;
        if (data.deleted === true) return;
        const fId = data.fieldId || data.id || d.id;"""

c = c.replace(old_get_owner, new_get_owner)

# Filter out deleted fields in getFarmerAssignedFields
old_farmer_fields = """      snap1.forEach((d) => {
        const data = d.data() as any;
        const fId = data.farmId || data.fieldId || d.id;"""

new_farmer_fields = """      snap1.forEach((d) => {
        const data = d.data() as any;
        if (data.deleted === true) return;
        const fId = data.fieldId || data.id || d.id;"""

c = c.replace(old_farmer_fields, new_farmer_fields)

# Update unassignFarmerFromField to fallback to assigned fields if activeAssignment is null
old_unassign = """export async function unassignFarmerFromField(farmerId: string, farmerName: string): Promise<{ success: boolean; error?: string }> {
  const activeAssignment = await getFarmerActiveAssignment(farmerId);
  if (!activeAssignment) {
    return { success: false, error: 'No active assignment found.' };
  }"""

new_unassign = """export async function unassignFarmerFromField(farmerId: string, farmerName: string): Promise<{ success: boolean; error?: string }> {
  let activeAssignment = await getFarmerActiveAssignment(farmerId);
  
  if (!activeAssignment) {
    const assignedFields = await getFarmerAssignedFields(farmerId);
    if (assignedFields.length > 0) {
      const f = assignedFields[0];
      activeAssignment = {
        id: f.fieldId || (f as any).id,
        ownerId: f.ownerId || 'owner_demo',
        farmerId: farmerId,
        farmerName: farmerName,
        farmId: f.farmId || 'farm_salinas_01',
        farmName: 'My Farm',
        fieldId: f.fieldId || (f as any).id,
        fieldName: f.name,
        status: 'active',
        assignedAt: new Date().toISOString()
      };
    }
  }

  if (!activeAssignment) {
    return { success: false, error: 'No active assignment found.' };
  }"""

c = c.replace(old_unassign, new_unassign)

# Update deleteField to perform deleteDoc and mark deleted
old_delete_field = """export async function deleteField(fieldId: string): Promise<boolean> {
  // Remove from memory
  const idx = FALLBACK_FIELDS.findIndex(
    (f) => f.fieldId === fieldId || (f as any).id === fieldId
  );
  if (idx !== -1) FALLBACK_FIELDS.splice(idx, 1);
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      // Find document
      const directRef = doc(db, 'fields', fieldId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        await setDoc(directRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        return true;
      }
      // Try query
      const q = query(collection(db, 'fields'), where('fieldId', '==', fieldId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await setDoc(snap.docs[0].ref, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        return true;
      }
    } catch (err) {
      console.error('deleteField error:', err);
    }
  }
  return true;
}"""

new_delete_field = """export async function deleteField(fieldId: string): Promise<boolean> {
  // Remove from memory
  const idx = FALLBACK_FIELDS.findIndex(
    (f) => f.fieldId === fieldId || (f as any).id === fieldId || (f as any).docId === fieldId
  );
  if (idx !== -1) FALLBACK_FIELDS.splice(idx, 1);
  syncEcosystemCache();

  if (db) {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const directRef = doc(db, 'fields', fieldId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        try {
          await deleteDoc(directRef);
        } catch {
          await setDoc(directRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        }
      }

      const q = query(collection(db, 'fields'), where('fieldId', '==', fieldId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        try {
          await deleteDoc(d.ref);
        } catch {
          await setDoc(d.ref, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        }
      }
    } catch (err) {
      console.error('deleteField error:', err);
    }
  }

  notifyEcosystemChange();
  return true;
}"""

c = c.replace(old_delete_field, new_delete_field)

with open(eco_p, 'w', encoding='utf-8') as f:
    f.write(c)

print("ecosystem.ts bugfixes applied.")
