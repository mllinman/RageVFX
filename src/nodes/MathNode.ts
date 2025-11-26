/**
 * MathNode - Mathematical operations
 */

import { Node, DataType } from '../core/Node';

export class MathNode extends Node {
  constructor(id: string) {
    super(id, 'Math', 'Math');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Perform mathematical operations';
    
    this.addInput('a', 'A', DataType.NUMBER);
    this.addInput('b', 'B', DataType.NUMBER);
    this.addOutput('result', 'Result', DataType.NUMBER);
    
    this.setParameter('operation', 'add');
    this.setParameter('defaultA', 0);
    this.setParameter('defaultB', 0);
    this.setParameter('clampMin', null);
    this.setParameter('clampMax', null);
  }

  async process(): Promise<void> {
    const aInput = this.inputs.get('a');
    const bInput = this.inputs.get('b');
    const output = this.outputs.get('result');
    
    if (!output) return;
    
    const operation = this.getParameter('operation');
    const a = aInput?.value ?? this.getParameter('defaultA');
    const b = bInput?.value ?? this.getParameter('defaultB');
    
    let result: number;
    
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        result = b !== 0 ? a / b : 0;
        break;
      case 'power':
        result = Math.pow(a, b);
        break;
      case 'modulo':
        result = b !== 0 ? a % b : 0;
        break;
      case 'min':
        result = Math.min(a, b);
        break;
      case 'max':
        result = Math.max(a, b);
        break;
      case 'abs':
        result = Math.abs(a);
        break;
      case 'floor':
        result = Math.floor(a);
        break;
      case 'ceil':
        result = Math.ceil(a);
        break;
      case 'round':
        result = Math.round(a);
        break;
      case 'sin':
        result = Math.sin(a);
        break;
      case 'cos':
        result = Math.cos(a);
        break;
      case 'tan':
        result = Math.tan(a);
        break;
      case 'asin':
        result = Math.asin(Math.max(-1, Math.min(1, a)));
        break;
      case 'acos':
        result = Math.acos(Math.max(-1, Math.min(1, a)));
        break;
      case 'atan':
        result = Math.atan(a);
        break;
      case 'atan2':
        result = Math.atan2(a, b);
        break;
      case 'sqrt':
        result = Math.sqrt(Math.abs(a));
        break;
      case 'log':
        result = a > 0 ? Math.log(a) : 0;
        break;
      case 'log10':
        result = a > 0 ? Math.log10(a) : 0;
        break;
      case 'exp':
        result = Math.exp(a);
        break;
      case 'lerp': {
        const t = this.getParameter('defaultB');
        result = a + (b - a) * t;
        break;
      }
      case 'smoothstep': {
        const x = Math.max(0, Math.min(1, (a - 0) / (b - 0)));
        result = x * x * (3 - 2 * x);
        break;
      }
      default:
        result = a;
    }
    
    // Apply clamping if set
    const clampMin = this.getParameter('clampMin');
    const clampMax = this.getParameter('clampMax');
    
    if (clampMin !== null) {
      result = Math.max(clampMin, result);
    }
    if (clampMax !== null) {
      result = Math.min(clampMax, result);
    }
    
    output.value = result;
  }
}
