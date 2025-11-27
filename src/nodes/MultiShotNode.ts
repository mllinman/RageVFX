/**
 * MultiShotNode - Nuke-style graph scope variables for batch compositing
 * 
 * Rivals Nuke's multishot compositing capabilities with graph scope variables
 * that allow batch processing across multiple shots with shared parameters.
 */

import { Node, DataType } from '../core/Node';

// Shot definition with all metadata
interface ShotData {
  id: string;
  name: string;
  version: number;
  variant: string;
  frameRange: { start: number; end: number };
  status: 'pending' | 'processing' | 'complete' | 'error';
  variables: Map<string, ScopeVariable>;
  metadata: Record<string, string>;
}

// Graph scope variable with expression support
interface ScopeVariable {
  name: string;
  value: number | string | boolean;
  type: 'number' | 'string' | 'boolean' | 'expression';
  expression?: string;
  linkedShots: string[];
  animatable: boolean;
}

// Template for creating new shots
interface ShotTemplate {
  name: string;
  baseVariables: ScopeVariable[];
  nodeConfiguration: string; // Serialized node graph subset
}

export class MultiShotNode extends Node {
  private shots: Map<string, ShotData> = new Map();
  private globalVariables: Map<string, ScopeVariable> = new Map();
  private templates: Map<string, ShotTemplate> = new Map();
  private currentShotId: string = '';
  private expressionParser: ExpressionParser;

  constructor(id: string) {
    super(id, 'MultiShot', 'Multi-Shot Compositing');
    this.metadata.category = 'Pipeline';
    this.metadata.description = 'Nuke-style multishot workflow with graph scope variables';
    this.metadata.version = '3.0.0';

    // Inputs
    this.addInput('image', 'Image Input', DataType.IMAGE);
    this.addInput('shotList', 'Shot List', DataType.ANY);
    this.addInput('variableOverrides', 'Variable Overrides', DataType.ANY);

    // Outputs
    this.addOutput('processedImage', 'Processed Image', DataType.IMAGE);
    this.addOutput('shotData', 'Shot Data', DataType.ANY);
    this.addOutput('variableValues', 'Variable Values', DataType.ANY);
    this.addOutput('batchProgress', 'Batch Progress', DataType.NUMBER);

    // Parameters
    this.setParameter('mode', 'single'); // 'single', 'batch', 'interactive'
    this.setParameter('currentShot', '');
    this.setParameter('autoPropagate', true); // Propagate variable changes to linked shots
    this.setParameter('versionIncrement', 'minor'); // 'major', 'minor', 'revision'
    this.setParameter('templateName', '');
    this.setParameter('batchSize', 4); // Parallel shot processing

    // Initialize expression parser
    this.expressionParser = new ExpressionParser();

    // Create default global variables
    this.initializeGlobalVariables();
  }

  private initializeGlobalVariables(): void {
    // Standard production variables
    this.globalVariables.set('frame', {
      name: 'frame',
      value: 1,
      type: 'number',
      linkedShots: [],
      animatable: true
    });

    this.globalVariables.set('fps', {
      name: 'fps',
      value: 24,
      type: 'number',
      linkedShots: [],
      animatable: false
    });

    this.globalVariables.set('width', {
      name: 'width',
      value: 1920,
      type: 'number',
      linkedShots: [],
      animatable: false
    });

    this.globalVariables.set('height', {
      name: 'height',
      value: 1080,
      type: 'number',
      linkedShots: [],
      animatable: false
    });

    this.globalVariables.set('shotName', {
      name: 'shotName',
      value: '',
      type: 'string',
      linkedShots: [],
      animatable: false
    });

    this.globalVariables.set('shotVersion', {
      name: 'shotVersion',
      value: 1,
      type: 'number',
      linkedShots: [],
      animatable: false
    });
  }

  /**
   * Add a new shot to the multishot workflow
   */
  addShot(name: string, frameStart: number, frameEnd: number, variant: string = 'main'): string {
    const shotId = `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shot: ShotData = {
      id: shotId,
      name,
      version: 1,
      variant,
      frameRange: { start: frameStart, end: frameEnd },
      status: 'pending',
      variables: new Map(),
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };

    // Copy global variables to shot
    this.globalVariables.forEach((variable, key) => {
      shot.variables.set(key, { ...variable, linkedShots: [shotId] });
    });

    this.shots.set(shotId, shot);
    return shotId;
  }

  /**
   * Create a shot from a template
   */
  createShotFromTemplate(templateName: string, shotName: string, frameStart: number, frameEnd: number): string | null {
    const template = this.templates.get(templateName);
    if (!template) {
      console.error(`Template not found: ${templateName}`);
      return null;
    }

    const shotId = this.addShot(shotName, frameStart, frameEnd);
    const shot = this.shots.get(shotId);
    if (!shot) return null;

    // Apply template variables
    template.baseVariables.forEach(variable => {
      shot.variables.set(variable.name, { ...variable });
    });

    return shotId;
  }

  /**
   * Save current shot configuration as a template
   */
  saveAsTemplate(templateName: string, shotId: string): boolean {
    const shot = this.shots.get(shotId);
    if (!shot) return false;

    const template: ShotTemplate = {
      name: templateName,
      baseVariables: Array.from(shot.variables.values()),
      nodeConfiguration: '' // Would serialize connected node graph
    };

    this.templates.set(templateName, template);
    return true;
  }

  /**
   * Set a graph scope variable
   */
  setVariable(name: string, value: number | string | boolean, scope: 'global' | 'shot' = 'global'): void {
    const variable: ScopeVariable = {
      name,
      value,
      type: typeof value as 'number' | 'string' | 'boolean',
      linkedShots: [],
      animatable: typeof value === 'number'
    };

    if (scope === 'global') {
      this.globalVariables.set(name, variable);
      
      // Propagate to all shots if auto-propagate is enabled
      if (this.getParameter('autoPropagate')) {
        this.shots.forEach(shot => {
          shot.variables.set(name, { ...variable, linkedShots: [shot.id] });
        });
      }
    } else if (this.currentShotId) {
      const shot = this.shots.get(this.currentShotId);
      if (shot) {
        shot.variables.set(name, variable);
      }
    }

    this.markDirty();
  }

  /**
   * Set an expression-based variable
   */
  setExpression(name: string, expression: string, scope: 'global' | 'shot' = 'global'): void {
    const variable: ScopeVariable = {
      name,
      value: 0,
      type: 'expression',
      expression,
      linkedShots: [],
      animatable: true
    };

    if (scope === 'global') {
      this.globalVariables.set(name, variable);
    } else if (this.currentShotId) {
      const shot = this.shots.get(this.currentShotId);
      if (shot) {
        shot.variables.set(name, variable);
      }
    }

    this.markDirty();
  }

  /**
   * Link shots to propagate variable changes
   */
  linkShots(sourceShot: string, targetShots: string[], variableNames: string[]): void {
    const source = this.shots.get(sourceShot);
    if (!source) return;

    variableNames.forEach(varName => {
      const variable = source.variables.get(varName);
      if (variable) {
        variable.linkedShots = [...new Set([...variable.linkedShots, ...targetShots])];
      }
    });
  }

  /**
   * Evaluate an expression with current variable context
   */
  private evaluateExpression(expression: string, shotId?: string): number {
    const variables: Record<string, number | string | boolean> = {};
    
    // Add global variables
    this.globalVariables.forEach((v, k) => {
      if (v.type !== 'expression') {
        variables[k] = v.value;
      }
    });

    // Add shot-specific variables if available
    if (shotId) {
      const shot = this.shots.get(shotId);
      if (shot) {
        shot.variables.forEach((v, k) => {
          if (v.type !== 'expression') {
            variables[k] = v.value;
          }
        });
        // Add shot-specific built-ins
        variables['shotName'] = shot.name;
        variables['shotVersion'] = shot.version;
        variables['frameStart'] = shot.frameRange.start;
        variables['frameEnd'] = shot.frameRange.end;
        variables['frameDuration'] = shot.frameRange.end - shot.frameRange.start + 1;
      }
    }

    return this.expressionParser.evaluate(expression, variables);
  }

  /**
   * Batch update a variable across multiple shots
   */
  batchUpdateVariable(variableName: string, updateFn: (shot: ShotData, currentValue: number | string | boolean) => number | string | boolean): void {
    this.shots.forEach(shot => {
      const variable = shot.variables.get(variableName);
      if (variable) {
        const newValue = updateFn(shot, variable.value);
        variable.value = newValue;
      }
    });
    this.markDirty();
  }

  /**
   * Increment version for a shot
   */
  incrementVersion(shotId: string): void {
    const shot = this.shots.get(shotId);
    if (!shot) return;

    const increment = this.getParameter('versionIncrement');
    switch (increment) {
      case 'major':
        shot.version = Math.floor(shot.version) + 1;
        break;
      case 'minor':
        shot.version = parseFloat((shot.version + 0.1).toFixed(1));
        break;
      case 'revision':
        shot.version = parseFloat((shot.version + 0.01).toFixed(2));
        break;
    }

    shot.metadata.modifiedAt = new Date().toISOString();
    this.markDirty();
  }

  /**
   * Set current shot for interactive mode
   */
  setCurrentShot(shotId: string): void {
    if (this.shots.has(shotId)) {
      this.currentShotId = shotId;
      this.setParameter('currentShot', shotId);
      
      // Update global variables to reflect current shot
      const shot = this.shots.get(shotId)!;
      this.globalVariables.set('shotName', {
        ...this.globalVariables.get('shotName')!,
        value: shot.name
      });
      this.globalVariables.set('shotVersion', {
        ...this.globalVariables.get('shotVersion')!,
        value: shot.version
      });
      
      this.markDirty();
    }
  }

  /**
   * Get all shots matching a filter
   */
  filterShots(filter: Partial<Pick<ShotData, 'status' | 'variant'>>): ShotData[] {
    const filtered: ShotData[] = [];
    this.shots.forEach(shot => {
      let matches = true;
      if (filter.status && shot.status !== filter.status) matches = false;
      if (filter.variant && shot.variant !== filter.variant) matches = false;
      if (matches) filtered.push(shot);
    });
    return filtered;
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const mode = this.getParameter('mode') as string;

    if (!imageInput?.value) {
      // No image input, just output shot data and variables
      const variableOutput: Record<string, number | string | boolean> = {};
      this.globalVariables.forEach((v, k) => {
        if (v.type === 'expression' && v.expression) {
          variableOutput[k] = this.evaluateExpression(v.expression, this.currentShotId);
        } else {
          variableOutput[k] = v.value;
        }
      });

      const variableValuesOutput = this.outputs.get('variableValues');
      if (variableValuesOutput) {
        variableValuesOutput.value = variableOutput;
      }

      const shotDataOutput = this.outputs.get('shotData');
      if (shotDataOutput) {
        shotDataOutput.value = Array.from(this.shots.values());
      }

      return;
    }

    const imageData = imageInput.value;

    switch (mode) {
      case 'single':
        await this.processSingleShot(imageData);
        break;
      case 'batch':
        await this.processBatch(imageData);
        break;
      case 'interactive':
        await this.processInteractive(imageData);
        break;
    }

    this.dirty = false;
  }

  private async processSingleShot(imageData: ImageData): Promise<void> {
    const currentShot = this.shots.get(this.currentShotId);
    if (!currentShot) {
      // Pass through image if no shot selected
      const output = this.outputs.get('processedImage');
      if (output) {
        output.value = imageData;
      }
      return;
    }

    // Evaluate all expressions for current shot
    currentShot.variables.forEach((variable, _key) => {
      if (variable.type === 'expression' && variable.expression) {
        variable.value = this.evaluateExpression(variable.expression, currentShot.id);
      }
    });

    // Process image with shot variables
    const processedImage = await this.applyVariablesToImage(imageData, currentShot);
    
    const output = this.outputs.get('processedImage');
    if (output) {
      output.value = processedImage;
    }

    currentShot.status = 'complete';
  }

  private async processBatch(imageData: ImageData): Promise<void> {
    const batchSize = this.getParameter('batchSize') as number;
    const pendingShots = this.filterShots({ status: 'pending' });
    
    let processedCount = 0;
    const totalShots = pendingShots.length;

    // Process shots in parallel batches
    for (let i = 0; i < pendingShots.length; i += batchSize) {
      const batch = pendingShots.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (shot) => {
        shot.status = 'processing';
        
        try {
          // Evaluate expressions
          shot.variables.forEach((variable, _key) => {
            if (variable.type === 'expression' && variable.expression) {
              variable.value = this.evaluateExpression(variable.expression, shot.id);
            }
          });

          await this.applyVariablesToImage(imageData, shot);
          shot.status = 'complete';
        } catch {
          shot.status = 'error';
        }

        processedCount++;
        const progressOutput = this.outputs.get('batchProgress');
        if (progressOutput) {
          progressOutput.value = processedCount / totalShots;
        }
      }));
    }

    const output = this.outputs.get('processedImage');
    if (output) {
      output.value = imageData; // Output last processed
    }
  }

  private async processInteractive(imageData: ImageData): Promise<void> {
    // Interactive mode - process current shot and allow real-time variable updates
    await this.processSingleShot(imageData);
  }

  private async applyVariablesToImage(imageData: ImageData, shot: ShotData): Promise<ImageData> {
    // Clone image data for processing
    const processed = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Apply any shot-specific transformations based on variables
    // This is a simplified example - real implementation would apply more complex transforms

    // Example: Apply exposure adjustment if 'exposure' variable exists
    const exposureVar = shot.variables.get('exposure');
    if (exposureVar && typeof exposureVar.value === 'number') {
      const exposure = exposureVar.value;
      const multiplier = Math.pow(2, exposure);
      
      for (let i = 0; i < processed.data.length; i += 4) {
        processed.data[i] = Math.min(255, processed.data[i] * multiplier);
        processed.data[i + 1] = Math.min(255, processed.data[i + 1] * multiplier);
        processed.data[i + 2] = Math.min(255, processed.data[i + 2] * multiplier);
      }
    }

    return processed;
  }

  /**
   * Export shot list to JSON for pipeline integration
   */
  exportToJSON(): string {
    const exportData = {
      globalVariables: Array.from(this.globalVariables.entries()),
      shots: Array.from(this.shots.values()).map(shot => ({
        ...shot,
        variables: Array.from(shot.variables.entries())
      })),
      templates: Array.from(this.templates.entries())
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import shot list from JSON
   */
  importFromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      // Restore global variables
      this.globalVariables = new Map(data.globalVariables);
      
      // Restore shots
      this.shots.clear();
      data.shots.forEach((shotData: ShotData & { variables: [string, ScopeVariable][] }) => {
        const shot: ShotData = {
          ...shotData,
          variables: new Map(shotData.variables)
        };
        this.shots.set(shot.id, shot);
      });

      // Restore templates
      this.templates = new Map(data.templates);

      this.markDirty();
      return true;
    } catch {
      console.error('Failed to import shot data');
      return false;
    }
  }

  dispose(): void {
    this.shots.clear();
    this.globalVariables.clear();
    this.templates.clear();
    super.dispose();
  }
}

/**
 * Simple expression parser for graph scope variables
 */
class ExpressionParser {
  evaluate(expression: string, variables: Record<string, number | string | boolean>): number {
    // Replace variable names with values
    let parsed = expression;
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      parsed = parsed.replace(regex, String(value));
    });

    // Built-in functions
    parsed = this.applyBuiltinFunctions(parsed);

    // Evaluate the expression safely
    try {
      // Use a safe subset of math operations
      return this.safeEval(parsed);
    } catch {
      console.error(`Expression evaluation failed: ${expression}`);
      return 0;
    }
  }

  private applyBuiltinFunctions(expr: string): string {
    // sin, cos, tan
    expr = expr.replace(/sin\(([^)]+)\)/g, (_, arg) => String(Math.sin(parseFloat(arg))));
    expr = expr.replace(/cos\(([^)]+)\)/g, (_, arg) => String(Math.cos(parseFloat(arg))));
    expr = expr.replace(/tan\(([^)]+)\)/g, (_, arg) => String(Math.tan(parseFloat(arg))));
    
    // abs, floor, ceil, round
    expr = expr.replace(/abs\(([^)]+)\)/g, (_, arg) => String(Math.abs(parseFloat(arg))));
    expr = expr.replace(/floor\(([^)]+)\)/g, (_, arg) => String(Math.floor(parseFloat(arg))));
    expr = expr.replace(/ceil\(([^)]+)\)/g, (_, arg) => String(Math.ceil(parseFloat(arg))));
    expr = expr.replace(/round\(([^)]+)\)/g, (_, arg) => String(Math.round(parseFloat(arg))));
    
    // min, max
    expr = expr.replace(/min\(([^,]+),([^)]+)\)/g, (_, a, b) => String(Math.min(parseFloat(a), parseFloat(b))));
    expr = expr.replace(/max\(([^,]+),([^)]+)\)/g, (_, a, b) => String(Math.max(parseFloat(a), parseFloat(b))));
    
    // pow, sqrt
    expr = expr.replace(/pow\(([^,]+),([^)]+)\)/g, (_, a, b) => String(Math.pow(parseFloat(a), parseFloat(b))));
    expr = expr.replace(/sqrt\(([^)]+)\)/g, (_, arg) => String(Math.sqrt(parseFloat(arg))));
    
    // clamp
    expr = expr.replace(/clamp\(([^,]+),([^,]+),([^)]+)\)/g, (_, val, min, max) => 
      String(Math.max(parseFloat(min), Math.min(parseFloat(max), parseFloat(val))))
    );
    
    // lerp (linear interpolation)
    expr = expr.replace(/lerp\(([^,]+),([^,]+),([^)]+)\)/g, (_, a, b, t) => {
      const aVal = parseFloat(a);
      const bVal = parseFloat(b);
      const tVal = parseFloat(t);
      return String(aVal + (bVal - aVal) * tVal);
    });

    return expr;
  }

  private safeEval(expr: string): number {
    // Only allow numbers, operators, and parentheses
    const sanitized = expr.replace(/[^0-9+\-*/().eE\s]/g, '');
    
    // Parse and evaluate safely using a simple recursive descent parser
    return this.parseExpression(sanitized);
  }

  private parseExpression(expr: string): number {
    const tokens = this.tokenize(expr);
    let pos = 0;

    const parseAddSub = (): number => {
      let left = parseMulDiv();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseMulDiv();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };

    const parseMulDiv = (): number => {
      let left = parseUnary();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const right = parseUnary();
        left = op === '*' ? left * right : left / right;
      }
      return left;
    };

    const parseUnary = (): number => {
      if (tokens[pos] === '-') {
        pos++;
        return -parsePrimary();
      }
      if (tokens[pos] === '+') {
        pos++;
        return parsePrimary();
      }
      return parsePrimary();
    };

    const parsePrimary = (): number => {
      if (tokens[pos] === '(') {
        pos++;
        const result = parseAddSub();
        pos++; // skip ')'
        return result;
      }
      return parseFloat(tokens[pos++]);
    };

    return parseAddSub();
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    
    while (i < expr.length) {
      const char = expr[i];
      
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      if (/[0-9.]/.test(char)) {
        let num = '';
        while (i < expr.length && /[0-9.eE+-]/.test(expr[i])) {
          num += expr[i++];
        }
        tokens.push(num);
        continue;
      }
      
      if (/[+\-*/()]/.test(char)) {
        tokens.push(char);
        i++;
        continue;
      }
      
      i++;
    }
    
    return tokens;
  }
}
