import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '美股 & 期权学习笔记',
  description: '从零开始系统学习美股投资和期权交易',
  lang: 'zh-CN',
  base: '/learn-stocks/',
  themeConfig: {
    siteTitle: '📈 美股学习笔记',
    nav: [
      { text: '首页', link: '/' },
      { text: '美股基础', link: '/basics/01-what-is-us-stock' },
      { text: '期权入门', link: '/options/01-what-is-option' },
    ],
    sidebar: [
      {
        text: '📘 美股基础',
        collapsed: false,
        items: [
          { text: '1. 美股市场是什么', link: '/basics/01-what-is-us-stock' },
          { text: '2. 如何开户和入金', link: '/basics/02-open-account' },
          { text: '3. 基础交易概念', link: '/basics/03-basic-concepts' },
          { text: '4. 看懂K线和指标', link: '/basics/04-kline-and-indicators' },
          { text: '5. 如何看财报', link: '/basics/05-financial-reports' },
        ]
      },
      {
        text: '📗 选股与策略',
        collapsed: false,
        items: [
          { text: '6. 价值 vs 成长投资', link: '/strategy/06-value-vs-growth' },
          { text: '7. 行业板块分析', link: '/strategy/07-industry-analysis' },
          { text: '8. 定投与ETF', link: '/strategy/08-dca-and-etf' },
          { text: '9. 风险管理', link: '/strategy/09-risk-management' },
          { text: '10. 小资金实操指南', link: '/strategy/10-small-capital-practice' },
        ]
      },
      {
        text: '📕 期权入门',
        collapsed: false,
        items: [
          { text: '11. 期权是什么', link: '/options/01-what-is-option' },
          { text: '12. 期权合约要素', link: '/options/02-option-elements' },
          { text: '13. 希腊字母入门', link: '/options/03-greeks' },
          { text: '14. Buy Call / Buy Put', link: '/options/04-buy-call-put' },
          { text: '15. Covered Call', link: '/options/05-covered-call' },
          { text: '16. Cash-Secured Put', link: '/options/06-cash-secured-put' },
          { text: '17. 期权风险管理', link: '/options/07-risk-management' },
          { text: '18. Paper Trading实战', link: '/options/08-paper-trading' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Jovi2023/learn-stocks' }
    ],
    footer: {
      message: '仅用于学习交流，不构成投资建议',
      copyright: 'MIT License'
    }
  }
})
