// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  ssr: true,

  nitro: {
    prerender: {
      routes: ['/', '/performance', '/unit-economics', '/mrr-nrr', '/staff', '/staff-report', '/customer', '/quarterly-balance', '/dataset-upload', '/dataset-edit', '/cs-reps', '/goals'],
    },
  },

  app: {
    head: {
      title: 'CS KPI Manager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'CS事業部 KPI統合管理ダッシュボード' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/styles/atlassian.css'],
})
