// OpenAPI 3.0 spec generator for 日月星辰 KTV API
module.exports = function buildOpenApi() {
  const p = (name, desc, required = false) => ({ name, in: 'query', required, description: desc, schema: { type: 'string' } });
  const monthP = p('month', '月份 YYYY-MM');
  const startP = p('start', '起始日 YYYY-MM-DD');
  const endP = p('end', '結束日 YYYY-MM-DD');
  const noAuth = { security: [] };
  const token = { security: [{ bearerAuth: [] }] };
  const statArray = { type: 'array', items: { type: 'object', additionalProperties: true } };

  return {
    openapi: '3.0.3',
    info: {
      title: '日月星辰 KTV 管理系統 API',
      version: '1.0.0',
      description: '公開統計端點免登入（限流 120次/分鐘/IP）；CRUD 端點需 Bearer token（先 POST /auth/login 取得）。',
    },
    servers: [{ url: 'https://ktv.fakertw.com/api' }],
    tags: [
      { name: '公開統計' },
      { name: '客戶關係' },
      { name: 'CRUD(需登入)' },
      { name: '系統' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        DailySalesRow: {
          type: 'object',
          properties: {
            營業編號: { type: 'integer' },
            日期: { type: 'string', description: 'YYYY-MM-DD HH:mm' },
            幹部: { type: 'string' },
            客戶名: { type: 'string' },
            公關訂桌: { type: 'integer', nullable: true },
            現金: { type: 'number' },
            信用: { type: 'number' },
            簽帳: { type: 'number' },
            其它: { type: 'number' },
            人數: { type: 'integer' },
            備註: { type: 'string', nullable: true },
          },
        },
        LoginResult: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { type: 'object' },
          },
        },
      },
    },
    paths: {
      '/': {
        get: { tags: ['系統'], summary: 'API 目錄（JSON）', ...noAuth, responses: { 200: { description: '端點清單' } } },
      },
      '/docs': {
        get: { tags: ['系統'], summary: 'HTML 文件頁', ...noAuth, responses: { 200: { description: 'HTML' } } },
      },
      '/auth/login': {
        post: {
          tags: ['系統'], summary: '登入取得 JWT', ...noAuth,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'token', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResult' } } } }, 401: { description: '帳號或密碼錯誤' } },
        },
      },
      '/stats/months': {
        get: { tags: ['公開統計'], summary: '有資料的月份列表（新→舊）', ...noAuth, responses: { 200: { description: '["2026-10",...]', content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } } } } },
      },
      '/stats/summary': {
        get: { tags: ['公開統計'], summary: '總消費彙總', ...noAuth, parameters: [startP, endP], responses: { 200: { description: '彙總', content: { 'application/json': { schema: { type: 'object' } } } } } },
      },
      '/stats/table-usage': {
        get: { tags: ['公開統計'], summary: '自訂桌統計（按公關）', ...noAuth, parameters: [monthP, startP, endP, p('level', '等級：公關/一線/全部')], responses: { 200: { description: '幹部彙總', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/table-usage-details': {
        get: { tags: ['公開統計'], summary: '自訂桌明細', ...noAuth, parameters: [p('cadre', '幹部姓名（必需）'), monthP, startP, endP], responses: { 200: { description: '明細', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/cadre-table': {
        get: { tags: ['公開統計'], summary: '幹桌統計（按公關訂桌）', ...noAuth, parameters: [monthP, startP, endP], responses: { 200: { description: '公關彙總', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/cadre-table-details': {
        get: { tags: ['公開統計'], summary: '幹桌明細', ...noAuth, parameters: [p('gossip', '公關姓名（必需）'), monthP, startP, endP], responses: { 200: { description: '明細', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/company-table': {
        get: { tags: ['公開統計'], summary: '公司桌統計', ...noAuth, parameters: [monthP, startP, endP], responses: { 200: { description: '彙總', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/company-table-details': {
        get: { tags: ['公開統計'], summary: '公司桌明細', ...noAuth, parameters: [p('cadre', '幹部姓名（必需）'), monthP, startP, endP], responses: { 200: { description: '明細', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/cadre-performance': {
        get: { tags: ['公開統計'], summary: '幹部業績', ...noAuth, parameters: [monthP], responses: { 200: { description: '業績', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/daily-summary': {
        get: { tags: ['公開統計'], summary: '每日消費彙總', ...noAuth, parameters: [monthP, startP, endP], responses: { 200: { description: '每日彙總', content: { 'application/json': { schema: statArray } } } } },
      },
      '/stats/table-analysis': {
        get: {
          tags: ['公開統計'], summary: '訂桌分析（下滑幹部/流失客戶/建議動作，自動對照等長前期）', ...noAuth,
          parameters: [{ ...startP, required: true }, { ...endP, required: true }],
          responses: {
            200: {
              description: '警覺項目全量',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      period: { type: 'object' },
                      overview: { type: 'object' },
                      declining_cadres: statArray,
                      churned_customers: statArray,
                      top_customers: statArray,
                      monthly_trend: statArray,
                    },
                  },
                },
              },
            },
            400: { description: 'start/end 缺少' },
          },
        },
      },
      '/customer-relations': {
        get: { tags: ['客戶關係'], summary: '主客名單（一線幹部，60天內單客戶來訪3次以上）', ...noAuth, parameters: [startP, endP], responses: { 200: { description: '幹部+客戶列表', content: { 'application/json': { schema: statArray } } } } },
      },
      '/inactive-customers': {
        get: { tags: ['客戶關係'], summary: '近40天無來訪客戶', ...noAuth, responses: { 200: { description: '幹部+客戶列表', content: { 'application/json': { schema: statArray } } } } },
      },
      '/daily-sales': {
        get: { tags: ['CRUD(需登入)'], summary: '每日銷售明細（全量）', ...token, parameters: [startP, endP], responses: { 200: { description: '明細' }, 401: { description: '未授權' } } },
        post: { tags: ['CRUD(需登入)'], summary: '新增一筆', ...token, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DailySalesRow' } } } }, responses: { 200: { description: '建立成功' }, 401: { description: '未授權' } } },
      },
      '/cadres': {
        get: { tags: ['CRUD(需登入)'], summary: '幹部名單', ...token, responses: { 200: { description: '幹部' }, 401: { description: '未授權' } } },
        post: { tags: ['CRUD(需登入)'], summary: '新增幹部', ...token, responses: { 200: { description: '建立成功' }, 401: { description: '未授權' } } },
      },
      '/customers': {
        get: { tags: ['CRUD(需登入)'], summary: '客戶名單', ...token, responses: { 200: { description: '客戶' }, 401: { description: '未授權' } } },
      },
      '/gossip': {
        get: { tags: ['CRUD(需登入)'], summary: '公關名單', ...token, responses: { 200: { description: '公關' }, 401: { description: '未授權' } } },
      },
      '/brokers': {
        get: { tags: ['CRUD(需登入)'], summary: '經紀人名單', ...token, responses: { 200: { description: '經紀人' }, 401: { description: '未授權' } } },
      },
      '/settings': {
        get: { tags: ['CRUD(需登入)'], summary: '系統設定', ...token, responses: { 200: { description: '設定' }, 401: { description: '未授權' } } },
      },
    },
  };
};
