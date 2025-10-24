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
  
  private checkScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wasMobile = this.isMobile;
    
    // 检测是否为手机版布局（高度 > 宽度）
    const newIsMobile = height > width;
    
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

  ngOnDestroy() {
    // 清理事件监听器
    window.removeEventListener('resize', this.checkScreenSize);
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}
