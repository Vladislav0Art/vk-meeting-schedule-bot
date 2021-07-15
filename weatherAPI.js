const { weatherAPI } = require('./config/keys');
const axios = require('axios');


const getForecastData = (res, time) => {
  let result = {};

  if(time === '') {
    result = {
      avgtemp: res.avgtemp_c,
      avgtemp_text: `${res.avgtemp_c}°C`,
      condition: res.condition.text
    };
  }
  else {
    result = {
      avgtemp: res.temp_c,
      avgtemp_text: `${res.temp_c}°C`,
      condition: res.condition.text
    };
  }

  return result;
};


beautifyResponse = (data, date, time) => new Promise((resolve, reject) => {
  let res = data.forecast.forecastday[0].day;

  if(date !== '' && time === '') {
    res = data.forecast.forecastday.find(obj => obj.date === date)?.day;
  }
  else if(date !== '' && time !== '') {
    const fullTime = date + ' ' + time;

    res = data.forecast.forecastday
            .find(obj => obj.date === date)?.hour
            .find(item => item.time === fullTime);
  }


  if(res) {
    const forecastData = getForecastData(res, time);
    resolve(forecastData);
  }
  else reject('Данные введены не корректно!');
});


const requestWeather = (city, date, time) => {
  const key = process.env.WEATHER_API_KEY || weatherAPI.key;
  const days = weatherAPI.days;
  const baseUrl = weatherAPI.baseUrl;

  const params = {
    key,
    days,
    q: city,
  };

  return axios.get(`${baseUrl}`, { params })
    .then(res => beautifyResponse(res.data, date, time));
};


module.exports = requestWeather;