var express = require('express');
var request = require('request');
// var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended : true}));
app.use(bodyParser.json());
var city = 'Jamshedpur';
var token = process.env.FB_PAGE_ACESS_TOKEN;
var url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&APPID=${process.env.FB_APP_ID}`;

app.get('/', (req,res) => {
    request(url, (error,response,body) => {
        weather_json = JSON.parse(body);
        console.log(weather_json);
        tempFahrenheit = weather_json.main.temp;
        tempCelsius = ((tempFahrenheit - 32)/(1.8)).toFixed(2);
        const weather = {
            city:city,
            temperature:tempCelsius,
            description:weather_json.weather[0].description,
            icon:weather_json.weather[0].icon
        }
        const weather_data = {weather:weather};
        res.render('weather',weather_data);
    });

});

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.FACEBOOK_VERIFY_TOKEN) {
      res.send(req.query['hub.challenge']);
      return;
    }
    res.send('Error, wrong token');
});

app.post('/webhook/', function (req, res) {
    
    ReqBody = req.body;
    console.log(JSON.stringify(ReqBody));
    if (ReqBody.object === 'page') {
      if (ReqBody.entry) {
        ReqBody.entry.forEach( (entry) => {
          if (entry.messaging) {
            
            entry.messaging.forEach(function (messagingObject) {

              var senderId = messagingObject.sender.id;
            
              if (messagingObject.message) {
            
                if (!messagingObject.message.is_echo) {
                  //Assuming that everything sent to this bot is a city name.
            
                  var cityName = messagingObject.message.text;
                  getCityWeather(senderId, cityName);
            
                }
              } else if (messagingObject.postback) {
                console.log('Received Postback message from ' + senderId);
              }
            });
          } else {
            console.log('Error: No messaging key found');
          }
        });
      } else {
        console.log('Error: No entry key found');
      }
    } else {
      console.log('Error: Not a page object');
    }
    res.sendStatus(200);
});

function getCityWeather(senderId, cityName) {
    let restUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&APPID=aef5a3855671c034ff11ced5d0b388d5`;
    request.get(restUrl, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        let json = JSON.parse(body);
        console.log(json);
        let fahr = Math.round(json.main.temp);
        let cels = Math.round((fahr - 32) * 5/9);
        let msg = 'The current weather condition in ' + json.name + ' is ' + json.weather[0].description + ' and the temperature is ' + cels + ' °C (' + fahr + ' °F).'
        sendMessageToUser(senderId, msg);
      } else {
        let errorMessage = 'Could not find any information on city: ' + cityName + ' .';
        sendMessageToUser(senderId, errorMessage);
      }
    })
  }
  
function sendMessageToUser(senderId, message) {
    request({
      url: `https://graph.facebook.com/v2.6/me/messages`,
    //   qs:{access_token, token},
      method: 'POST',
      json: {
        recipient: {
          id: senderId
        },
        message: {
          text: message
        }
      }
    }, function (error, response, body) {
      if (error) {
        console.log('Error sending message to user: ');
        error.forEach(err =>{
            console.log(err);
        });
    
      } else if (response.body.error) {
        console.log('Error sending message to user: ' + response.body.error);
      }
    });
}

app.listen(process.env.PORT || 8000);