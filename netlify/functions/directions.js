exports.handler = async (event) => {
  const { start, goal, waypoints } = JSON.parse(event.body);

  const clientId = 'nti3kkmh2c';
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  const headers = {
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY': clientSecret
  };

  const wp15 = waypoints ? waypoints.split(':').slice(0, 15).join(':') : '';
  const wp5  = waypoints ? waypoints.split(':').slice(0, 5).join(':')  : '';

  // 시도할 엔드포인트 목록 (VPC, Classic 둘 다 시도)
  const 엔드포인트목록 = [
    {
      url: `https://maps.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}${wp15 ? '&waypoints=' + wp15 : ''}&option=trafast`,
      이름: 'VPC Directions15'
    },
    {
      url: `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}${wp5 ? '&waypoints=' + wp5 : ''}&option=trafast`,
      이름: 'VPC Directions5'
    },
    {
      url: `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}${wp15 ? '&waypoints=' + wp15 : ''}&option=trafast`,
      이름: 'Classic Directions15'
    },
    {
      url: `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}${wp5 ? '&waypoints=' + wp5 : ''}&option=trafast`,
      이름: 'Classic Directions5'
    }
  ];

  for (const 엔드포인트 of 엔드포인트목록) {
    try {
      console.log(`시도: ${엔드포인트.이름}`);
      const res = await fetch(엔드포인트.url, { headers });
      const data = await res.json();
      console.log(`응답 (${엔드포인트.이름}):`, JSON.stringify(data).substring(0, 200));

      if (data.code === 0 && data.route) {
        console.log(`성공: ${엔드포인트.이름}`);
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(data)
        };
      }
    } catch(e) {
      console.log(`오류 (${엔드포인트.이름}):`, e.message);
    }
  }

  // 모두 실패
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ code: -1, message: '모든 엔드포인트 실패' })
  };
};
