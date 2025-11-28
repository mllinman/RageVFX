/**
 * Transform3DNode - 3D object manipulation with translate, rotate, scale
 * Version 3.3 - Screenspace Manipulation Tools
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'world' | 'local' | 'view' | 'screen';
export type PivotMode = 'center' | 'origin' | 'boundingBox' | 'cursor' | 'custom';

export interface Transform3DData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  quaternion: THREE.Quaternion;
  matrix: THREE.Matrix4;
  worldMatrix: THREE.Matrix4;
}

export class Transform3DNode extends Node {
  private transformedObject: THREE.Object3D | null = null;
  private pivotPoint: THREE.Vector3 = new THREE.Vector3();

  constructor(id: string) {
    super(id, 'Transform3D', 'Transform 3D');
    this.metadata.category = 'Transform';
    this.metadata.description = '3D object manipulation with translate, rotate, scale - supports WASD controls and keyframe animation';
    this.metadata.version = '3.3.0';

    // Inputs
    this.addInput('object', 'Object', DataType.GEOMETRY_3D);
    this.addInput('parent', 'Parent (Optional)', DataType.GEOMETRY_3D);
    this.addInput('target', 'Look At Target (Optional)', DataType.VECTOR);

    // Outputs
    this.addOutput('object', 'Transformed Object', DataType.GEOMETRY_3D);
    this.addOutput('transformData', 'Transform Data', DataType.ANY);
    this.addOutput('matrix', 'Transform Matrix', DataType.MATRIX);
    this.addOutput('worldMatrix', 'World Matrix', DataType.MATRIX);
    this.addOutput('position', 'Position', DataType.VECTOR);
    this.addOutput('rotation', 'Rotation', DataType.VECTOR);
    this.addOutput('scale', 'Scale', DataType.VECTOR);

    // Transform Mode
    this.setParameter('activeMode', 'translate'); // translate, rotate, scale
    this.setParameter('transformSpace', 'world'); // world, local, view, screen
    this.setParameter('snapEnabled', false);
    this.setParameter('snapTranslate', 1.0); // snap increment for translation
    this.setParameter('snapRotate', 15); // snap increment for rotation (degrees)
    this.setParameter('snapScale', 0.1); // snap increment for scale

    // Position (Translation)
    this.setParameter('translateX', 0);
    this.setParameter('translateY', 0);
    this.setParameter('translateZ', 0);
    this.setParameter('translateUniform', false);

    // Rotation (Euler angles in degrees)
    this.setParameter('rotateX', 0);
    this.setParameter('rotateY', 0);
    this.setParameter('rotateZ', 0);
    this.setParameter('rotationOrder', 'XYZ'); // XYZ, XZY, YXZ, YZX, ZXY, ZYX
    this.setParameter('useQuaternion', false);
    this.setParameter('quaternionX', 0);
    this.setParameter('quaternionY', 0);
    this.setParameter('quaternionZ', 0);
    this.setParameter('quaternionW', 1);

    // Scale
    this.setParameter('scaleX', 1);
    this.setParameter('scaleY', 1);
    this.setParameter('scaleZ', 1);
    this.setParameter('uniformScale', true);
    this.setParameter('uniformScaleValue', 1);

    // Pivot Point
    this.setParameter('pivotMode', 'center'); // center, origin, boundingBox, cursor, custom
    this.setParameter('pivotX', 0);
    this.setParameter('pivotY', 0);
    this.setParameter('pivotZ', 0);

    // Look At
    this.setParameter('useLookAt', false);
    this.setParameter('lookAtX', 0);
    this.setParameter('lookAtY', 0);
    this.setParameter('lookAtZ', 0);
    this.setParameter('upVectorX', 0);
    this.setParameter('upVectorY', 1);
    this.setParameter('upVectorZ', 0);

    // Animation Support
    this.setParameter('animated', false);
    this.setParameter('keyframePosition', true);
    this.setParameter('keyframeRotation', true);
    this.setParameter('keyframeScale', true);

    // WASD Control Settings
    this.setParameter('wasdEnabled', true);
    this.setParameter('wasdSpeed', 1.0);
    this.setParameter('wasdRotateSpeed', 45); // degrees per second
    this.setParameter('wasdShiftMultiplier', 3.0);
    this.setParameter('wasdAltMultiplier', 0.1);

    // Constraints
    this.setParameter('constrainX', false);
    this.setParameter('constrainY', false);
    this.setParameter('constrainZ', false);
    this.setParameter('minTranslateX', -Infinity);
    this.setParameter('maxTranslateX', Infinity);
    this.setParameter('minTranslateY', -Infinity);
    this.setParameter('maxTranslateY', Infinity);
    this.setParameter('minTranslateZ', -Infinity);
    this.setParameter('maxTranslateZ', Infinity);
    this.setParameter('minScale', 0.001);
    this.setParameter('maxScale', 1000);

    // Reset Options
    this.setParameter('resetPosition', false);
    this.setParameter('resetRotation', false);
    this.setParameter('resetScale', false);
  }

  async process(): Promise<void> {
    const inputObject = this.inputs.get('object')?.value as THREE.Object3D | undefined;
    const parentObject = this.inputs.get('parent')?.value as THREE.Object3D | undefined;
    const lookAtTarget = this.inputs.get('target')?.value as THREE.Vector3 | undefined;

    // Clone or create new object
    if (inputObject) {
      this.transformedObject = inputObject.clone();
    } else {
      // Create a dummy transform node if no input
      this.transformedObject = new THREE.Object3D();
    }

    // Handle reset options
    if (this.getParameter('resetPosition')) {
      this.setParameter('translateX', 0);
      this.setParameter('translateY', 0);
      this.setParameter('translateZ', 0);
      this.setParameter('resetPosition', false);
    }
    if (this.getParameter('resetRotation')) {
      this.setParameter('rotateX', 0);
      this.setParameter('rotateY', 0);
      this.setParameter('rotateZ', 0);
      this.setParameter('resetRotation', false);
    }
    if (this.getParameter('resetScale')) {
      this.setParameter('scaleX', 1);
      this.setParameter('scaleY', 1);
      this.setParameter('scaleZ', 1);
      this.setParameter('uniformScaleValue', 1);
      this.setParameter('resetScale', false);
    }

    // Calculate pivot point
    this.calculatePivot();

    // Apply transformations
    this.applyTranslation();
    this.applyRotation(lookAtTarget);
    this.applyScale();

    // Handle parenting
    if (parentObject) {
      // Apply parent transform
      const worldMatrix = new THREE.Matrix4();
      worldMatrix.multiplyMatrices(parentObject.matrixWorld, this.transformedObject.matrix);
      this.transformedObject.matrixAutoUpdate = false;
      this.transformedObject.matrix.copy(worldMatrix);
      this.transformedObject.matrix.decompose(
        this.transformedObject.position,
        this.transformedObject.quaternion,
        this.transformedObject.scale
      );
    }

    // Update matrices
    this.transformedObject.updateMatrix();
    this.transformedObject.updateMatrixWorld(true);

    // Prepare transform data output
    const transformData: Transform3DData = {
      position: this.transformedObject.position.clone(),
      rotation: this.transformedObject.rotation.clone(),
      scale: this.transformedObject.scale.clone(),
      quaternion: this.transformedObject.quaternion.clone(),
      matrix: this.transformedObject.matrix.clone(),
      worldMatrix: this.transformedObject.matrixWorld.clone()
    };

    // Set outputs
    const objOutput = this.outputs.get('object');
    if (objOutput) objOutput.value = this.transformedObject;

    const dataOutput = this.outputs.get('transformData');
    if (dataOutput) dataOutput.value = transformData;

    const matrixOutput = this.outputs.get('matrix');
    if (matrixOutput) matrixOutput.value = transformData.matrix.toArray();

    const worldMatrixOutput = this.outputs.get('worldMatrix');
    if (worldMatrixOutput) worldMatrixOutput.value = transformData.worldMatrix.toArray();

    const posOutput = this.outputs.get('position');
    if (posOutput) posOutput.value = transformData.position.toArray();

    const rotOutput = this.outputs.get('rotation');
    if (rotOutput) {
      rotOutput.value = [
        transformData.rotation.x * 180 / Math.PI,
        transformData.rotation.y * 180 / Math.PI,
        transformData.rotation.z * 180 / Math.PI
      ];
    }

    const scaleOutput = this.outputs.get('scale');
    if (scaleOutput) scaleOutput.value = transformData.scale.toArray();

    this.dirty = false;
  }

  private calculatePivot(): void {
    if (!this.transformedObject) return;

    const pivotMode = this.getParameter('pivotMode') as PivotMode;

    switch (pivotMode) {
      case 'origin':
        this.pivotPoint.set(0, 0, 0);
        break;
      case 'center':
        // Calculate center from bounding box
        const box = new THREE.Box3().setFromObject(this.transformedObject);
        box.getCenter(this.pivotPoint);
        break;
      case 'boundingBox':
        // Use bounding box minimum (corner)
        const bbox = new THREE.Box3().setFromObject(this.transformedObject);
        this.pivotPoint.copy(bbox.min);
        break;
      case 'custom':
        this.pivotPoint.set(
          this.getParameter('pivotX'),
          this.getParameter('pivotY'),
          this.getParameter('pivotZ')
        );
        break;
      default:
        this.pivotPoint.set(0, 0, 0);
    }
  }

  private applyTranslation(): void {
    if (!this.transformedObject) return;

    let tx = this.getParameter('translateX');
    let ty = this.getParameter('translateY');
    let tz = this.getParameter('translateZ');

    // Apply constraints
    if (this.getParameter('constrainX')) tx = 0;
    if (this.getParameter('constrainY')) ty = 0;
    if (this.getParameter('constrainZ')) tz = 0;

    // Apply limits
    tx = Math.max(this.getParameter('minTranslateX'), Math.min(this.getParameter('maxTranslateX'), tx));
    ty = Math.max(this.getParameter('minTranslateY'), Math.min(this.getParameter('maxTranslateY'), ty));
    tz = Math.max(this.getParameter('minTranslateZ'), Math.min(this.getParameter('maxTranslateZ'), tz));

    // Apply snap if enabled
    if (this.getParameter('snapEnabled')) {
      const snap = this.getParameter('snapTranslate');
      tx = Math.round(tx / snap) * snap;
      ty = Math.round(ty / snap) * snap;
      tz = Math.round(tz / snap) * snap;
    }

    const transformSpace = this.getParameter('transformSpace') as TransformSpace;

    if (transformSpace === 'local') {
      // Translate in local space
      const localTranslation = new THREE.Vector3(tx, ty, tz);
      localTranslation.applyQuaternion(this.transformedObject.quaternion);
      this.transformedObject.position.add(localTranslation);
    } else {
      // World space translation
      this.transformedObject.position.set(tx, ty, tz);
    }
  }

  private applyRotation(lookAtTarget?: THREE.Vector3): void {
    if (!this.transformedObject) return;

    // Check for look-at mode
    if (this.getParameter('useLookAt') || lookAtTarget) {
      const target = lookAtTarget || new THREE.Vector3(
        this.getParameter('lookAtX'),
        this.getParameter('lookAtY'),
        this.getParameter('lookAtZ')
      );
      const up = new THREE.Vector3(
        this.getParameter('upVectorX'),
        this.getParameter('upVectorY'),
        this.getParameter('upVectorZ')
      );
      this.transformedObject.lookAt(target);
      this.transformedObject.up.copy(up);
      return;
    }

    if (this.getParameter('useQuaternion')) {
      // Use quaternion rotation
      this.transformedObject.quaternion.set(
        this.getParameter('quaternionX'),
        this.getParameter('quaternionY'),
        this.getParameter('quaternionZ'),
        this.getParameter('quaternionW')
      ).normalize();
    } else {
      // Use Euler rotation
      let rx = this.getParameter('rotateX');
      let ry = this.getParameter('rotateY');
      let rz = this.getParameter('rotateZ');

      // Apply constraints
      if (this.getParameter('constrainX')) rx = 0;
      if (this.getParameter('constrainY')) ry = 0;
      if (this.getParameter('constrainZ')) rz = 0;

      // Apply snap if enabled
      if (this.getParameter('snapEnabled')) {
        const snap = this.getParameter('snapRotate');
        rx = Math.round(rx / snap) * snap;
        ry = Math.round(ry / snap) * snap;
        rz = Math.round(rz / snap) * snap;
      }

      // Convert to radians and apply
      const order = this.getParameter('rotationOrder') as THREE.EulerOrder;
      this.transformedObject.rotation.set(
        rx * Math.PI / 180,
        ry * Math.PI / 180,
        rz * Math.PI / 180,
        order
      );
    }

    // If not at origin, rotate around pivot
    if (this.pivotPoint.lengthSq() > 0) {
      // Move to pivot, rotate, move back
      const tempMatrix = new THREE.Matrix4();
      const pivotInverse = this.pivotPoint.clone().negate();
      
      tempMatrix.makeTranslation(pivotInverse.x, pivotInverse.y, pivotInverse.z);
      tempMatrix.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(this.transformedObject.quaternion));
      tempMatrix.premultiply(new THREE.Matrix4().makeTranslation(this.pivotPoint.x, this.pivotPoint.y, this.pivotPoint.z));
      
      this.transformedObject.applyMatrix4(tempMatrix);
    }
  }

  private applyScale(): void {
    if (!this.transformedObject) return;

    let sx: number, sy: number, sz: number;

    if (this.getParameter('uniformScale')) {
      const uniformValue = this.getParameter('uniformScaleValue');
      sx = sy = sz = uniformValue;
    } else {
      sx = this.getParameter('scaleX');
      sy = this.getParameter('scaleY');
      sz = this.getParameter('scaleZ');
    }

    // Apply limits
    const minScale = this.getParameter('minScale');
    const maxScale = this.getParameter('maxScale');
    sx = Math.max(minScale, Math.min(maxScale, sx));
    sy = Math.max(minScale, Math.min(maxScale, sy));
    sz = Math.max(minScale, Math.min(maxScale, sz));

    // Apply snap if enabled
    if (this.getParameter('snapEnabled')) {
      const snap = this.getParameter('snapScale');
      sx = Math.round(sx / snap) * snap;
      sy = Math.round(sy / snap) * snap;
      sz = Math.round(sz / snap) * snap;
    }

    this.transformedObject.scale.set(sx, sy, sz);
  }

  // Public methods for interactive control

  /**
   * Apply WASD movement delta
   */
  applyWASDMovement(direction: { w: boolean; a: boolean; s: boolean; d: boolean; q: boolean; e: boolean }, deltaTime: number, modifiers: { shift: boolean; alt: boolean }): void {
    if (!this.getParameter('wasdEnabled')) return;

    let speed = this.getParameter('wasdSpeed');
    if (modifiers.shift) speed *= this.getParameter('wasdShiftMultiplier');
    if (modifiers.alt) speed *= this.getParameter('wasdAltMultiplier');

    const delta = speed * deltaTime;
    const activeMode = this.getParameter('activeMode') as TransformMode;

    if (activeMode === 'translate') {
      if (direction.w) this.setParameter('translateZ', this.getParameter('translateZ') - delta);
      if (direction.s) this.setParameter('translateZ', this.getParameter('translateZ') + delta);
      if (direction.a) this.setParameter('translateX', this.getParameter('translateX') - delta);
      if (direction.d) this.setParameter('translateX', this.getParameter('translateX') + delta);
      if (direction.q) this.setParameter('translateY', this.getParameter('translateY') - delta);
      if (direction.e) this.setParameter('translateY', this.getParameter('translateY') + delta);
    } else if (activeMode === 'rotate') {
      const rotSpeed = this.getParameter('wasdRotateSpeed') * deltaTime;
      if (direction.w) this.setParameter('rotateX', this.getParameter('rotateX') + rotSpeed);
      if (direction.s) this.setParameter('rotateX', this.getParameter('rotateX') - rotSpeed);
      if (direction.a) this.setParameter('rotateY', this.getParameter('rotateY') + rotSpeed);
      if (direction.d) this.setParameter('rotateY', this.getParameter('rotateY') - rotSpeed);
      if (direction.q) this.setParameter('rotateZ', this.getParameter('rotateZ') + rotSpeed);
      if (direction.e) this.setParameter('rotateZ', this.getParameter('rotateZ') - rotSpeed);
    } else if (activeMode === 'scale') {
      const scaleSpeed = delta * 0.1;
      if (this.getParameter('uniformScale')) {
        let currentScale = this.getParameter('uniformScaleValue');
        if (direction.w || direction.d) currentScale += scaleSpeed;
        if (direction.s || direction.a) currentScale -= scaleSpeed;
        this.setParameter('uniformScaleValue', Math.max(0.001, currentScale));
      }
    }

    this.markDirty();
  }

  /**
   * Get current transform values for keyframing
   */
  getKeyframeValues(): { position: number[]; rotation: number[]; scale: number[] } {
    return {
      position: [
        this.getParameter('translateX'),
        this.getParameter('translateY'),
        this.getParameter('translateZ')
      ],
      rotation: [
        this.getParameter('rotateX'),
        this.getParameter('rotateY'),
        this.getParameter('rotateZ')
      ],
      scale: this.getParameter('uniformScale')
        ? [this.getParameter('uniformScaleValue'), this.getParameter('uniformScaleValue'), this.getParameter('uniformScaleValue')]
        : [this.getParameter('scaleX'), this.getParameter('scaleY'), this.getParameter('scaleZ')]
    };
  }

  /**
   * Set transform values from keyframe
   */
  setFromKeyframe(values: { position?: number[]; rotation?: number[]; scale?: number[] }): void {
    if (values.position && this.getParameter('keyframePosition')) {
      this.setParameter('translateX', values.position[0]);
      this.setParameter('translateY', values.position[1]);
      this.setParameter('translateZ', values.position[2]);
    }
    if (values.rotation && this.getParameter('keyframeRotation')) {
      this.setParameter('rotateX', values.rotation[0]);
      this.setParameter('rotateY', values.rotation[1]);
      this.setParameter('rotateZ', values.rotation[2]);
    }
    if (values.scale && this.getParameter('keyframeScale')) {
      if (this.getParameter('uniformScale')) {
        this.setParameter('uniformScaleValue', values.scale[0]);
      } else {
        this.setParameter('scaleX', values.scale[0]);
        this.setParameter('scaleY', values.scale[1]);
        this.setParameter('scaleZ', values.scale[2]);
      }
    }
    this.markDirty();
  }

  dispose(): void {
    this.transformedObject = null;
    super.dispose();
  }
}
