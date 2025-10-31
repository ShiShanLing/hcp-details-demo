import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MobileDetailsComponent } from './components/mobile-details/mobile-details.component';
import { WebDetailsComponent } from './components/web-details/web-details.component';

@Component({
  selector: 'app-hcp-details',
  standalone: true,
  imports: [CommonModule, MobileDetailsComponent, WebDetailsComponent],
  providers: [BreakpointObserver],
  templateUrl: './hcp-details.component.html',
  styleUrls: ['./hcp-details.component.scss']
})
export class HcpDetailsComponent implements OnInit, OnDestroy {
  isMobile = false;
  private destroy$ = new Subject<void>();
  
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // 初始检测
    this.checkScreenSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
    
    // 使用 BreakpointObserver 作为备用
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: any) => {
        console.log('BreakpointObserver 触发:', result);
        this.isMobile = result.matches;
        this.cdr.detectChanges();
        console.log('设备类型:', this.isMobile ? '移动端' : '桌面端', '屏幕宽度:', window.innerWidth);
      });
  }
  /*
  新设备大概啥时候有,我使用RN写了个版本,想看看代码有没有问题.
  */
  private checkScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wasMobile = this.isMobile;
    
    // 检测是否为移动设备
    const isMobileDevice = this.isMobileDevice();
    
    // 如果确定为移动设备，无论横屏竖屏都使用移动端布局
    // 如果是桌面设备，根据宽度判断（宽度小于768px使用移动端布局）
    const newIsMobile = isMobileDevice || width <= 768;
    
    if (wasMobile !== newIsMobile) {
      // 使用 setTimeout 避免变更检测错误
      setTimeout(() => {
        this.isMobile = newIsMobile;
        this.cdr.detectChanges();
        console.log('屏幕方向变化:', width, 'x', height, 'px, 切换到:', this.isMobile ? '手机版布局' : '桌面版布局');
        
        // 如果切换到移动端，延迟触发窗口大小变化事件
        if (newIsMobile) {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            console.log('已触发窗口大小变化事件，通知移动端组件');
          }, 200);
        }
      }, 0);
    }
  }

  /**
   * 检测是否为移动设备
   */
  private isMobileDevice(): boolean {
    // 检测屏幕尺寸（移动设备通常宽度较小）
    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxDimension = Math.max(width, height);
    
    // 如果最大尺寸小于1024px，很可能是移动设备
    // 同时检测宽高比，移动设备通常有一个维度很小
    if (maxDimension <= 1024 && (width <= 768 || height <= 768)) {
      return true;
    }
    
    // 检测User-Agent
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    if (mobileRegex.test(userAgent)) {
      return true;
    }
    
    // 检测触摸支持（移动设备通常支持触摸）
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      // 结合屏幕尺寸判断，避免大屏触摸设备被误判
      if (maxDimension <= 1366) {
        return true;
      }
    }
    
    return false;
  }

  ngOnDestroy() {
    // 清理事件监听器
    window.removeEventListener('resize', this.checkScreenSize);
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}
