exports.handler = async (event) => {
  const { start, goal, waypoints } = JSON.parse(event.body);
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // Directions 15 (최대 15개 경유지) 먼저 시도
  let url = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  url += `&option=trafast`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret
      }
    });
    const data = await res.json();

    // Directions 15 안되면 Directions 5로 재시도 (경유지 5개로 축소)
    if (data.code !== 0) {
      const wp5 = waypoints ? waypoints.split(':').slice(0, 5).join(':') : '';
      let url5 = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;
      if (wp5) url5 += `&waypoints=${wp5}`;
      url5 += `&option=trafast`;

      const res5 = await fetch(url5, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret
        }
      });
      const data5 = await res5.json();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data5)
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
