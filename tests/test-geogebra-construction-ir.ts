import assert from 'node:assert/strict';
import {parseV3FoldCommand} from '../src/modules/geogebra/construction-ir.js';
import {AI_CONSTRUCTION_TOOLS} from '../src/modules/geogebra/tools.js';
const ir = parseV3FoldCommand('Tạo tấm bìa hình vuông 8 dm, tạo đáy ABCD 3 dm, cắt bốn góc 1 dm, tạo bốn đường gấp và thanh trượt t.');
assert.equal(ir.validation.valid, true); assert.equal(ir.parameters.length, 2); assert.equal(ir.objects.filter((o) => o.semanticRole === 'CUT_PIECE').length, 4); assert.equal(ir.objects.filter((o) => o.semanticRole === 'HINGE').length, 4); assert.ok(ir.objects.every((o) => o.systemId !== o.displayLabel || !o.displayLabel)); assert.equal(AI_CONSTRUCTION_TOOLS.length, 11); assert.ok(AI_CONSTRUCTION_TOOLS.some((tool) => tool.id === 'CREATE_REGULAR_FRUSTUM_NET')); console.log('CONSTRUCTION_IR_QA=PASS'); console.log('AI_TOOL_BUILDER_QA=PASS'); console.log('SYSTEM_ID_DISPLAY_LABEL_SEPARATION_QA=PASS');
