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

  for(var i = 0; i < locations.length; i++) {
    var latitude = locations[i].lat;
    var longitude = locations[i].long;
    var station = locations[i].label;
    var latLng = new google.maps.LatLng(latitude, longitude);

    markers[i] = new google.maps.Marker({
      position: latLng,
      map: map,
      title: station
    });

    markers[i].index = i;

    var contentString = '<div id="content">'+
            '<div id="siteNotice">'+
            '</div>'+
            '<h1 id="firstHeading" class="firstHeading">Information</h1>'+
            '<div id="bodyContent">'+
            '<p><b>Info</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
            'sandstone rock formation in the southern part of the '+
            'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
            'south west of the nearest large town, Alice Springs; 450&#160;km '+
            '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
            'features of the Uluru - Kata Tjuta National Park. Uluru is '+
            'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
            'Aboriginal people of the area. It has many springs, waterholes, '+
            'rock caves and ancient paintings. Uluru is listed as a World '+
            'Heritage Site.</p>'+
            '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
            'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
            '(last visited June 22, 2009).</p>'+
            '</div>'+
            '</div>';

    var infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    google.maps.event.addListener(markers[i], 'click', function () {
      map.setZoom(10);
      map.setCenter(markers[this.index].getPosition());

      infowindow.open(map, markers[this.index]);
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
  for(var i = 0; i < mqttValues.length; i++) {

    var distanceSensorFromRiverBed = mqttValues[i].distance_flood_plain_from_river_bed;
    var distanceFloodPlainFromRiverBed = mqttValues[i].distance_flood_plain_from_river_bed;

    var base64Payload = mqttValues[i].payload_raw;
    var hexadecimalValue =  base64toHEX(base64Payload);
    var reportedDistanceValue = parseInt(hexadecimalValue, 16);

    var depthValueOfRiver = distanceSensorFromRiverBed - reportedDistanceValue;
    var distanceFromFlooding = distanceFloodPlainFromRiverBed - depthValueOfRiver;

    if(distanceFromFlooding <= 0 || reportedDistanceValue <= (distanceSensorFromRiverBed - distanceFloodPlainFromRiverBed)) {
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
  for ( i = 0; i < raw.length; i++ ) {
    var _hex = raw.charCodeAt(i).toString(16)
    HEX += (_hex.length==2?_hex:'0'+_hex);
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

function chartThing() {
  // Get the context of the canvas element we want to select
var ctx = document.getElementById("myChart").getContext("2d");

// Instantiate a new chart using 'data' (defined below)
var myChart = new Chart(ctx).Line(data);

var data = {
  labels: ["January", "February", "March", "April", "May", "June", "July"],
  datasets: [
    {
      label: "My First dataset",
      fillColor: "rgba(220,220,220,0.2)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(220,220,220,1)",
      data: [65, 59, 80, 81, 56, 55, 40]
    },
    {
      label: "My Second dataset",
      fillColor: "rgba(151,187,205,0.2)",
      strokeColor: "rgba(151,187,205,1)",
      pointColor: "rgba(151,187,205,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(151,187,205,1)",
      data: [28, 48, 40, 19, 86, 27, 90]
    }
  ]
};

}

// chartThing();
