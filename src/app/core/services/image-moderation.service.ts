import { Injectable } from '@angular/core';

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  probabilities?: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class ImageModerationService {
  private model: any = null;
  private modelLoadPromise: Promise<any> | null = null;

  /**
   * Dynamically loads TensorFlow.js and NSFWJS from reliable CDNs on demand.
   * This keeps initial bundle size at 0KB extra!
   */
  private async loadModel(): Promise<any> {
    if (this.model) return this.model;
    if (this.modelLoadPromise) return this.modelLoadPromise;

    this.modelLoadPromise = (async () => {
      try {
        // 1. Load TensorFlow.js if not already present
        if (!(window as any).tf) {
          await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
        }

        // 2. Load NSFWJS if not already present
        if (!(window as any).nsfwjs) {
          await this.loadScript('https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js');
        }

        const nsfwjs = (window as any).nsfwjs;
        if (!nsfwjs || typeof nsfwjs.load !== 'function') {
          console.warn('NSFWJS library not available.');
          return null;
        }

        // 3. Load the MobileNetV2 (93% accuracy, ultra-fast) NSFW model
        this.model = await nsfwjs.load();
        return this.model;
      } catch (err) {
        console.warn('Không thể tải model kiểm duyệt ảnh nhạy cảm:', err);
        return null;
      }
    })();

    return this.modelLoadPromise;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Scans an HTMLImageElement, HTMLCanvasElement, or File/Blob for sensitive/NSFW content.
   */
  async scanImage(
    target: HTMLImageElement | HTMLCanvasElement | File | Blob,
  ): Promise<ModerationResult> {
    try {
      const model = await this.loadModel();
      if (!model) {
        // Fallback gracefully if model fails to load from CDN
        return { isSafe: true };
      }

      let elementToScan: HTMLImageElement | HTMLCanvasElement;

      if (target instanceof HTMLCanvasElement || target instanceof HTMLImageElement) {
        elementToScan = target;
      } else {
        // Convert File/Blob to HTMLImageElement
        elementToScan = await this.blobToImage(target);
      }

      // Classify the image: returns 5 classes (Drawing, Hentai, Neutral, Porn, Sexy)
      const predictions: Array<{ className: string; probability: number }> =
        await model.classify(elementToScan);

      const probs: Record<string, number> = {};
      for (const p of predictions) {
        probs[p.className] = p.probability;
      }

      const porn = probs['Porn'] || 0;
      const hentai = probs['Hentai'] || 0;
      const sexy = probs['Sexy'] || 0;

      // Sensitivity Thresholds - Focus strictly on extreme 18+ porn / hentai
      if (porn > 0.65) {
        return {
          isSafe: false,
          reason: 'Hình ảnh chứa nội dung người lớn (18+) không phù hợp với chuẩn mực cộng đồng Starbucks.',
          probabilities: probs,
        };
      }

      if (hentai > 0.65) {
        return {
          isSafe: false,
          reason: 'Hình ảnh chứa nội dung vẽ nhạy cảm hoặc không phù hợp với chuẩn mực cộng đồng.',
          probabilities: probs,
        };
      }

      return {
        isSafe: true,
        probabilities: probs,
      };
    } catch (error) {
      console.warn('Lỗi trong quá trình quét ảnh kiểm duyệt:', error);
      // Graceful bypass on runtime error so user is not permanently stuck
      return { isSafe: true };
    }
  }

  private blobToImage(blob: Blob | File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }
}
