# Chain Context: CD_SISTEM_FOKUS Fix

## Task
Fix `diagram/Ai/Class/CD_SISTEM_FOKUS.drawio` to match reference image style.

## Status
- [x] Analysis complete
- [ ] Nakamura: rewrite edge section

## Root Cause (Tanaka analysis)
Reference image (accounting system CD) uses:
1. Plain lines — NO arrowheads, NO composition diamonds
2. Cardinality labels (1, M) near box ends
3. Blue header (`#DAE8FC` / `#6C8EBF`)
4. White body

Current file has:
- `endArrow=open` on association edges → must become `endArrow=none`
- `startArrow=diamondThin;startFill=1` on composition edges → remove, use plain line
- XML comments inside `<root>` → remove for safety

## Fix Spec for Nakamura
File: `diagram/Ai/Class/CD_SISTEM_FOKUS.drawio`

Edge section changes (lines 152–194):
- ALL edges → `endArrow=none;startArrow=none;edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#000000;strokeWidth=1;fontSize=10;fontColor=#000000;`
- Keep: exitX/Y, entryX/Y, waypoints on rel_user_task
- Keep: all cardinality label cells (edgeLabel children)
- Keep: `assignee` italic label on rel_user_task
- Remove: all XML comments (`<!-- ... -->`)
- Composition edges (rel_proj_health, rel_proj_task, rel_task_evid) → same plain style

DO NOT TOUCH: class cells (cls_*), attribute/method child cells, separator cells, caption.
