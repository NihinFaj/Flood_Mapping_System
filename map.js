/**
 * @description The Javascript that controls the functionality of the Map
 * @author Nihinlolamiwa Fajemilehin, Timothy Shirgba
 * @version 1.0
 */

var map;
const requestURL = 'http://environment.data.gov.uk/flood-monitoring/id/stations';
const stationsURL = 'http://localhost:3001/api/stations';
const mqttURL = 'http://localhost:3001/api/mqtt';

/**
 * Function that initialises the map and displays neccesary markers
 * on the map
 */
function initMap() {

  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 51.297500, lng: 1.069722 },
    zoom: 10
  });

  // Make call to the Station URL and return result
  var requestOne = new XMLHttpRequest();
  requestOne.open('GET', stationsURL);
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
    getMqttValues(myresults, map);
  }

  var geocoder = new google.maps.Geocoder();
  document.getElementById('submit').addEventListener('click', function () {
    geocodeAddress(geocoder, map);
  });
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
    console.log(stationRef);

    markers[i] = new google.maps.Marker({
      position: latLng,
      map: map,
      title: station,
    });

    markers[i].index = i;

    google.maps.event.addListener(markers[i], 'click', function () {

      console.log("This is the marker I clicked on");
      var stationReference = locations[this.index].stationref;
      var stationDetailsURL = "http://localhost:3001/api/historic?station=" + stationReference + "&number=100";
      console.log(stationReference);
      console.log(stationDetailsURL);

      // Make call to the MQTT URL and return result
      var requestThree = new XMLHttpRequest();
      requestThree.open('GET', stationDetailsURL);
      requestThree.responseType = 'json';
      requestThree.send();

      requestThree.onload = function () {
        var myresults = requestThree.response;
        var allValues = myresults['myCollection'].items;
        console.log(allValues);
        // getMqttValues(myresults, map);
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
      // document.getElementsByClassName("Location")[0].innerHTML = station;
    });
  }
}

/**
 * Function that takes in an Mqtt JSON Object, breaks it down into an Array and determines if flood is happening 
 * in the areas, based on calculations
 * @param {*} jsonObj 
 */
function getMqttValues(jsonObj) {
  var mqttValues = jsonObj['myCollection'];
  console.log(mqttValues);
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
  geocoder.geocode({ 'address': address }, function (results, status) {
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
 * Function that displays the current time and date 
 */
window.onload = function getDate() {
  var d = new Date();
  document.getElementById('currentDate').innerHTML = d.toUTCString();
};

window.onload = function chartThing() {

  // Our labels along the x-axis
  var years = [1500, 1600, 1700, 1750, 1800, 1850, 1900, 1950, 1999, 2050];
  // For drawing the lines
  var africa = [86, 114, 106, 106, 107, 111, 133, 221, 783, 2478];
  var asia = [282, 350, 411, 502, 635, 809, 947, 1402, 3700, 5267];

  var ctx = document.getElementById("myChart");

  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          data: africa,
          label: "Africa",
          borderColor: "#3e95cd",
          fill: false
        },
        {
          data: asia,
          label: "Asia",
          borderColor: "#3e95cd",
          fill: false
        }
      ]
    }
  });
}