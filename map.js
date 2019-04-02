/**
 * @description The Javascript that controls the functionality of the Map
 * @author Nihinlolamiwa Fajemilehin, Timothy Shirgba
 * @version 1.0
 */

var map;
var low;
var medium;
var high;
const requestURL = 'http://environment.data.gov.uk/flood-monitoring/id/stations';
const stationsURL = 'http://localhost:3001/api/stations';
const mqttURL = 'http://localhost:3001/api/mqtt';
const demoTestURL = 'http://localhost:3001/api/test';

var OneSignal = window.OneSignal || [];

createNotifcation("Flood Warning", "There is a flood at..");

function createNotifcation(title, message) {
  OneSignal.push(function () {
    OneSignal.init({
      appId: "53071771-a32a-41c8-a198-06fbc871a952",
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });
    OneSignal.sendSelfNotification(
      title,
      message,
      'https://example.com/?_osp=do_not_open',
      'https://onesignal.com/images/notification_logo.png', {
        notificationType: 'news-feature'
      },
      [{
          /* Buttons */
          /* Choose any unique identifier for your button. The ID of the clicked button is passed to you so you can identify which button is clicked */
          id: 'like-button',
          /* The text the button should display. Supports emojis. */
          text: 'Like',
          /* A valid publicly reachable URL to an icon. Keep this small because it's downloaded on each notification display. */
          icon: 'http://i.imgur.com/N8SN8ZS.png',
          /* The URL to open when this action button is clicked. See the sections below for special URLs that prevent opening any window. */
          url: 'https://example.com/?_osp=do_not_open'
        },
        {
          id: 'read-more-button',
          text: 'Read more',
          icon: 'http://i.imgur.com/MIxJp1L.png',
          url: 'https://example.com/?_osp=do_not_open'
        }
      ]
    );
  });
}


/**
 * Function that initialises the map and displays neccesary markers
 * on the map
 */
function initMap() {

  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 51.297500,
      lng: 1.069722
    },
    zoom: 10
  });

  // Make call to the Station URL and return result
  var requestOne = new XMLHttpRequest();
  requestOne.open('GET', stationsURL);
  // requestOne.setRequestHeader('Access-Control-Allow-Origin', 'http://localhost:3001/api/stations');
  requestOne.responseType = 'json';
  requestOne.send();

  requestOne.onload = function () {
    var myresults = requestOne.response;
    showLocation(myresults, map);
  }

  // Make call to the MQTT URL and return result
  var requestTwo = new XMLHttpRequest();
  requestTwo.open('GET', mqttURL);
  requestTwo.responseType = 'json';
  requestTwo.send();

  requestTwo.onload = function () {
    var myresults = requestTwo.response;
    getMqttValues(myresults);
  }

  var geocoder = new google.maps.Geocoder();
  document.getElementById('submit').addEventListener('click', function () {
    geocodeAddress(geocoder, map);
  });

  // Call the Flood demo simulaiton when the test demo button is clicked
  document.getElementById('demoTest').addEventListener('click', function () {
    callDemoSimulatedFlood();
  });

  // Hide all the degress of flood warnings when the map is clicked
  low = document.getElementById("lowWarnings");
  medium = document.getElementById("mediumWarnigs");
  high = document.getElementById("highWarnings");

  low.style.display = "none";
  medium.style.display = "none";
  high.style.display = "none";
}

/**
 * Function that takes in a the JSON object of all locations retrieved and displays the locations
 * as markers on the Map  
 * @param {*} jsonObj The JSON object that contains all the locations retrieved
 */
function showLocation(jsonObj, myMap) {
  var locations = jsonObj['myCollection'];
  var markers = [];

  for (var i = 0; i < locations.length; i++) {
    var latitude = locations[i].lat;
    var longitude = locations[i].long;
    var station = locations[i].label;
    var stationRef = locations[i].stationref;
    var latLng = new google.maps.LatLng(latitude, longitude);

    markers[i] = new google.maps.Marker({
      position: latLng,
      map: map,
      title: station,
    });

    markers[i].index = i;

    google.maps.event.addListener(markers[i], 'click', function () {
      console.log(locations[this.index]);

      // Retrieve Station Name and Bind to the Popup Modal
      var stationName = locations[this.index].name;
      document.getElementById("stationName").innerHTML = stationName;

      var parameterName = locations[this.index].qualifier;

      // Retrieve the station reference for the marker clicked on
      var stationReference = locations[this.index].stationref;
      var stationDetailsURL = "http://localhost:3001/api/historic?station=" + stationReference + "&number=100";

      // Retrieve Station Name and Bind to the Popup Modal
      var stationName = locations[this.index].name;
      document.getElementById("stationName").innerHTML = stationName;

      // Initialize the two graph arrays  to empty so that new values can be set on clicking a new marker
      var graphArrayValues = [];
      var graphArrayTime = [];

      // Make call to the Station historical Data URL and return historical data result
      var requestThree = new XMLHttpRequest();
      requestThree.open('GET', stationDetailsURL);
      requestThree.responseType = 'json';
      requestThree.send();

      requestThree.onload = function () {
        var myresults = requestThree.response;
        var allValues = myresults['myCollection'].items;

        for (var g = 0; g < allValues.length; g++) {
          graphArrayValues[g] = allValues[g].value;

          // console.log(Date.parse(allValues[g].dateTime));
          console.log(new Date(allValues[g].dateTime).getDate());
          graphArrayTime[g] = new Date(allValues[g].dateTime).toUTCString();
        }

        // Call the graph creation function to set up the graph with values when it is popped up
        graphCreation(graphArrayValues, graphArrayTime, parameterName);
      }

      var modal = document.getElementById('myModal');
      var span = document.getElementsByClassName("close")[0];
      // Get the <span> element that closes the modal
      var span = document.getElementsByClassName("close")[0];
      modal.style.display = "block";

      // When the user clicks on <span> (x), close the modal
      span.onclick = function () {
        modal.style.display = "none";
      }

      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      }

      map.setZoom(10);
      map.setCenter(markers[this.index].getPosition());
    });
  }
}

/**
 * Function that takes in an Mqtt JSON Object, breaks it down into an Array and determines if flood is happening 
 * in the areas, based on calculations
 * @param {*} jsonObj The object retreivd from the Mqtt Server
 */
function getMqttValues(jsonObj) {
  var mqttValues = jsonObj['myCollection'];
  for (var i = 0; i < mqttValues.length; i++) {

    var distanceSensorFromRiverBed = mqttValues[i].distance_flood_plain_from_river_bed;
    var distanceFloodPlainFromRiverBed = mqttValues[i].distance_flood_plain_from_river_bed;

    var base64Payload = mqttValues[i].payload_raw;
    var hexadecimalValue = base64toHEX(base64Payload);
    var reportedDistanceValue = parseInt(hexadecimalValue, 16);

    var depthValueOfRiver = distanceSensorFromRiverBed - reportedDistanceValue;
    var distanceFromFlooding = distanceFloodPlainFromRiverBed - depthValueOfRiver;

    if (distanceFromFlooding <= 0 || reportedDistanceValue <= (distanceSensorFromRiverBed - distanceFloodPlainFromRiverBed)) {
      console.log("Flood has happened!!");
    }
  }
}

/**
 * Function that calls the flood simulation URL
 */
function callDemoSimulatedFlood() {
  // Make call to the MQTT URL and return result
  var requestFour = new XMLHttpRequest();
  requestFour.open('GET', demoTestURL);
  requestFour.responseType = 'json';
  requestFour.send();

  requestFour.onload = function () {
    var myresults = requestFour.response;

    var retrievedDemoData = myresults['myCollection'].items[0];
    console.log(retrievedDemoData);

    if(retrievedDemoData.severityLevel == 1) {
      high.style.display = "block";
    }
    else if(retrievedDemoData.severityLevel == 2) {
      medium.style.display = "block";
    }
    else if(retrievedDemoData.severityLevel == 3) {
      low.style.display = "block";
    }
  }
}

/**
 * Function that converts a Base64 value to Hexadecimal
 * @param {*} base64 The Base64 value to be converted to Hexadecimal
 */
function base64toHEX(base64) {
  var raw = atob(base64);
  var HEX = '';
  for (i = 0; i < raw.length; i++) {
    var _hex = raw.charCodeAt(i).toString(16)
    HEX += (_hex.length == 2 ? _hex : '0' + _hex);
  }
  return HEX.toUpperCase();
}

/**
 *  Function that displays the location entered in the search box on the Map
 * @param {*} geocoder The geocoder object
 * @param {*} resultsMap The map object
 */
function geocodeAddress(geocoder, resultsMap) {
  var address = document.getElementById('address').value;
  geocoder.geocode({
    'address': address
  }, function (results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      // Uncomment to allow marker be displayed on search location
      // var marker = new google.maps.Marker({
      //   map: resultsMap,
      //   position: results[0].geometry.location
      // });
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });

  //Bind address searched to the view
  document.getElementById('placeSearched').innerHTML = address;
}

/**
 * Function that gets and displays the current time and date 
 */
window.onload = function getDate() {
  var d = new Date();
  document.getElementById('currentDate').innerHTML = d.toUTCString();
};

var clickCounter = 0;
var myChart;

/**
 * Function that creates the graph and binds the values to the graph
 * @param {*} graphValues The station flood values to be binded to the graph
 * @param {*} graphTimes The station historical flood times to be binded to the graph
 * @param {*} parameterName The value of the flood level type
 */
function graphCreation(graphValues, graphTimes, parameterName) {
  console.log(parameterName);
  clickCounter++;
  if (clickCounter > 1) {
    myChart.destroy();
  }

  // Our labels along the x-axis
  // var years = [1500, 1600, 1700, 1750, 1800, 1850, 1900, 1950, 1999, 2050];
  var years = graphTimes;
  // For drawing the lines
  var values = graphValues;

  var ctx = document.getElementById("myChart");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          data: values,
          label: parameterName,
          borderColor: "#3e95cd",
          fill: false
        }
      ]
    }
  });
}