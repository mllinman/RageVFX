/**
 * SwitchNode - Conditional switching between inputs
 */

import { Node, DataType } from '../core/Node';

export class SwitchNode extends Node {
  constructor(id: string) {
    super(id, 'Switch', 'Switch');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Switch between inputs based on condition';
    
    this.addInput('input0', 'Input 0', DataType.ANY);
    this.addInput('input1', 'Input 1', DataType.ANY);
    this.addInput('input2', 'Input 2', DataType.ANY);
    this.addInput('input3', 'Input 3', DataType.ANY);
    this.addInput('selector', 'Selector', DataType.NUMBER);
    this.addOutput('output', 'Output', DataType.ANY);
    
    this.setParameter('defaultIndex', 0);
    this.setParameter('mode', 'index'); // index, boolean
  }

  async process(): Promise<void> {
    const output = this.outputs.get('output');
    if (!output) return;
    
    const mode = this.getParameter('mode');
    const selectorInput = this.inputs.get('selector');
    const defaultIndex = this.getParameter('defaultIndex');
    
    let selectedIndex: number;
    
    if (mode === 'boolean') {
      // Boolean mode: selector > 0.5 means input1, else input0
      const selectorValue = selectorInput?.value ?? 0;
      selectedIndex = selectorValue > 0.5 ? 1 : 0;
    } else {
      // Index mode: use selector value as index
      selectedIndex = Math.floor(selectorInput?.value ?? defaultIndex);
    }
    
    // Clamp to valid range
    selectedIndex = Math.max(0, Math.min(3, selectedIndex));
    
    // Get the selected input
    const inputKey = `input${selectedIndex}`;
    const selectedInput = this.inputs.get(inputKey);
    
    output.value = selectedInput?.value ?? null;
  }
}
