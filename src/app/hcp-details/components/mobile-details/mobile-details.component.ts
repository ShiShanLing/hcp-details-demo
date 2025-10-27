import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { getChartOption, getAiAnalysesResult } from '../web-details/mock-data';
import { NzListModule } from 'ng-zorro-antd/list';
import { BrowserWindowSizeChangeEnum, NotificationService } from '@app/services/notification.service';
import { LoadingService } from '@app/shared/services/loading.service';
import { environment } from '@env/environment';

@Component({
  selector: 'gsk-mobile-details',
  standalone: true,
  imports: [
    CommonModule,
    NgxEchartsModule,
    NgScrollbarModule,
    NzListModule,
  ],
  templateUrl: './mobile-details.component.html',
  styleUrl: './mobile-details.component.scss'
})
export class MobileDetailsComponent implements OnInit, OnDestroy {
  private chart: echarts.ECharts | null = null;
  imgPath = environment.imgPath;

  // 图例数据状态
  legendData = [
    { name: 'p1', score: '54.6', trend: 'up', visible: true, color: 'rgb(41, 80, 141)' },
    { name: 'p2', score: '54.6', trend: 'down', visible: true, color: 'rgb(230, 111, 145)' },
    { name: 'p3', score: '54.6', trend: 'up', visible: true, color: 'rgb(75, 125, 201)' },
    { name: 'p4', score: '54.6', trend: 'down', visible: true, color: 'rgb(85, 184, 132)' }
  ];

  //项目数据
  projectData = [
    { name: '001', score: '54.6', trend: 'up', des:'项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍' },
    { name: '002', score: '54.6', trend: 'down', des:'项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍' },
    { name: '003', score: '54.6', trend: 'up', des:'项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍' },
    { name: '004', score: '54.6', trend: 'down', des:'项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍项目介绍' },
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
    private cdr: ChangeDetectorRef,
    private loadingService: LoadingService
  ) { }

  ngOnInit() {
    console.log('MobileDetailsComponent ngOnInit');
    
    // 延迟初始化图表，确保DOM已渲染
    setTimeout(() => {
      this.initChart();
    }, 0);

    // 处理AI分析结果
    this.aiAnalysesResultList = this.handleAiAnalysesResult(getAiAnalysesResult().gpt?.qc?.med);
    
    // 监听窗口大小变化
    this.notificationService.subscribeToBrowserWindowSizeChange(BrowserWindowSizeChangeEnum.HcpDetails, (message: any) => {
      // 延迟刷新图表，确保DOM更新完成
      setTimeout(() => {
        this.chart?.resize();
        this.cdr.detectChanges(); // 强制触发变更检测
        console.log('移动端图表已重新调整大小');
      }, 100);
    });
    
    // 添加直接的窗口大小变化监听
    window.addEventListener('resize', this.handleResize);
    
    // 监听窗口焦点变化，解决切换桌面后图表消失的问题
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (this.chart) {
          this.chart.resize();
        } else {
          this.initChart();
        }
        this.cdr.detectChanges();
      }, 100);
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.chart) {
        setTimeout(() => {
          this.chart?.resize();
          this.cdr.detectChanges();
        }, 100);
      }
    });

    // 组件初始化完成，停止加载动画
    setTimeout(() => {
      console.log('MobileDetailsComponent 初始化完成，停止加载动画');
      this.loadingService.hide();
    }, 100); // 给一个短暂的延迟，确保组件完全渲染
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
    // 清理事件监听器
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('focus', () => {});
    document.removeEventListener('visibilitychange', () => {});
  }
  
  private handleResize = () => {
    setTimeout(() => {
      this.chart?.resize();
      this.cdr.detectChanges();
      console.log('移动端组件响应窗口大小变化');
    }, 100);
  }

  // 初始化图表
  initChart() {
    const chartElement = document.getElementById('chart');
    if (chartElement) {
      // 如果图表已存在，先销毁
      if (this.chart) {
        this.chart.dispose();
      }
      
      this.chart = echarts.init(chartElement);
      const option = getChartOption(true);  // 传递 isMobile: true
      this.chart.setOption(option);
      
      // 添加图表渲染完成后的回调
      this.chart.on('finished', () => {
        console.log('移动端图表渲染完成');
      });
    }
  }

  // 切换图例显示状态
  toggleLegend(index: number) {
    this.legendData[index].visible = !this.legendData[index].visible;
    this.updateChart();
  }

  // 更新图表
  updateChart() {
    if (this.chart) {
      const option = this.chart.getOption();
      const series = option['series'] as any[];
      
      this.legendData.forEach((item, index) => {
        if (series[index]) {
          series[index].data = item.visible ? [getChartOption().series[index].data[0]] : [];
        }
      });
      
      this.chart.setOption(option);
    }
  }

  // 处理AI分析结果
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
}