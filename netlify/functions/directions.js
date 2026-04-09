exports.handler = async (event) => {
  const { start, goal, waypoints } = JSON.parse(event.body);
  const clientId = 'nti3kkmh2c';
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const headers = {
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY': clientSecret
  };

  const 경유배열 = waypoints
    ? waypoints.split('|').map(w => w.trim()).filter(w => w.includes(','))
    : [];

  console.log('경유지 수:', 경유배열.length);

  const 시도목록 = [
    { base: 'https://maps.apigw.ntruss.com',         api: 'map-direction-15', 최대: 15, 구분자: '|' },
    { base: 'https://naveropenapi.apigw.ntruss.com', api: 'map-direction-15', 최대: 15, 구분자: '|' },
    { base: 'https://maps.apigw.ntruss.com',         api: 'map-direction',    최대: 5,  구분자: ':' },
    { base: 'https://naveropenapi.apigw.ntruss.com', api: 'map-direction',    최대: 5,  구분자: ':' },
  ];

  for (const { base, api, 최대, 구분자 } of 시도목록) {
    try {
      const wp = 경유배열.slice(0, 최대).join(구분자);
      let url = `${base}/${api}/v1/driving?start=${start}&goal=${goal}`;
      if (wp) url += `&waypoints=${wp}`;
      url += `&option=trafast`;

      console.log(`[${api}] 구분자="${구분자}" 경유 ${Math.min(경유배열.length, 최대)}개`);
      const res = await fetch(url, { headers });
      const data = await res.json();

      const 반영수 = data.route?.trafast?.[0]?.summary?.waypoints?.length || 0;
      console.log(`[${api}] code=${data.code} 경유 ${반영수}개 반영`);

      if (data.code === 0 && data.route) {
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
    body: JSON.stringify({ code: -1, message: '실패' })
  };
};
