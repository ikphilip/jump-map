// Set up the map
let currentWidth = document.getElementById('map').offsetWidth;
const width = 938;
const height = 620;

const projection = d3.geoMercator()
  .scale(150)
  .translate([width / 2, height / 1.41]);

const path = d3.geoPath()
  .pointRadius(2)
  .projection(projection);

const svg = d3.select("#map")
  .append("svg")
  .attr("preserveAspectRatio", "xMidYMid")
  .attr("viewBox", "0 0 " + width + " " + height)
  .attr("width", currentWidth)
  .attr("height", currentWidth * 0.65 * height / width);

/**
 * loaded()
 * 
 * Callback when JSON assets are loaded.
 * 
 * @param {array} data 
 */
function loaded(data) {
  const countries = data[0];

  // Set up countries
  svg.append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(topojson.feature(countries, countries.objects.countries).features)
    .enter()
    .append("path")
    .attr("d", path);
}

/**
 * addPoint()
 *
 * @param {string} id
 * @param {array} coordinates [lon, lat]
 * @return feature
 */
function addPoint(geojson) {
  const svg = d3.select('#map svg');

  svg.append("g")
    .data([geojson])
    .attr("id", function(d) {return d.id;})
    .attr("class", "point")
    .append("path")
    .attr("d", path);
}

/**
 * removePoint()
 * 
 * @param {*} id
 */
function removePoint(id) {
  return d3.select('#' + id).remove();
}

/**
 * transition()
 *
 * @param {*} plane The flying object
 * @param {Object} origin origin geoJSON
 * @param {Object} destination 
 */
function transition(plane, origin, destination) {
  const route = svg.append("path")
    .datum({type: "LineString", coordinates: [origin.geometry.coordinates, destination.geometry.coordinates]})
    .attr("class", "route")
    .attr("d", path);

  // The length of the route.
  const l = route.node().getTotalLength();

  const duration = 5000;

  plane.transition()
    .duration(duration)
    .attrTween("transform", delta(plane, route.node()))
    .on("end", function() {
      removePoint(origin.id);
      route.remove();
      removePoint(destination.id);
    })
    .remove();
}

/**
 * delta()
 *
 * @param {*} plane
 * @param {*} path
 */
function delta(plane, path) {
  var l = path.getTotalLength();
  var plane = plane;

  return function(i) {
    return function(t) {
      var p = path.getPointAtLength(t * l);

      var t2 = Math.min(t + 0.05, 1);
      var p2 = path.getPointAtLength(t2 * l);

      var x = p2.x - p.x;
      var y = p2.y - p.y;
      var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;

      var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.3);

      return "translate(" + p.x + "," + p.y + ") scale(" + s + ") rotate(" + r + ")";
    }
  }
}

/**
 * fly()
 * 
 * @param {*} origin 
 * @param {*} destination 
 */
function fly(origin, destination) {
  const svg = d3.select("#map svg");

  const plane = svg.append("path")
    .attr("class", "plane")
    .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z");

  addPoint(origin);
  addPoint(destination);
  transition(plane, origin, destination);

  return true;
}

function createFeaturePoint(id, coordinates) {
  return {
    id: id,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coordinates
    }
  }
}

// Load data asynchronously
let promises = ["json/countries2.topo.json"];

Promise.all(promises.map(function (file) {
  return d3.json(file)
})).then(loaded);

// Allow resize
window.addEventListener('resize', function() {
  let currentWidth = document.getElementById('map').offsetWidth;
  svg.attr("width", currentWidth)
    .attr("height", currentWidth * 0.65 * height / width);
});

/**-- WEB SOCKET --*/

// Support mixed-content environments on local dev.
let socketProtocol = 'ws'
if (window.location.href.indexOf('https') === 0) {
  socketProtocol = 'wss'
}

const socket = socketProtocol + '://' + window.location.host;

let ws;

// Connects the socket
function connect() {
  ws = new WebSocket(socket);

  ws.onopen = function () {
    // Form
    const form = document.getElementsByTagName('form');
    form[0].addEventListener('submit', function (event) {
      event.preventDefault();

      const formData = new FormData(event.target);
      if (formData.get('destination') < 0) {
        return false;
      }

      const destination = JSON.parse(formData.get('destination'));

      // Charlotte, NC
      const source = [-80.843056, 35.227222];

      const message = {
        type: 'message',
        data: [source, destination]
      }

      ws.send(JSON.stringify(message));
    });
  }

  ws.onclose = function () {
    console.log('socket connection closed');
  }

  ws.onmessage = function (event) {
    const incoming = JSON.parse(event.data);

    if (incoming.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong'
      }));
    }

    if (incoming.type === 'message') {
      const start = createFeaturePoint('start', incoming.data[0]);
      const end = createFeaturePoint('start', incoming.data[1]);
      fly(start, end);
    }
  }

  ws.onerror = function () {
    // Hide the form
    const form = document.getElementsByTagName('form');
    form[0].style = 'visibility: hidden;';

    const formSection = document.getElementById('form');
    formSection.insertAdjacentHTML('beforeend', '<span>Problem connecting to server</span>');
  }
}

try {
  connect();
} catch (e) {
  console.error('There was a problem connecting to the socket:', e.message);
}
