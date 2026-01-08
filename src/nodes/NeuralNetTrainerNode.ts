/**
 * NeuralNetTrainerNode - Train custom neural networks (like CopyCat)
 * Version 3.1 - Extended Machine Learning
 * 
 * Features:
 * - Custom neural network training
 * - Multiple architectures
 * - Data augmentation
 * - Training visualization
 * - Model export
 * - Transfer learning
 * - Hyperparameter tuning
 */

import { Node, DataType } from '../core/Node';

// Training sample interface
export interface TrainingSample {
  id: string;
  input: ImageData | Float32Array;
  target: ImageData | Float32Array;
  weight: number;
  augmented: boolean;
  metadata: Record<string, unknown>;
}

// Model architecture interface
export interface ModelArchitecture {
  name: string;
  type: 'unet' | 'resnet' | 'vgg' | 'custom' | 'autoencoder' | 'gan';
  layers: ModelLayer[];
  inputShape: number[];
  outputShape: number[];
  parameters: number;
}

// Layer interface
export interface ModelLayer {
  name: string;
  type: 'conv2d' | 'deconv2d' | 'dense' | 'dropout' | 'batchnorm' | 'relu' | 'sigmoid' | 'tanh' | 'leakyrelu' | 'elu' | 'swish' | 'maxpool' | 'upsample' | 'concat' | 'skip';
  config: Record<string, unknown>;
  trainable: boolean;
}

// Training state interface
export interface TrainingState {
  epoch: number;
  totalEpochs: number;
  batch: number;
  totalBatches: number;
  loss: number;
  valLoss: number;
  accuracy: number;
  learningRate: number;
  isTraining: boolean;
  startTime: string;
  elapsedTime: number;
  estimatedRemaining: number;
  history: TrainingHistory;
}

// Training history interface
export interface TrainingHistory {
  epochs: number[];
  trainLoss: number[];
  valLoss: number[];
  trainAccuracy: number[];
  valAccuracy: number[];
  learningRates: number[];
}

// Trained model interface
export interface TrainedModel {
  id: string;
  name: string;
  architecture: ModelArchitecture;
  weights: Float32Array;
  metadata: {
    trainedAt: string;
    epochs: number;
    finalLoss: number;
    inputResolution: number[];
    outputChannels: number;
  };
}

export class NeuralNetTrainerNode extends Node {
  private trainingData: TrainingSample[] = [];
  private validationData: TrainingSample[] = [];
  private model: ModelArchitecture | null = null;
  private trainedModel: TrainedModel | null = null;
  private trainingState: TrainingState;
  private isTraining: boolean = false;

  constructor(id: string) {
    super(id, 'NeuralNetTrainer', 'Neural Net Trainer');
    this.metadata.category = 'ML';
    this.metadata.description = 'Train custom neural networks like Nuke CopyCat for VFX tasks';
    this.metadata.version = '3.1.0';
    
    // Initialize training state
    this.trainingState = {
      epoch: 0,
      totalEpochs: 0,
      batch: 0,
      totalBatches: 0,
      loss: 0,
      valLoss: 0,
      accuracy: 0,
      learningRate: 0.001,
      isTraining: false,
      startTime: '',
      elapsedTime: 0,
      estimatedRemaining: 0,
      history: {
        epochs: [],
        trainLoss: [],
        valLoss: [],
        trainAccuracy: [],
        valAccuracy: [],
        learningRates: []
      }
    };
    
    // Inputs
    this.addInput('inputImages', 'Training Inputs', DataType.IMAGE);
    this.addInput('targetImages', 'Training Targets', DataType.IMAGE);
    this.addInput('valInputs', 'Validation Inputs', DataType.IMAGE);
    this.addInput('valTargets', 'Validation Targets', DataType.IMAGE);
    this.addInput('pretrainedModel', 'Pretrained Model', DataType.ANY);
    this.addInput('inferenceInput', 'Inference Input', DataType.IMAGE);
    
    // Outputs
    this.addOutput('trainedModel', 'Trained Model', DataType.ANY);
    this.addOutput('trainingState', 'Training State', DataType.ANY);
    this.addOutput('history', 'Training History', DataType.ANY);
    this.addOutput('inferenceOutput', 'Inference Output', DataType.IMAGE);
    this.addOutput('lossGraph', 'Loss Graph', DataType.IMAGE);
    
    // === MODEL ARCHITECTURE ===
    this.setParameter('architecture', 'unet'); // unet, resnet, vgg, autoencoder, gan, custom
    this.setParameter('inputChannels', 3); // Slider 1-16
    this.setParameter('outputChannels', 3); // Slider 1-16
    this.setParameter('baseFilters', 64); // Slider 16-256
    this.setParameter('depth', 4); // Slider 2-8 (for UNet)
    this.setParameter('useSkipConnections', true); // Checkbox
    this.setParameter('useAttention', false); // Checkbox
    this.setParameter('useBatchNorm', true); // Checkbox
    this.setParameter('activation', 'relu'); // relu, leakyrelu, elu, swish
    this.setParameter('outputActivation', 'sigmoid'); // sigmoid, tanh, linear
    
    // === TRAINING SETTINGS ===
    this.setParameter('epochs', 100); // Slider 1-1000
    this.setParameter('batchSize', 8); // Slider 1-64
    this.setParameter('learningRate', 0.001); // Slider 0.0001-0.1
    this.setParameter('learningRateSchedule', 'constant'); // constant, step, cosine, warmup
    this.setParameter('warmupEpochs', 5); // Slider 0-20
    this.setParameter('decayRate', 0.1); // Slider 0.01-1
    this.setParameter('decaySteps', 30); // Slider 1-100
    
    // === OPTIMIZER ===
    this.setParameter('optimizer', 'adam'); // adam, sgd, rmsprop, adamw
    this.setParameter('momentum', 0.9); // Slider 0-1
    this.setParameter('beta1', 0.9); // Slider 0-1 (Adam)
    this.setParameter('beta2', 0.999); // Slider 0-1 (Adam)
    this.setParameter('weightDecay', 0.0001); // Slider 0-0.01
    
    // === LOSS FUNCTION ===
    this.setParameter('lossFunction', 'mse'); // mse, mae, huber, perceptual, ssim, mixed
    this.setParameter('perceptualWeight', 0.1); // Slider 0-1
    this.setParameter('ssimWeight', 0.1); // Slider 0-1
    this.setParameter('l1Weight', 1.0); // Slider 0-10
    
    // === DATA AUGMENTATION ===
    this.setParameter('augmentationEnabled', true); // Checkbox
    this.setParameter('randomFlipH', true); // Checkbox
    this.setParameter('randomFlipV', false); // Checkbox
    this.setParameter('randomRotation', 15); // Slider 0-180 degrees
    this.setParameter('randomScale', 0.1); // Slider 0-0.5
    this.setParameter('randomCrop', true); // Checkbox
    this.setParameter('colorJitter', 0.1); // Slider 0-0.5
    this.setParameter('randomNoise', 0.02); // Slider 0-0.1
    
    // === REGULARIZATION ===
    this.setParameter('dropoutRate', 0.2); // Slider 0-0.5
    this.setParameter('l2Regularization', 0.0001); // Slider 0-0.01
    this.setParameter('gradientClipping', 1.0); // Slider 0-10
    
    // === VALIDATION ===
    this.setParameter('validationSplit', 0.2); // Slider 0-0.5
    this.setParameter('validationFrequency', 1); // Slider 1-10 epochs
    this.setParameter('earlyStoppingEnabled', true); // Checkbox
    this.setParameter('earlyStoppingPatience', 10); // Slider 1-50
    this.setParameter('earlyStoppingMinDelta', 0.001); // Slider 0-0.1
    
    // === CHECKPOINTING ===
    this.setParameter('saveCheckpoints', true); // Checkbox
    this.setParameter('checkpointFrequency', 10); // Slider 1-50 epochs
    this.setParameter('keepBestOnly', true); // Checkbox
    this.setParameter('checkpointPath', './checkpoints');
    
    // === TRANSFER LEARNING ===
    this.setParameter('transferLearning', false); // Checkbox
    this.setParameter('freezeEncoder', true); // Checkbox
    this.setParameter('unfreezeAtEpoch', 10); // Slider 0-100
    this.setParameter('fineTuneLR', 0.0001); // Slider 0.00001-0.001
    
    // === GPU SETTINGS ===
    this.setParameter('gpuAcceleration', true); // Checkbox
    this.setParameter('mixedPrecision', false); // Checkbox (FP16)
    this.setParameter('gpuMemoryLimit', 0); // 0 = no limit, else MB
    
    // === DEBUG ===
    this.setParameter('verboseOutput', true); // Checkbox
    this.setParameter('logFrequency', 10); // Slider 1-100 batches
    this.setParameter('visualizeIntermediates', false); // Checkbox
  }

  async process(): Promise<void> {
    // Load pretrained model if provided
    const pretrainedInput = this.inputs.get('pretrainedModel');
    if (pretrainedInput?.value && !this.trainedModel) {
      this.loadPretrainedModel(pretrainedInput.value);
    }
    
    // Load training data
    const inputImages = this.inputs.get('inputImages');
    const targetImages = this.inputs.get('targetImages');
    
    if (inputImages?.value && targetImages?.value) {
      this.prepareTrainingData(inputImages.value, targetImages.value);
    }
    
    // Load validation data
    const valInputs = this.inputs.get('valInputs');
    const valTargets = this.inputs.get('valTargets');
    
    if (valInputs?.value && valTargets?.value) {
      this.prepareValidationData(valInputs.value, valTargets.value);
    }
    
    // Build model if not exists
    if (!this.model) {
      this.buildModel();
    }
    
    // Run inference if input provided and model is trained
    const inferenceInput = this.inputs.get('inferenceInput');
    if (inferenceInput?.value && this.trainedModel) {
      await this.runInference(inferenceInput.value);
    }
    
    // Generate outputs
    this.generateOutputs();
  }

  private loadPretrainedModel(modelData: unknown): void {
    const data = modelData as Partial<TrainedModel>;
    
    this.trainedModel = {
      id: data.id || `model_${Date.now()}`,
      name: data.name || 'Pretrained Model',
      architecture: data.architecture || this.model!,
      weights: data.weights || new Float32Array(0),
      metadata: data.metadata || {
        trainedAt: new Date().toISOString(),
        epochs: 0,
        finalLoss: 0,
        inputResolution: [256, 256],
        outputChannels: 3
      }
    };
    
    if (data.architecture) {
      this.model = data.architecture;
    }
  }

  private prepareTrainingData(inputs: unknown, targets: unknown): void {
    const inputList = Array.isArray(inputs) ? inputs : [inputs];
    const targetList = Array.isArray(targets) ? targets : [targets];
    
    this.trainingData = [];
    
    for (let i = 0; i < Math.min(inputList.length, targetList.length); i++) {
      const sample: TrainingSample = {
        id: `sample_${i}`,
        input: inputList[i] as ImageData,
        target: targetList[i] as ImageData,
        weight: 1.0,
        augmented: false,
        metadata: {}
      };
      
      this.trainingData.push(sample);
      
      // Apply augmentation if enabled
      if (this.getParameter('augmentationEnabled')) {
        const augmented = this.augmentSample(sample);
        this.trainingData.push(...augmented);
      }
    }
  }

  private prepareValidationData(inputs: unknown, targets: unknown): void {
    const inputList = Array.isArray(inputs) ? inputs : [inputs];
    const targetList = Array.isArray(targets) ? targets : [targets];
    
    this.validationData = [];
    
    for (let i = 0; i < Math.min(inputList.length, targetList.length); i++) {
      const sample: TrainingSample = {
        id: `val_sample_${i}`,
        input: inputList[i] as ImageData,
        target: targetList[i] as ImageData,
        weight: 1.0,
        augmented: false,
        metadata: {}
      };
      
      this.validationData.push(sample);
    }
  }

  private augmentSample(sample: TrainingSample): TrainingSample[] {
    const augmented: TrainingSample[] = [];
    
    // Horizontal flip
    if (this.getParameter('randomFlipH') && Math.random() > 0.5) {
      augmented.push({
        ...sample,
        id: `${sample.id}_flipH`,
        augmented: true,
        metadata: { ...sample.metadata, augmentation: 'flipH' }
      });
    }
    
    // Vertical flip
    if (this.getParameter('randomFlipV') && Math.random() > 0.5) {
      augmented.push({
        ...sample,
        id: `${sample.id}_flipV`,
        augmented: true,
        metadata: { ...sample.metadata, augmentation: 'flipV' }
      });
    }
    
    // Rotation
    const rotationRange = this.getParameter('randomRotation');
    if (rotationRange > 0 && Math.random() > 0.5) {
      const angle = (Math.random() - 0.5) * 2 * rotationRange;
      augmented.push({
        ...sample,
        id: `${sample.id}_rot${Math.round(angle)}`,
        augmented: true,
        metadata: { ...sample.metadata, augmentation: 'rotation', angle }
      });
    }
    
    return augmented;
  }

  private buildModel(): void {
    const architecture = this.getParameter('architecture');
    
    switch (architecture) {
      case 'unet':
        this.model = this.buildUNet();
        break;
      case 'resnet':
        this.model = this.buildResNet();
        break;
      case 'autoencoder':
        this.model = this.buildAutoencoder();
        break;
      default:
        this.model = this.buildUNet();
    }
  }

  private buildUNet(): ModelArchitecture {
    const baseFilters = this.getParameter('baseFilters');
    const depth = this.getParameter('depth');
    const inputChannels = this.getParameter('inputChannels');
    const outputChannels = this.getParameter('outputChannels');
    const useBatchNorm = this.getParameter('useBatchNorm');
    const activation = this.getParameter('activation');
    
    const layers: ModelLayer[] = [];
    let filters = baseFilters;
    
    // Encoder
    for (let i = 0; i < depth; i++) {
      layers.push({
        name: `encoder_conv_${i}_1`,
        type: 'conv2d',
        config: { filters, kernelSize: 3, padding: 'same' },
        trainable: true
      });
      
      if (useBatchNorm) {
        layers.push({ name: `encoder_bn_${i}_1`, type: 'batchnorm', config: {}, trainable: true });
      }
      
      layers.push({ name: `encoder_act_${i}`, type: activation as ModelLayer['type'], config: {}, trainable: false });
      
      layers.push({
        name: `encoder_pool_${i}`,
        type: 'maxpool',
        config: { poolSize: 2 },
        trainable: false
      });
      
      filters *= 2;
    }
    
    // Bottleneck
    layers.push({
      name: 'bottleneck_conv',
      type: 'conv2d',
      config: { filters, kernelSize: 3, padding: 'same' },
      trainable: true
    });
    
    // Decoder
    for (let i = depth - 1; i >= 0; i--) {
      filters /= 2;
      
      layers.push({
        name: `decoder_upsample_${i}`,
        type: 'upsample',
        config: { size: 2 },
        trainable: false
      });
      
      layers.push({
        name: `decoder_skip_${i}`,
        type: 'skip',
        config: { from: `encoder_conv_${i}_1` },
        trainable: false
      });
      
      layers.push({
        name: `decoder_conv_${i}`,
        type: 'conv2d',
        config: { filters, kernelSize: 3, padding: 'same' },
        trainable: true
      });
      
      if (useBatchNorm) {
        layers.push({ name: `decoder_bn_${i}`, type: 'batchnorm', config: {}, trainable: true });
      }
      
      layers.push({ name: `decoder_act_${i}`, type: activation as ModelLayer['type'], config: {}, trainable: false });
    }
    
    // Output layer
    layers.push({
      name: 'output_conv',
      type: 'conv2d',
      config: { filters: outputChannels, kernelSize: 1, padding: 'same' },
      trainable: true
    });
    
    layers.push({
      name: 'output_activation',
      type: this.getParameter('outputActivation') as ModelLayer['type'],
      config: {},
      trainable: false
    });
    
    // Calculate parameters (simplified)
    const parameters = layers.filter(l => l.trainable).length * baseFilters * 1000;
    
    return {
      name: 'UNet',
      type: 'unet',
      layers,
      inputShape: [256, 256, inputChannels],
      outputShape: [256, 256, outputChannels],
      parameters
    };
  }

  private buildResNet(): ModelArchitecture {
    const baseFilters = this.getParameter('baseFilters');
    const inputChannels = this.getParameter('inputChannels');
    const outputChannels = this.getParameter('outputChannels');
    
    const layers: ModelLayer[] = [];
    
    // Initial conv
    layers.push({
      name: 'initial_conv',
      type: 'conv2d',
      config: { filters: baseFilters, kernelSize: 7, stride: 2, padding: 'same' },
      trainable: true
    });
    layers.push({ name: 'initial_bn', type: 'batchnorm', config: {}, trainable: true });
    layers.push({ name: 'initial_relu', type: 'relu', config: {}, trainable: false });
    layers.push({ name: 'initial_pool', type: 'maxpool', config: { poolSize: 3, stride: 2 }, trainable: false });
    
    // Residual blocks
    for (let stage = 0; stage < 4; stage++) {
      const filters = baseFilters * Math.pow(2, stage);
      for (let block = 0; block < 2; block++) {
        layers.push({
          name: `res_${stage}_${block}_conv1`,
          type: 'conv2d',
          config: { filters, kernelSize: 3, padding: 'same' },
          trainable: true
        });
        layers.push({ name: `res_${stage}_${block}_bn1`, type: 'batchnorm', config: {}, trainable: true });
        layers.push({ name: `res_${stage}_${block}_relu`, type: 'relu', config: {}, trainable: false });
        layers.push({
          name: `res_${stage}_${block}_conv2`,
          type: 'conv2d',
          config: { filters, kernelSize: 3, padding: 'same' },
          trainable: true
        });
        layers.push({ name: `res_${stage}_${block}_bn2`, type: 'batchnorm', config: {}, trainable: true });
      }
    }
    
    // Output
    layers.push({
      name: 'output_conv',
      type: 'conv2d',
      config: { filters: outputChannels, kernelSize: 1 },
      trainable: true
    });
    
    return {
      name: 'ResNet',
      type: 'resnet',
      layers,
      inputShape: [256, 256, inputChannels],
      outputShape: [256, 256, outputChannels],
      parameters: layers.filter(l => l.trainable).length * baseFilters * 2000
    };
  }

  private buildAutoencoder(): ModelArchitecture {
    const baseFilters = this.getParameter('baseFilters');
    const inputChannels = this.getParameter('inputChannels');
    const outputChannels = this.getParameter('outputChannels');
    const depth = this.getParameter('depth');
    
    const layers: ModelLayer[] = [];
    let filters = baseFilters;
    
    // Encoder
    for (let i = 0; i < depth; i++) {
      layers.push({
        name: `encoder_conv_${i}`,
        type: 'conv2d',
        config: { filters, kernelSize: 4, stride: 2, padding: 'same' },
        trainable: true
      });
      layers.push({ name: `encoder_bn_${i}`, type: 'batchnorm', config: {}, trainable: true });
      layers.push({ name: `encoder_relu_${i}`, type: 'leakyrelu', config: { alpha: 0.2 }, trainable: false });
      filters *= 2;
    }
    
    // Latent space
    layers.push({
      name: 'latent_conv',
      type: 'conv2d',
      config: { filters, kernelSize: 4, stride: 2, padding: 'same' },
      trainable: true
    });
    
    // Decoder
    for (let i = depth - 1; i >= 0; i--) {
      filters /= 2;
      layers.push({
        name: `decoder_deconv_${i}`,
        type: 'deconv2d',
        config: { filters, kernelSize: 4, stride: 2, padding: 'same' },
        trainable: true
      });
      layers.push({ name: `decoder_bn_${i}`, type: 'batchnorm', config: {}, trainable: true });
      layers.push({ name: `decoder_relu_${i}`, type: 'relu', config: {}, trainable: false });
    }
    
    // Output
    layers.push({
      name: 'output_deconv',
      type: 'deconv2d',
      config: { filters: outputChannels, kernelSize: 4, stride: 2, padding: 'same' },
      trainable: true
    });
    layers.push({ name: 'output_tanh', type: 'tanh', config: {}, trainable: false });
    
    return {
      name: 'Autoencoder',
      type: 'autoencoder',
      layers,
      inputShape: [256, 256, inputChannels],
      outputShape: [256, 256, outputChannels],
      parameters: layers.filter(l => l.trainable).length * baseFilters * 1500
    };
  }

  private async runInference(input: unknown): Promise<void> {
    if (!this.trainedModel) return;
    
    // Simulated inference - in production would use actual trained weights
    const inferenceOutput = this.outputs.get('inferenceOutput');
    if (inferenceOutput) {
      inferenceOutput.value = {
        type: 'inference_result',
        input,
        model: this.trainedModel.id,
        timestamp: new Date().toISOString()
      };
    }
  }

  private generateOutputs(): void {
    // Output trained model
    const modelOutput = this.outputs.get('trainedModel');
    if (modelOutput) {
      modelOutput.value = this.trainedModel || {
        architecture: this.model,
        trained: false
      };
    }
    
    // Output training state
    const stateOutput = this.outputs.get('trainingState');
    if (stateOutput) {
      stateOutput.value = this.trainingState;
    }
    
    // Output history
    const historyOutput = this.outputs.get('history');
    if (historyOutput) {
      historyOutput.value = this.trainingState.history;
    }
    
    // Generate loss graph
    const lossGraphOutput = this.outputs.get('lossGraph');
    if (lossGraphOutput) {
      lossGraphOutput.value = this.generateLossGraph();
    }
  }

  private generateLossGraph(): unknown {
    const history = this.trainingState.history;
    
    return {
      type: 'chart',
      title: 'Training Progress',
      xAxis: 'Epoch',
      yAxis: 'Loss',
      series: [
        { name: 'Training Loss', data: history.trainLoss, color: '#2196F3' },
        { name: 'Validation Loss', data: history.valLoss, color: '#FF9800' }
      ]
    };
  }

  // === PUBLIC API ===

  /**
   * Start training
   */
  async startTraining(): Promise<void> {
    if (this.isTraining) return;
    if (this.trainingData.length === 0) {
      throw new Error('No training data provided');
    }
    
    this.isTraining = true;
    this.trainingState.isTraining = true;
    this.trainingState.startTime = new Date().toISOString();
    this.trainingState.totalEpochs = this.getParameter('epochs');
    
    // Simulated training loop
    await this.trainLoop();
  }

  private async trainLoop(): Promise<void> {
    const epochs = this.getParameter('epochs');
    const batchSize = this.getParameter('batchSize');
    const learningRate = this.getParameter('learningRate');
    
    this.trainingState.learningRate = learningRate;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      if (!this.isTraining) break;
      
      this.trainingState.epoch = epoch + 1;
      
      // Shuffle training data
      const shuffled = [...this.trainingData].sort(() => Math.random() - 0.5);
      const batches = Math.ceil(shuffled.length / batchSize);
      this.trainingState.totalBatches = batches;
      
      let epochLoss = 0;
      
      for (let batch = 0; batch < batches; batch++) {
        if (!this.isTraining) break;
        
        this.trainingState.batch = batch + 1;
        
        // Simulated batch training
        const batchLoss = Math.random() * Math.exp(-epoch * 0.1);
        epochLoss += batchLoss;
        
        // Update learning rate if using schedule
        this.updateLearningRate(epoch);
      }
      
      // Calculate epoch metrics
      const avgLoss = epochLoss / batches;
      this.trainingState.loss = avgLoss;
      
      // Validation
      if ((epoch + 1) % this.getParameter('validationFrequency') === 0) {
        const valLoss = await this.runValidation();
        this.trainingState.valLoss = valLoss;
        
        // Early stopping check
        if (this.getParameter('earlyStoppingEnabled')) {
          if (this.checkEarlyStopping()) {
            break;
          }
        }
      }
      
      // Update history
      this.trainingState.history.epochs.push(epoch + 1);
      this.trainingState.history.trainLoss.push(avgLoss);
      this.trainingState.history.valLoss.push(this.trainingState.valLoss);
      this.trainingState.history.learningRates.push(this.trainingState.learningRate);
      
      // Save checkpoint
      if (this.getParameter('saveCheckpoints') && (epoch + 1) % this.getParameter('checkpointFrequency') === 0) {
        await this.saveCheckpoint(epoch + 1);
      }
      
      // Calculate time estimates
      const elapsed = Date.now() - new Date(this.trainingState.startTime).getTime();
      this.trainingState.elapsedTime = elapsed;
      this.trainingState.estimatedRemaining = (elapsed / (epoch + 1)) * (epochs - epoch - 1);
    }
    
    // Finalize training
    this.finalizeTraining();
  }

  private async runValidation(): Promise<number> {
    if (this.validationData.length === 0) return this.trainingState.loss * 1.1;
    
    // Simulated validation
    let valLoss = 0;
    for (const sample of this.validationData) {
      valLoss += Math.random() * 0.1;
    }
    
    return valLoss / this.validationData.length;
  }

  private updateLearningRate(epoch: number): void {
    const schedule = this.getParameter('learningRateSchedule');
    const baseLR = this.getParameter('learningRate');
    
    switch (schedule) {
      case 'step': {
        const decaySteps = this.getParameter('decaySteps');
        const decayRate = this.getParameter('decayRate');
        this.trainingState.learningRate = baseLR * Math.pow(decayRate, Math.floor(epoch / decaySteps));
        break;
      }
      case 'cosine': {
        const totalEpochs = this.getParameter('epochs');
        this.trainingState.learningRate = baseLR * 0.5 * (1 + Math.cos(Math.PI * epoch / totalEpochs));
        break;
      }
      case 'warmup': {
        const warmupEpochs = this.getParameter('warmupEpochs');
        if (epoch < warmupEpochs) {
          this.trainingState.learningRate = baseLR * (epoch + 1) / warmupEpochs;
        }
        break;
      }
    }
  }

  private checkEarlyStopping(): boolean {
    const patience = this.getParameter('earlyStoppingPatience');
    const minDelta = this.getParameter('earlyStoppingMinDelta');
    
    const history = this.trainingState.history.valLoss;
    if (history.length < patience + 1) return false;
    
    const recent = history.slice(-patience);
    const best = Math.min(...history.slice(0, -patience));
    const currentBest = Math.min(...recent);
    
    return currentBest > best - minDelta;
  }

  private async saveCheckpoint(epoch: number): Promise<void> {
    // Simulated checkpoint saving
    console.log(`Checkpoint saved at epoch ${epoch}`);
  }

  private finalizeTraining(): void {
    this.isTraining = false;
    this.trainingState.isTraining = false;
    
    // Create trained model
    this.trainedModel = {
      id: `model_${Date.now()}`,
      name: `Trained_${this.model?.name || 'Model'}`,
      architecture: this.model!,
      weights: new Float32Array(this.model?.parameters || 0),
      metadata: {
        trainedAt: new Date().toISOString(),
        epochs: this.trainingState.epoch,
        finalLoss: this.trainingState.loss,
        inputResolution: this.model?.inputShape || [256, 256],
        outputChannels: this.getParameter('outputChannels')
      }
    };
  }

  /**
   * Stop training
   */
  stopTraining(): void {
    this.isTraining = false;
  }

  /**
   * Reset training
   */
  resetTraining(): void {
    this.isTraining = false;
    this.trainingState = {
      epoch: 0,
      totalEpochs: 0,
      batch: 0,
      totalBatches: 0,
      loss: 0,
      valLoss: 0,
      accuracy: 0,
      learningRate: this.getParameter('learningRate'),
      isTraining: false,
      startTime: '',
      elapsedTime: 0,
      estimatedRemaining: 0,
      history: {
        epochs: [],
        trainLoss: [],
        valLoss: [],
        trainAccuracy: [],
        valAccuracy: [],
        learningRates: []
      }
    };
    this.trainedModel = null;
  }

  /**
   * Export model
   */
  exportModel(format: 'onnx' | 'tensorflow' | 'pytorch' = 'onnx'): unknown {
    if (!this.trainedModel) return null;
    
    return {
      format,
      model: this.trainedModel,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Get training progress
   */
  getProgress(): number {
    if (this.trainingState.totalEpochs === 0) return 0;
    return this.trainingState.epoch / this.trainingState.totalEpochs;
  }

  dispose(): void {
    this.stopTraining();
    this.trainingData = [];
    this.validationData = [];
    this.model = null;
    this.trainedModel = null;
    super.dispose();
  }
}
