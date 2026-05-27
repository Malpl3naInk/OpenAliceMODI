import type {
  TradingAccount,
  UTASummary,
  AccountInfo,
  UTAConfig,
} from '../../api/types'

export const DEMO_UTA_ID = 'demo-uta'

export const demoTradingAccount: TradingAccount = {
  id: DEMO_UTA_ID,
  provider: 'mock',
  label: 'Demo Paper Account',
}

export const demoUTASummary: UTASummary = {
  id: DEMO_UTA_ID,
  label: 'Demo Paper Account',
  capabilities: {
    supportedSecTypes: ['STK', 'CRYPTO'],
    supportedOrderTypes: ['MKT', 'LMT'],
  },
  health: {
    status: 'healthy',
    consecutiveFailures: 0,
    lastSuccessAt: new Date().toISOString(),
    recovering: false,
    disabled: false,
  },
}

export const demoAccountInfo: AccountInfo = {
  baseCurrency: 'USD',
  netLiquidation: '10000.00',
  totalCashValue: '10000.00',
  unrealizedPnL: '0.00',
  realizedPnL: '0.00',
  buyingPower: '10000.00',
}

export const demoUTAConfig: UTAConfig = {
  id: DEMO_UTA_ID,
  label: 'Demo Paper Account',
  presetId: 'mock',
  enabled: true,
  guards: [],
  presetConfig: {},
}
