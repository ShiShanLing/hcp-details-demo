
//添加是否是手机端入参
export function getChartOption(isMobile: boolean = false) {
    const payload: any = {
      id: 'right-bottom',
      title: ['排名1', '排名2'],
      // color: ['rgb(41, 80, 141)', 'rgb(230, 111, 145)', 'rgb(75, 125, 201)', 'rgb(85, 184, 132)'],
      color: ['41, 80, 141', '230, 111, 145', '75, 125, 201', '85, 184, 132'],
      wordNum: 5,
      data: {
        position: 'left',
        legend: [
          'p1 54.6分',
          'p2 54.6分',
          'p3 54.6分',
          'p4 54.6分',
        ],
        data1: [7, 4.5, 8, 6.5, 11, 9]  ,
        data2: [4, 10, 2, 1, 5.5, 3],
        data3: [6, 3, 2, 6, 7.5, 5],
        data4: [5, 9, 7, 4, 6.5, 8],
        x: [
          '001',
          '002',
          '003',
          '004',
          '005',
          '006',
          '007',
        ],
        indicator: [
          { max: 11, min: 1, name: '001', color: '#000000' },
          { max: 11, min: 1, name: '002', color: '#000000' },
          { max: 11, min: 1, name: '003', color: '#000000' },
          { max: 11, min: 1, name: '004', color: '#000000' },
          { max: 11, min: 1, name: '005', color: '#000000' },
          { max: 11, min: 1, name: '006', color: '#000000' },
          { max: 11, min: 1, name: '007', color: '#000000' },
        ],
      },
    };
  
    const color = payload.color
    const wordNum = payload.wordNum
  
    const indicator =
      payload.data.indicator ||
      payload.data.x.map((item: any) => ({
        name: item
      }))
    const data1 = payload.data.data1 || []
    const data2 = payload.data.data2 || []
    const data3 = payload.data.data3 || []
    const data4 = payload.data.data4 || []
  
    let reversalData1: any[] = []
    if (data1.length > 0) {
      reversalData1 = data1.map((item: any) => (11 - item + 1).toFixed(1))
    }
    let reversalData2: any[] = []
    if (data2.length > 0) {
      reversalData2 = data2.map((item: any) => (11 - item + 1).toFixed(1))
    }
    let reversalData3 = []
    if (data3.length > 0) {
      reversalData3 = data3.map((item: any) => (11 - item + 1).toFixed(1))
    }
    let reversalData4 = []
    if (data4.length > 0) {
      reversalData4 = data4.map((item: any) => (11 - item + 1).toFixed(1))
    }
  
    const position = payload.data.position || 'left'
  
    const formatter = (params: string, wordNum: number) => {
      if (!wordNum) return params
      let newParamsName = ''
      const paramsNameNumber = params.length
      const provideNumber = wordNum
      const rowNumber = Math.ceil(paramsNameNumber / provideNumber)
      if (paramsNameNumber > provideNumber) {
        for (let p = 0; p < rowNumber; p++) {
          let tempStr = ''
          const start = p * provideNumber
          const end = start + provideNumber
          if (p === rowNumber - 1) {
            tempStr = params.substring(start, paramsNameNumber)
          } else {
            tempStr = params.substring(start, end) + '\n'
          }
          newParamsName += tempStr
        }
      } else {
        newParamsName = params
      }
      return newParamsName
    }
  
    let option: any = {
      normal: {
        top: 100,
        left: 100,
        width: 700,
        height: 600,
        zIndex: 6,
        backgroundColor: 'transparent'
      },
      color: ['rgba(' + color[0] + ', 1)', 'rgba(' + color[1] + ', 1)'],
      title: {
        show: false,
        text: '基础雷达图',
        left: 'center',
        top: '1%',
        textStyle: {
          fontSize: 18,
          color: '#293C55',
          fontStyle: 'normal',
          fontWeight: 'normal'
        }
      },
      tooltip: {
        show: true,
        backgroundColor: 'rgba(9, 30, 60, 0.6)',
        extraCssText: 'box-shadow: 0 0 8px rgba(0, 128, 255, 0.27) inset;',
        borderWidth: 0,
        confine: isMobile ? true : false,  // 手机端限制在父元素内
        appendToBody: isMobile ? false : true,  // 手机端不追加到body
        textStyle: {
          color: '#fff',
          fontSize: isMobile ? 12 : 10  // 手机端字体稍大
        },
        position: isMobile ? 'inside' : position,  // 手机端使用inside定位
        formatter: (data: any) => {
          var tip = data.seriesName + '<br/>';
          let tmpData: any[] = []
          if (data.seriesIndex === 0) tmpData = data1
          else if (data.seriesIndex === 1) tmpData = data2
          else if (data.seriesIndex === 2) tmpData = data3
          else if (data.seriesIndex === 3) tmpData = data4
          data.data.forEach((item: any, index: number) => {
            tip += data.marker + ' ' + payload.data.x[index] + '：第' + tmpData[index] + '名<br/>'
          })
          return tip
        }
      },
      legend: {
        show: false  // 隐藏默认图例
      },
      radar: {
        center: ['35%', '50%'],
        radius: isMobile ? '45%' : '60%',
        startAngle: 90,
        splitNumber: 4,
        axisName: {
          fontSize: 14,
          textStyle: {
            color: '#000000'
          },
          formatter(params: any) {
            return formatter(params, wordNum)
          }
        },
        splitArea: {
          areaStyle: {
            color: ['transparent']
          }
        },
        axisLabel: {
          show: false,
          fontSize: 18,
          color: '#333',
          fontStyle: 'normal',
          fontWeight: 'normal'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#999'
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#999'
          }
        },
        indicator,
        triggerEvent: payload.id === 'center-bottom'
      },
      series: []
    }
  
    const getRadar = (title: string, color: string, data: any[]) => {
      return {
        name: title,
        type: 'radar',
        symbol: 'circle',
        symbolSize: 0.1,
        areaStyle: {
          color: 'rgba(' + color + ', 0.7)'
        },
        itemStyle: {
          color: 'rgba(' + color + ', 1)',
          borderColor: 'rgba(' + color + ', 0.7)',
          borderWidth: 6
        },
        lineStyle: {
          type: 'solid',
          color: 'rgba(' + color + ', 1)',
          width: 1
        },
        data: [data]
      }
    }
  
    if (reversalData1 && reversalData1.length > 0) {
      option.series?.push(getRadar(payload.data.legend[0], color[0], reversalData1))
    }
    if (reversalData2 && reversalData2.length > 0) {
      option.series?.push(getRadar(payload.data.legend[1], color[1], reversalData2))
    }
    if (reversalData3 && reversalData3.length > 0) {
      option.series?.push(getRadar(payload.data.legend[2], color[2], reversalData3))
    }
    if (reversalData4 && reversalData4.length > 0) {
      option.series?.push(getRadar(payload.data.legend[3], color[3], reversalData4))
    }
  
    return option
  
  }
  
  
  export function getAiAnalysesResult() {
    return {
    "gpt": {
        "qc": {
            "skill": {
                "扣分": {
                    "开场白": -10,
                    "缔结承诺": -10
                },
                "沟通评语": "销售代表在开场白中未能有效吸引医生注意力，直接进入会议邀请，未充分探索医生需求和兴趣。医生拒绝参加会议后，代表未能进行有效缔结或提供其他价值。代表可以尝试了解医生对慢性气道疾病管理的兴趣点或痛点，从而更好地对接会议内容，增加参与可能性。",
                "建议": "销售代表可以在开场白中更多地介绍自己和产品背景，引起医生兴趣。在医生拒绝参加会议时，可以询问医生对哪些方面的内容感兴趣，或提供会议记录或资料，以便后续跟进。"
            },
            "med": {
                "有效信息": [
                    "销售代表邀请医生参加慢性气道疾病全程管理的线上会议",
                    "会议主题包括慢阻肺病全程规范化管理和闭合三联疗法的会议证据",
                    "会议时间是下周二晚上七点",
                    "邀请的教授包括中南大学湘雅二医院的蔡山教授和上海瑞金医院的郭毅教授",
                    "医生表示可能没有时间参加会议"
                ],
                "用药经验": [
                    "对话中未涉及具体的用药经验"
                ],
                "对话评价": "销售代表有效地介绍了即将举行的线上会议的主题和时间，并邀请医生参加。然而，医生表示可能没有时间参与。代表还尝试通过企业微信与医生建立联系，以便日后分享更多相关信息。",
                "下次沟通建议": "建议在下次沟通时，了解医生的时间安排，寻找医生方便参与的时机。同时，可以在微信上发送会议的录播链接或相关资料，方便医生在有空时查看。此外，了解医生对慢性气道疾病管理的具体兴趣点，以便提供更有针对性的资料和会议邀请。"
            }
        }
    }
  }
}