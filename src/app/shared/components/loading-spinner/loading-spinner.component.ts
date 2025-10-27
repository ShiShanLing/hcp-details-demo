import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container">
      <div class="medical-spinner">
        <!-- 医疗十字架 -->
        <div class="medical-cross">
          <div class="cross-horizontal"></div>
          <div class="cross-vertical"></div>
        </div>
        
        <!-- 心跳波形 -->
        <div class="heartbeat-waves">
          <div class="wave wave-1"></div>
          <div class="wave wave-2"></div>
          <div class="wave wave-3"></div>
          <div class="wave wave-4"></div>
        </div>
        
            <!-- 旋转的医疗符号 -->
            <div class="medical-symbols">
              <div class="symbol symbol-1">+</div>
              <div class="symbol symbol-2">❤</div>
              <div class="symbol symbol-3">⚕</div>
              <div class="symbol symbol-4">💊</div>
            </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      width: 100%;
      height: 100%;
      background: rgba(51, 181, 255, 0.6);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    }

    .medical-spinner {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* 医疗十字架 */
    .medical-cross {
      position: absolute;
      width: 40px;
      height: 40px;
      animation: pulse 2s ease-in-out infinite;
    }

    .cross-horizontal {
      position: absolute;
      width: 40px;
      height: 8px;
      background: #ffffff;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      border-radius: 4px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }

    .cross-vertical {
      position: absolute;
      width: 8px;
      height: 40px;
      background: #ffffff;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 4px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }

    /* 心跳波形 */
    .heartbeat-waves {
      position: absolute;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .wave {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      animation: heartbeat 1.5s ease-in-out infinite;
    }

    .wave-1 {
      animation-delay: 0s;
    }

    .wave-2 {
      animation-delay: 0.3s;
    }

    .wave-3 {
      animation-delay: 0.6s;
    }

    .wave-4 {
      animation-delay: 0.9s;
    }

    /* 旋转的医疗符号 */
    .medical-symbols {
      position: absolute;
      width: 80px;
      height: 80px;
      animation: rotateSymbols 3s linear infinite;
    }

    .symbol {
      position: absolute;
      font-size: 16px;
      color: #ffffff;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
      animation: symbolPulse 2s ease-in-out infinite;
    }

    .symbol-1 {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      animation-delay: 0s;
    }

    .symbol-2 {
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      animation-delay: 0.5s;
    }

    .symbol-3 {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      animation-delay: 1s;
    }

        .symbol-4 {
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          animation-delay: 1.5s;
        }

    /* 动画定义 */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    @keyframes heartbeat {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.3;
      }
      100% {
        transform: scale(0.8);
        opacity: 0.8;
      }
    }

    @keyframes rotateSymbols {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes symbolPulse {
      0%, 100% {
        opacity: 0.6;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }

    /* 深色主题适配 */
    @media (prefers-color-scheme: dark) {
      .loading-container {
        background: rgba(51, 181, 255, 0.6);
      }
      
      .cross-horizontal,
      .cross-vertical {
        background: #ffffff;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      }
      
      .symbol {
        color: #ffffff;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
      }
    }
  `]
})
export class LoadingSpinnerComponent {}
