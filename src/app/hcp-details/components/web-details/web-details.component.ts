import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { getChartOption, getAiAnalysesResult } from './mock-data';
import { NzListModule } from 'ng-zorro-antd/list';
import { BrowserWindowSizeChangeEnum, NotificationService } from '@app/services/notification.service';
import { LoadingService } from '@app/shared/services/loading.service';
import { environment } from '@env/environment';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
@Component({
  selector: 'gsk-web-details',
  standalone: true,
  imports: [
    CommonModule,
    NgxEchartsModule,
    NgScrollbarModule,
    NzListModule,
    NzTableModule,
    NzTabsModule,
    
  ],
  templateUrl: './web-details.component.html',
  styleUrl: './web-details.component.scss'
})
export class WebDetailsComponent implements OnInit, OnDestroy {
  private chart: echarts.ECharts | null = null;
  imgPath = environment.imgPath;
  
  // 检测是否为 iPad
  isIPad = false;
  scrollbarMaxHeight = '95px';

  // 跑马灯文字内容 - 今日任务提醒
  marqueeText = '📋 任务提醒：需要需要对医生拜访。品牌:欧乐欣。拜访类型:打电话。描述:这是拜访备注.';

  // 图例数据状态
  legendData = [
    { name: 'p1', score: '54.6', trend: 'up', visible: true, color: 'rgb(41, 80, 141)' },
    { name: 'p2', score: '54.6', trend: 'down', visible: true, color: 'rgb(230, 111, 145)' },
    { name: 'p3', score: '54.6', trend: 'up', visible: true, color: 'rgb(75, 125, 201)' },
    { name: 'p4', score: '54.6', trend: 'down', visible: true, color: 'rgb(85, 184, 132)' }
  ];

  //项目数据
  projectData = [
    { name: '001', type: 'wechat', time: '2025-10-31',  des:'这是拜访备注-可能是没有拜访成功' },
    { name: '002', type: 'phone', time: '2025-10-25', des:'这是拜访备注-可能是拜访成功' },
    { name: '003', type: 'wechat', time: '2025-10-20',  des:'这是拜访备注-可能是拜访成功' },
    { name: '004', type: 'phone', time: '2025-10-18',  des:'这是拜访备注-可能是拜访成功' },
  ];
  //医生能力 合作意向 影响力 观念
  doctorAbility = [
    { name: '医生能力', value: '高', trend: 'up' },
    { name: '合作意向', value: '中', trend: 'down' },
    { name: '影响力', value: '低', trend: 'down' },
    { name: '观念', value: '高', trend: 'up' },
  ];

  // 医生标签数据
  doctorTags = [
    { name: '学术专家', color: this.getRandomColor() },
    { name: '临床经验丰富', color: this.getRandomColor() },
    { name: '新药接受度高', color: this.getRandomColor() },
    { name: '患者口碑好', color: this.getRandomColor() },
    { name: '科研能力强', color: this.getRandomColor() }
  ];

  // 生成随机颜色
  getRandomColor() {
    const colors = [
      '#e3f2fd', '#e8f5e8', '#fff3e0', '#e0f2f1', '#f3e5f5',
      '#fce4ec', '#f1f8e9', '#e8eaf6', '#fff8e1', '#e0f7fa',
      '#f3e5f5', '#e1f5fe', '#f9fbe7', '#fce4ec', '#e8f5e8'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  aiAnalysesResultList = [] as any[];

  constructor(
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {
    // this.initChart();
  }

  ngOnInit() {
    console.log('WebDetailsComponent ngOnInit');
    // 检测是否为 iPad
    this.detectIPad();
    
    // 使用 setTimeout 确保 DOM 已经渲染完成
    setTimeout(() => {
      this.initChart();
    }, 0);

    this.aiAnalysesResultList = this.handleAiAnalysesResult(getAiAnalysesResult().gpt?.qc?.med);

    //监听屏幕宽度
    this.notificationService.subscribeToBrowserWindowSizeChange(BrowserWindowSizeChangeEnum.HcpDetails, (message: any) => {
      //刷新图表
      setTimeout(() => {
        this.chart?.resize();
      }, 100);
    });

    // 监听窗口焦点变化，解决切换桌面后图表消失的问题
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (this.chart) {
          this.chart.resize();
        } else {
          this.initChart();
        }
      }, 100);
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.chart) {
        setTimeout(() => {
          this.chart?.resize();
        }, 100);
      }
    });

    // 组件初始化完成，停止加载动画
    setTimeout(() => {
      console.log('WebDetailsComponent 初始化完成，停止加载动画');
      this.loadingService.hide();
    }, 100); // 给一个短暂的延迟，确保组件完全渲染
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
    this.notificationService.unsubscribeBrowserWindowSizeChangeNotification(BrowserWindowSizeChangeEnum.HcpDetails);
    
    // 清理事件监听器
    window.removeEventListener('focus', () => {});
    document.removeEventListener('visibilitychange', () => {});
  }

  // 检测设备类型和设置高度
  private detectIPad() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // 检测是否为手机版布局（高度 > 宽度）
    const isMobileLayout = screenHeight > screenWidth;
    
    // iPad 检测方法
    const isIPadUserAgent = /ipad/.test(userAgent);
    const isIPadBySize = screenWidth >= 768 && screenWidth <= 1366;
    const isIPadAspectRatio = Math.abs(screenWidth / screenHeight - 4/3) < 0.1;
    
    // 综合判断
    this.isIPad = isIPadUserAgent || isIPadBySize || isIPadAspectRatio;
    
    // 根据布局类型设置滚动条高度
    if (isMobileLayout) {
      // 手机版布局：使用较小高度
      this.scrollbarMaxHeight = '75px';
    } else if (this.isIPad) {
      // iPad 横屏：使用较大高度
      this.scrollbarMaxHeight = '175px';
    } else {
      // 桌面版：使用中等高度
      this.scrollbarMaxHeight = '95px';
    }
  }

  // 图例点击事件
  toggleLegend(index: number) {
    this.legendData[index].visible = !this.legendData[index].visible;
    this.updateChart();
  }

  // 更新图表
  updateChart() {
    if (this.chart) {
      const option = this.chart.getOption();
      const series = option['series'] as any[];
      
      // 更新每个系列的显示状态
      this.legendData.forEach((item, index) => {
        if (series[index]) {
          series[index].data = item.visible ? [getChartOption().series[index].data[0]] : [];
        }
      });
      
      this.chart.setOption(option);
    }
  }

  initChart() {
    const chartElement = document.getElementById('chart') as HTMLElement;
    if (chartElement) {
      // 如果图表已存在，先销毁
      if (this.chart) {
        this.chart.dispose();
      }
      
      this.chart = echarts.init(chartElement);
      this.chart.setOption(getChartOption(false));  // 传递 isMobile: false
      
      // 添加图表渲染完成后的回调
      this.chart.on('finished', () => {
        console.log('图表渲染完成');
      });
    }
  }

    //处理ai分析结果
    handleAiAnalysesResult(aiAnalysesResult: any): any[] {
      return [
        {
          title: "有效信息",
          icon: 'icon-guanjianxinxibiangeng',
          //添加 123的标题
          list: (() => {
            if (aiAnalysesResult['有效信息'] && aiAnalysesResult['有效信息'].length) {
              let tempList = aiAnalysesResult['有效信息'] as any[];
              if (tempList.length) {
                return tempList.map((item: any, index) => `${index + 1}. ${item}`)
              }
            }
            return ['无']
          })(),
        },
        {
          title: "用药经验",
          icon: 'icon-a-28yongyaojilu',
          list: (() => {
            if (aiAnalysesResult['用药经验'] && aiAnalysesResult['用药经验'].length) {
              let tempList = aiAnalysesResult['用药经验'] as any[];
              if (tempList.length) {
                return tempList.map((item: any, index) => `${index + 1}. ${item}`)
              }
            }
            return ['无']
          })(),
        },
        {
          title: "对话评价",
          icon: 'icon-zongjie',
          list: (() => {
            if (aiAnalysesResult['对话评价'] && aiAnalysesResult['对话评价'].length) {
              return [aiAnalysesResult['对话评价']]
            }
            return ['无']
          })(),
        },
        {
          title: "下次建议",
          icon: 'icon-jianyi1',
          list: (() => {
            if (aiAnalysesResult['下次沟通建议'] && aiAnalysesResult['下次沟通建议'].length) {
              return [aiAnalysesResult['下次沟通建议']]
            }
            return ['无']
          })(),
        }
      ];
    }

    // 日历按钮点击事件
    onCalendarClick() {
      console.log('日历按钮被点击');
      // TODO: 实现日历功能
    }

}

