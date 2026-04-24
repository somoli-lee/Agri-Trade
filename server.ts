import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';
import { parseStringPromise } from 'xml2js';
import dotenv from 'dotenv';

dotenv.config();

// Configure retry logic for UNIPASS
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: (retryCount) => retryCount * 2000,
  retryCondition: (error) => {
    // Retry on network errors or idempotent 5xx errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNRESET';
  }
});

// Shared robust agent
const unipassAgent = new https.Agent({ 
  keepAlive: true, // Switched to true to reduce handshake frequency
  maxSockets: 10,
  timeout: 60000,
  family: 4 // Force IPv4
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // UNIPASS: Customs Exchange Rate (관세환율) - API012
  app.get('/api/unipass/exchange-rate', async (req, res) => {
    const crkyCn = process.env.UNIPASS_EXCHANGE_RATE_KEY;
    if (!crkyCn) return res.status(400).json({ error: 'UNIPASS_EXCHANGE_RATE_KEY is missing. Please configure it in your environment variables.' });

    const fetchRateWithDate = async (targetDate: string, usePort = true) => {
      const portPart = usePort ? ':38010' : '';
      const url = `https://unipass.customs.go.kr${portPart}/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo`;
      console.log(`[UNIPASS] Fetching Rate: ${url} (Date: ${targetDate}, imexTp: 2)`);
      
      return axios.get(url, {
        params: { crkyCn, qryYymmDd: targetDate, imexTp: '2' },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Connection': 'keep-alive'
        },
        httpsAgent: unipassAgent,
        timeout: 20000,
        validateStatus: (status) => status === 200
      });
    };

    try {
      // Use KST (UTC+9) for government API
      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const dateStr = kst.toISOString().split('T')[0].replace(/-/g, '');
      
      let response;
      try {
        response = await fetchRateWithDate(dateStr, true);
      } catch (e: any) {
        if (e.response?.status === 404) response = await fetchRateWithDate(dateStr, false);
        else throw e;
      }

      const result = await parseStringPromise(response.data);
      let items = result?.trifFxrtInfoQryRtnVo?.trifFxrtInfoQryRsltVo || [];
      
      // If today (KST) is empty, check yesterday (KST)
      if (items.length === 0) {
        console.log(`[UNIPASS] No items for ${dateStr}, trying yesterday...`);
        const yesterday = new Date(kst.getTime());
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
        
        try {
          response = await fetchRateWithDate(yesterdayStr, true);
        } catch (e: any) {
          response = await fetchRateWithDate(yesterdayStr, false);
        }
        const resultYesterday = await parseStringPromise(response.data);
        items = resultYesterday?.trifFxrtInfoQryRtnVo?.trifFxrtInfoQryRsltVo || [];
      }

      const usdRate = items
        .filter((item: any) => item.currSgn?.[0] === 'USD')
        .sort((a: any, b: any) => (b.aplyBgnDt?.[0] || '').localeCompare(a.aplyBgnDt?.[0] || ''))[0];

      if (usdRate) {
        console.log(`[UNIPASS] Found Latest USD Rate: ${usdRate.fxrt?.[0]} (Date: ${usdRate.aplyBgnDt?.[0]})`);
        res.json({ 
          rate: parseFloat(usdRate.fxrt?.[0]), 
          date: usdRate.aplyBgnDt?.[0], 
          provider: 'UNIPASS' 
        });
      } else {
        console.warn(`[UNIPASS] USD rate not found in ${items.length} items`);
        res.status(404).json({ error: 'USD rate not found in UNIPASS response' });
      }
    } catch (error: any) {
      console.error('UNIPASS API012 Error:', error.message);
      res.status(500).json({ error: 'UNIPASS API Failed', details: error.message });
    }
  });

  // ... (API012 above) ...

  // UNIPASS: Tariff Rate (관세율) - API030
  app.get('/api/unipass/tariff', async (req, res) => {
    const crkyCn = process.env.UNIPASS_TARIFF_RATE_KEY;
    const { hscode } = req.query;
    if (!crkyCn) return res.status(400).json({ error: 'UNIPASS_TARIFF_RATE_KEY is missing. Please configure it.' });
    if (!hscode) return res.status(400).json({ error: 'hscode parameter is missing' });

    const fetchTariff = async (usePort = true) => {
      const portPart = usePort ? ':38010' : '';
      const url = `https://unipass.customs.go.kr${portPart}/ext/rest/trrtQry/retrieveTrrt`;
      return axios.get(url, {
        params: { crkyCn, hsSgn: hscode },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Connection': 'keep-alive'
        },
        httpsAgent: unipassAgent,
        timeout: 20000
      });
    };

    try {
      let response;
      try {
        response = await fetchTariff(true);
      } catch (e: any) {
        if (e.response?.status === 404) response = await fetchTariff(false);
        else throw e;
      }

      const result = await parseStringPromise(response.data);
      const items = result?.trrtQryRtnVo?.trrtQryRsltVo || result?.TrrtQryRtnVo?.TrrtQryRsltVo || [];
      res.json(items);
    } catch (error: any) {
      console.error('UNIPASS API030 Error:', error.message);
      res.status(500).json({ 
        error: 'UNIPASS API Failed', 
        details: error.message,
        hint: 'Please check if your UNIPASS_TARIFF_RATE_KEY is valid and not expired.'
      });
    }
  });

  // UNIPASS: HS Code Search (HS부호검색) - API018
  app.get('/api/unipass/hscode-search', async (req, res) => {
    const crkyCn = process.env.UNIPASS_HS_CODE_SEARCH_KEY;
    const { hsSgn } = req.query;
    if (!crkyCn) return res.status(400).json({ error: 'UNIPASS_HS_CODE_SEARCH_KEY is missing. Please configure it.' });
    if (!hsSgn) return res.status(400).json({ error: 'hsSgn parameter is missing' });

    const fetchHs = async (params: any, usePort = true) => {
      const portPart = usePort ? ':38010' : '';
      const url = `https://unipass.customs.go.kr${portPart}/ext/rest/hsSgnQry/searchHsSgn`;
      return axios.get(url, {
        params: { crkyCn, koenTp: '1', ...params },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Connection': 'keep-alive'
        },
        httpsAgent: unipassAgent,
        timeout: 20000
      });
    };

    try {
      let response;
      // Try searching as exact HS Code first
      try {
        response = await fetchHs({ hsSgn }, true);
      } catch (e: any) {
        if (e.response?.status === 404) response = await fetchHs({ hsSgn }, false);
        else throw e;
      }

      let result = await parseStringPromise(response.data);
      let items = result?.hsSgnSrchRtnVo?.hsSgnSrchRsltVo || [];

      // If HS Code match fails, try searching as item name (some codes might work better here if they are partial)
      if (items.length === 0) {
        console.log(`[UNIPASS] No direct HS match for ${hsSgn}, trying as name search...`);
        try {
          response = await fetchHs({ prnm: hsSgn }, true);
        } catch (e: any) {
          response = await fetchHs({ prnm: hsSgn }, false);
        }
        result = await parseStringPromise(response.data);
        items = result?.hsSgnSrchRtnVo?.hsSgnSrchRsltVo || [];
      }

      res.json(items);
    } catch (error) {
      console.error('UNIPASS API018 Error:', error);
      res.status(500).json({ error: 'UNIPASS API Failed' });
    }
  });

  // UNIPASS: HS CODE Navigation (무역통계 조회) - API043
  app.get('/api/unipass/hscode-nav', async (req, res) => {
    const crkyCn = process.env.UNIPASS_HS_NAVIGATION_KEY;
    const { hsSgn } = req.query;
    if (!crkyCn) return res.status(400).json({ error: 'UNIPASS_HS_NAVIGATION_KEY is missing. Please configure it.' });

    const fetchHsNav = async (usePort = true) => {
      const portPart = usePort ? ':38010' : '';
      const url = `https://unipass.customs.go.kr${portPart}/ext/rest/cmtrStatsQry/retrieveCmtrStats`;
      return axios.get(url, {
        params: { crkyCn, hs10Sgn: hsSgn || '' },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Connection': 'keep-alive'
        },
        httpsAgent: unipassAgent,
        timeout: 20000
      });
    };

    try {
      let response;
      try {
        response = await fetchHsNav(true);
      } catch (e: any) {
        if (e.response?.status === 404) response = await fetchHsNav(false);
        else throw e;
      }

      const result = await parseStringPromise(response.data);
      const items = result?.cmtrStatsQryRtnVo?.cmtrStatsQryRsltVo || [];
      res.json(items);
    } catch (error) {
      console.error('UNIPASS API043 Error:', error);
      res.status(500).json({ error: 'UNIPASS API Failed' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
