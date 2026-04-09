exports.handler = async (event) => {
  const { start, goal, waypoints } = JSON.parse(event.body);

  const clientId = 'nti3kkmh2c';
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  const headers = {
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY': clientSecret
  };

  // Directions 15 시도 (최대 15개 경유지)
  const wp = waypoints ? waypoints.split(':').slice(0, 15).join(':') : '';
  let url15 = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}`;
  if (wp) url15 += `&waypoints=${wp}`;
  url15 += `&option=trafast`;

  try {
    const res15 = await fetch(url15, { headers });
    const data15 = await res15.json();

    // 성공 (code:0 이고 route 있음)
    if (data15.code === 0 && data15.route) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data15)
      };
    }

    // Directions 15 실패 → Directions 5로 재시도 (최대 5개 경유지)
    console.log('Directions15 실패:', JSON.stringify(data15));
    const wp5 = waypoints ? waypoints.split(':').slice(0, 5).join(':') : '';
    let url5 = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;
    if (wp5) url5 += `&waypoints=${wp5}`;
    url5 += `&option=trafast`;

    const res5 = await fetch(url5, { headers });
    const data5 = await res5.json();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data5)
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
