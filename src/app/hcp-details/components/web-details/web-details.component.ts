import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { getChartOption, getAiAnalysesResult, analysisResult } from './mock-data';
import { NzListModule } from 'ng-zorro-antd/list';
import { BrowserWindowSizeChangeEnum, NotificationService } from '@app/services/notification.service';
import { LoadingService } from '@app/shared/services/loading.service';
import { environment } from '@env/environment';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzModalModule, NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { CalendarModalComponent } from './calendar-modal.component';
import { hasTodayTask, getDefaultCalendarEvents } from './calendar-data-handle';
import { ScoreDeductionModalComponent, ScoreDeductionData } from './components/score-deduction-modal.component';

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
    NzModalModule
  ],
  templateUrl: './web-details.component.html',
  styleUrl: './web-details.component.scss'
})
export class WebDetailsComponent implements OnInit, OnDestroy {
  private chart: echarts.ECharts | null = null;
  private calendarModalRef: NzModalRef | null = null; // 保存日历模态框的引用
  imgPath = environment.imgPath;
  hasTodayTask = false; // 今天是否有任务
  
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

  // 扣分项配置 - key对应的扣分项名称
  private p_new: { [key: string]: { desc: string; order: number; step: number } } = {
    "q1": {
      "desc": "拜访结果正确勾选",
      "order": 1,
      "step": 100
    },
    "q2": {
      "desc": "服务规范",
      "order": 2,
      "step": 20
    },
    "q3": {
      "desc": "知情同意",
      "order": 3,
      "step": 100
    },
    "q4": {
      "desc": "医生信息确认",
      "order": 4,
      "step": 100
    },
    "q5": {
      "desc": "RMR专属服务身份确认",
      "order": 5,
      "step": 100
    },
    "q6": {
      "desc": "企微响应时间",
      "order": 6,
      "step": 20
    }
  };

  //项目数据
  projectData = [
    { name: '001', type: 'wechat', score: 100, time: '2025-10-31', des: '这是拜访备注-可能是没有拜访成功', aiResultId: '001' },
    { name: '002', type: 'phone', score: undefined, time: '2025-10-25', des: undefined, aiResultId: '002' },
    { name: '003', type: 'wechat', score: 100, time: '2025-10-20', des: '这是拜访备注-可能是拜访成功', aiResultId: '003' },
    { name: '004', type: 'phone', score: 80, time: '2025-10-18', des: '有效拜访,拜访结果正确勾选', aiResultId: '004', "s_detail": {
      "q2": {
          "s": -20,
          "n": ""
      }
  } },
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

  phoneAnalysisResultList = [] as any[]; // 电话分析结果
  wechatAnalysisResultList = [] as any[]; // 微信分析结果
  currentAnalysisTabIndex = 0; // 当前选中的分析tab索引：0=通话分析，1=微信分析

  constructor(
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private modal: NzModalService
  ) {
    // this.initChart();
  }

  ngOnInit() {
    console.log('WebDetailsComponent ngOnInit');
    // 检测是否为 iPad
    this.detectIPad();
    
    // 检查今天是否有任务（通过创建临时日历组件实例）
    this.checkTodayTask();
    
    // 使用 setTimeout 确保 DOM 已经渲染完成
    setTimeout(() => {
      this.initChart();
    }, 0);

    // 默认显示第一个项目的AI分析结果
    // 初始化微信分析数据（第一个项目是微信类型）
    this.loadAiAnalysisResult('001', 'wechat');
    // 初始化电话分析数据（第二个项目是电话类型）
    this.loadAiAnalysisResult('002', 'phone');

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

  // 加载指定项目的AI分析结果
  loadAiAnalysisResult(aiResultId: string, projectType: string) {
    const result = analysisResult.find(item => item.id === aiResultId);
    if (result && result.gpt?.qc?.med) {
      const analysisData = this.handleAiAnalysesResult(result.gpt.qc.med);
      // 根据项目类型分别存储到对应的数组
      if (projectType === 'phone') {
        this.phoneAnalysisResultList = analysisData;
        // 切换到通话分析 tab
        this.currentAnalysisTabIndex = 0;
      } else if (projectType === 'wechat') {
        this.wechatAnalysisResultList = analysisData;
        // 切换到微信分析 tab
        this.currentAnalysisTabIndex = 1;
      }
    } else {
      // 如果没有找到对应的AI结果，使用默认数据
      const defaultData = this.handleAiAnalysesResult(getAiAnalysesResult().gpt?.qc?.med);
      if (projectType === 'phone') {
        this.phoneAnalysisResultList = defaultData;
        // 切换到通话分析 tab
        this.currentAnalysisTabIndex = 0;
      } else if (projectType === 'wechat') {
        this.wechatAnalysisResultList = defaultData;
        // 切换到微信分析 tab
        this.currentAnalysisTabIndex = 1;
      }
    }
  }

  // 处理项目卡片点击事件
  onProjectCardClick(project: any) {
    if (project.aiResultId && project.type) {
      this.loadAiAnalysisResult(project.aiResultId, project.type);
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
    //MARK:检查今天是否有任务
    private checkTodayTask() {
      // 使用默认的任务事件数据检查今天是否有任务
      const defaultEvents = getDefaultCalendarEvents();
      this.hasTodayTask = hasTodayTask(defaultEvents);
    }
    //MARK:弹出日历
    // 日历按钮点击事件
    // 处理分数点击事件
  onScoreClick(project: any, event: Event) {
    // 阻止事件冒泡，防止触发项目卡片点击
    event.stopPropagation();
    
    // 如果分数是100或undefined，不处理
    if (project.score === undefined || project.score === 100) {
      return;
    }

    // 构建扣分数据
    const deductionItems: any[] = [];
    let totalDeduction = 0;

    // 解析 s_detail 字段（如果存在）
    if (project.s_detail) {
      Object.keys(project.s_detail).forEach(key => {
        const detail = project.s_detail[key];
        if (detail && detail.s) {
          const deduction = Math.abs(detail.s); // 取绝对值
          totalDeduction += deduction;
          
          // 从 p_new 中获取扣分项名称
          const itemName = this.p_new[key]?.desc || key;
          
          deductionItems.push({
            item: itemName,
            reason: detail.n || '',
            score: deduction
          });
        }
      });
    }

    // 如果没有s_detail，根据总分和当前分数计算总扣分
    if (deductionItems.length === 0) {
      totalDeduction = 100 - project.score;
      deductionItems.push({
        item: '扣分项',
        reason: '未提供详细扣分明细',
        score: totalDeduction
      });
    }

    const scoreData: ScoreDeductionData = {
      projectName: `${project.type === 'wechat' ? '微信' : '电话'} - ${project.name}`,
      totalScore: 100,
      currentScore: project.score,
      deductionItems: deductionItems,
      remark: project.des
    };

    // 打开扣分详情模态框
    this.modal.create({
      nzTitle: '扣分详情',
      nzContent: ScoreDeductionModalComponent,
      nzData: scoreData,
      nzWidth: 600,
      nzFooter: null,
      
      nzClassName: 'score-deduction-modal-wrapper'
    });
  }
  onCalendarClick(autoClickTodayTask: boolean = false) {
      this.calendarModalRef = this.modal.create({
        nzTitle: '任务日历',
        nzContent: CalendarModalComponent,
        nzData: {
          autoClickTodayTask: autoClickTodayTask
        },
        nzWidth: 1000,
        nzStyle: { 
          top: '20px',
          height: 'calc(100vh - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden'
        },
        nzBodyStyle: {
          height: 'calc(100% - 55px)',
          overflow: 'auto', // 允许滚动，当内容超出时显示滚动条
          padding: '0'
        },
        nzWrapClassName: 'calendar-modal-wrapper', // 使用类名方便查找
        nzFooter: null,
        nzClosable: true,
        nzMaskClosable: true
      });
      
      // 当模态框关闭后，重新检查今天是否有任务
      this.calendarModalRef.afterClose.subscribe(() => {
        this.checkTodayTask();
      });
      
      // 订阅模态框打开事件，设置ID
      this.calendarModalRef.afterOpen.subscribe(() => {
        const modalElement = this.calendarModalRef?.getElement();
        if (modalElement) {
          modalElement.setAttribute('id', 'calendar-modal');
        }
      });
    }

  // 处理跑马灯点击事件
  onMarqueeClick() {
    // 打开日历并自动点击今天的任务
    this.onCalendarClick(true);
  }

}

