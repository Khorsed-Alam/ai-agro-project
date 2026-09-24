import os

p = r'd:\AgroAI\frontend\src\pages\OwnerDashboard.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

bad_block = """      if (res.success) {
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
      return;
        setIsAssigning(false);
        setAssignError('Failed to assign worker. Please check connection and try again.');
      }
    } catch (err: any) {"""

good_block = """      if (res.success) {
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
    } catch (err: any) {"""

c = c.replace(bad_block, good_block)

# Remove extra closing tag at bottom if present
c = c.replace('</div>\n  );\n};\n;\n', '</div>\n  );\n};\n')

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("OwnerDashboard.tsx syntax fixed.")
