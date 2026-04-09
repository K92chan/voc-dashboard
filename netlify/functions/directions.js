exports.handler = async (event) => {
  const { start, goal, waypoints } = JSON.parse(event.body);
  const clientId = 'nti3kkmh2c';
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const headers = {
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY': clientSecret
  };

  // 경유지 배열로 분리 (빈값 제거)
  const 경유배열 = waypoints
    ? waypoints.split(':').map(w => w.trim()).filter(w => w && w.includes(','))
    : [];

  console.log(`경유지 총 ${경유배열.length}개:`, 경유배열);

  // 시도 순서: VPC Dir15 → Classic Dir15 → VPC Dir5 → Classic Dir5
  const 시도목록 = [
    { base: 'https://maps.apigw.ntruss.com',          api: 'map-direction-15', 최대: 15 },
    { base: 'https://naveropenapi.apigw.ntruss.com',  api: 'map-direction-15', 최대: 15 },
    { base: 'https://maps.apigw.ntruss.com',          api: 'map-direction',    최대: 5  },
    { base: 'https://naveropenapi.apigw.ntruss.com',  api: 'map-direction',    최대: 5  },
  ];

  for (const { base, api, 최대 } of 시도목록) {
    try {
      const wp = 경유배열.slice(0, 최대).join(':');
      let url = `${base}/${api}/v1/driving?start=${start}&goal=${goal}`;
      if (wp) url += `&waypoints=${encodeURIComponent(wp)}`;
      url += `&option=trafast`;

      console.log(`시도: ${api} (경유 ${Math.min(경유배열.length, 최대)}개)`);
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.code === 0 && data.route) {
        console.log(`성공: ${api}`);
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            ...data,
            _meta: {
              사용경유수: Math.min(경유배열.length, 최대),
              전체경유수: 경유배열.length,
              api
            }
          })
        };
      }
      console.log(`실패 (${api}):`, data.code, data.message || data.error?.message);
    } catch(e) {
      console.log(`오류 (${api}):`, e.message);
    }
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ code: -1, message: '모든 엔드포인트 실패' })
  };
};
