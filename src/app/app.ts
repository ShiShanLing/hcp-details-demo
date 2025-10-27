import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { LoadingService } from './shared/services/loading.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, LoadingSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('hcp-details-demo');
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    console.log('App组件初始化，开始显示加载动画');
    
    // 应用启动时立即显示加载动画
    this.loadingService.show();
    
    // 监听加载状态变化
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        console.log('加载状态变化:', loading);
        this.isLoading = loading;
        this.cdr.detectChanges();
      });
    
    // 监听路由导航开始
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.handleNavigationStart((event as NavigationStart).url);
      });

    // 监听路由导航结束
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        // this.handleNavigationEnd((event as NavigationEnd).url);
      });
  }

  private handleNavigationStart(url: string) {
    console.log('路由导航开始:', url);
    // 加载动画已经在ngOnInit中开始，这里只需要记录日志
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
