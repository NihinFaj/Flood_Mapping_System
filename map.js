/**
 * @description The Javscript that controls the functionality of the Map
 * @author Nihinlolamiwa Fajemilehin, Timothy Shirgba
 * @version 1.0
 */

var map;
const requestURL = 'http://environment.data.gov.uk/flood-monitoring/id/stations';

/**
 * Function that initialises the map and displays neccesary markers
 * on the map
 */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.297500, lng: 1.069722},
    zoom: 8
  });

  // Make call to the URL and return result
  var request = new XMLHttpRequest();
  request.open('GET', requestURL);
  request.responseType = 'json';
  request.send();

  request.onload = function() {
    var myresults = request.response;
    showLocation(myresults);
  }

  var geocoder = new google.maps.Geocoder();
  document.getElementById('submit').addEventListener('click', function() {
    geocodeAddress(geocoder, map);
  });
}

/**
 * Function that takes in a the JSON object of all locations retrieved and displays the locations
 * as markers on the Map  
 * @param {*} jsonObj The JSON object that contains all the locations retrieved
 */
function showLocation(jsonObj) {
  var locations = jsonObj['items'];

  for(var i = 0; i < locations.length; i++) {
    var latitude = locations[i].lat;
    var longitude = locations[i].long;
    var station = locations[i].label;
    var latLng = new google.maps.LatLng(latitude,longitude);
    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: station
    });
  }
}

/**
 *  Function that displays the location entered in the search box on the Map
 * @param {*} geocoder The geocoder object
 * @param {*} resultsMap The map object
 */
function geocodeAddress(geocoder, resultsMap) {
  var address = document.getElementById('address').value;
  geocoder.geocode({'address': address}, function(results, status) {
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
}

// function getDate() { 
//  document.getElementById('currentDate').innerHTML = Date();
// };

// getDate();