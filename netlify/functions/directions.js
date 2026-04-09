exports.handler = async (event) => {
  const { start, goal, waypoints } = JSON.parse(event.body);
  const clientId = 'nti3kkmh2c';
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const headers = {
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY': clientSecret
  };

  const 경유배열 = waypoints
    ? waypoints.split(':').map(w => w.trim()).filter(w => w && w.includes(','))
    : [];

  console.log('출발:', start);
  console.log('도착:', goal);
  console.log('경유지:', 경유배열);

  const 시도목록 = [
    { base: 'https://maps.apigw.ntruss.com',         api: 'map-direction-15', 최대: 15 },
    { base: 'https://naveropenapi.apigw.ntruss.com', api: 'map-direction-15', 최대: 15 },
    { base: 'https://maps.apigw.ntruss.com',         api: 'map-direction',    최대: 5  },
    { base: 'https://naveropenapi.apigw.ntruss.com', api: 'map-direction',    최대: 5  },
  ];

  for (const { base, api, 최대 } of 시도목록) {
    try {
      const wp = 경유배열.slice(0, 최대).join(':');
      // ⚠️ encodeURIComponent 제거 — 네이버 API는 raw 형식 필요
      let url = `${base}/${api}/v1/driving?start=${start}&goal=${goal}`;
      if (wp) url += `&waypoints=${wp}`;
      url += `&option=trafast`;

      console.log(`[${api}] URL:`, url);
      const res = await fetch(url, { headers });
      const data = await res.json();
      console.log(`[${api}] code:`, data.code, '| message:', data.message);

      if (data.code === 0 && data.route) {
        const 경로 = data.route.trafast?.[0] || data.route.traoptimal?.[0];
        console.log('summary:', JSON.stringify(경로?.summary));
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(data)
        };
      }
    } catch(e) {
      console.log(`[${api}] 오류:`, e.message);
    }
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ code: -1, message: '모든 엔드포인트 실패' })
  };
};
