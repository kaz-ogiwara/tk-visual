const LAT = 35.8;
const LNG = 138.7;
let data = null;
let curIndex = 0;
let curDataType = "latest";
let curAreaType = "all";


const COLORS = [
  getRGB("#313695"),
  getRGB("#4575b4"),
  getRGB("#74add1"),
  getRGB("#abd9e9"),
  getRGB("#e0f3f8"),
  getRGB("#fee090"),
  getRGB("#fdae61"),
  getRGB("#f46d43"),
  getRGB("#d73027"),
  getRGB("#a50026")
];


const LIGHT_SETTINGS = {
  lightsPosition: [LNG + 2, LAT - 2, 2000, LNG - 2, LAT + 2, 2000],
  ambientRatio: 0.4,
  diffuseRatio: 0.6,
  specularRatio: 0.2,
  lightsStrength: [1.3, 0.4, 1.3, 0.4],
  numberOfLights: 2
};


const deckgl = new deck.DeckGL({
  mapboxApiAccessToken: 'pk.eyJ1IjoidGtwZmFkbWluIiwiYSI6ImNqbjJ2c2pkazMzcnAzcW84d3dpbjR2NmQifQ.dxPtzKHbhxypqtj7aZ9E2w',
  mapStyle: 'mapbox://styles/mapbox/dark-v9',
  longitude: LNG,
  latitude: LAT,
  zoom: 6,
  minZoom: 5,
  maxZoom: 11,
  pitch: 40,
  bearing: -10
});


function getRGB(hex) {
	hex = hex.slice(1);
	if (hex.length == 3) hex = hex.slice(0,1) + hex.slice(0,1) + hex.slice(1,2) + hex.slice(1,2) + hex.slice(2,3) + hex.slice(2,3);
	return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function(str) {
		return parseInt( str, 16 ) ;
	});
}


function addCommas(num){
  return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}


function getRateString(num){
  let str = (num * 100).toFixed(1) + "%";
  if (num < 0) {
    str = '<span class="minus">' + str + '</span>';
  } else {
    str = '<span class="plus">+' + str + '</span>';
  }
  return str;
}


function getAverageString(val, num){
  let str = ((val / num) / 10000).toFixed(1) + "<span>万円/m²</span>";
  return str;
}


function rotateViewport(direction){

  const MIN_PITCH = 0;
  const MAX_PITCH = 60;

  // Get current viewState
  let cState = deckgl.controller.props.viewState;

  // Change viewState value depending on the direction
  if (direction === "right") cState.bearing -= 9;
  if (direction === "left")  cState.bearing += 9;
  if (direction === "up")    cState.pitch   -= 6;
  if (direction === "down")  cState.pitch   += 6;

  if (cState.pitch < MIN_PITCH) cState.pitch = MIN_PITCH;
  if (cState.pitch > MAX_PITCH) cState.pitch = MAX_PITCH;

  // Update viewState
  deckgl.setProps({
    viewState: {
      longitude: cState.longitude,
      latitude: cState.latitude,
      zoom: cState.zoom,
      minZoom: cState.minZoom,
      maxZoom: cState.maxZoom,
      pitch: cState.pitch,
      bearing: cState.bearing
    }
  });
}


function getElevationScale(){
  if (curDataType === "latest") {
    return 300;
  } else {
    return 20;
  }
};


function getMinMax(d){
  let ret = {
    "latest": {
      "minStation": "",
      "maxStation": "",
      "minValue": null,
      "maxValue": null
    },
    "past": {
      "minStation": "",
      "maxStation": "",
      "minValue": null,
      "maxValue": null
    },
  };

  for(let i = 0; i < d.length; i++){
    if (curAreaType === "all" || curAreaType === d[i][2]) {
      if (d[i][3]) {
        if (ret.latest.minValue === null || ret.latest.minValue > d[i][3]) {
          ret.latest.minValue   = d[i][3];
          ret.latest.minStation = d[i][8];
        }

        if (ret.latest.maxValue === null || ret.latest.maxValue < d[i][3]) {
          ret.latest.maxValue   = d[i][3];
          ret.latest.maxStation = d[i][8];
        }
      }

      let pastvalue;
      if (curDataType === "rate18") {pastvalue = d[i][4];}
      if (curDataType === "rate09") {pastvalue = d[i][5];}
      if (curDataType === "rate99") {pastvalue = d[i][6];}
      if (curDataType === "rate89") {pastvalue = d[i][7];}

      if (pastvalue) {
        if (ret.past.minValue === null || ret.past.minValue > pastvalue) {
          ret.past.minValue   = pastvalue;
          ret.past.minStation = d[i][8];
        }

        if (ret.past.maxValue === null || ret.past.maxValue < pastvalue) {
          ret.past.maxValue   = pastvalue;
          ret.past.maxStation = d[i][8];
        }
      }
    }
  }

  return ret;
}


function getStation(station){
  let delimiter = "、";
  let ret = "";
  let pos = station.indexOf(delimiter);

  if (pos < 0) {
    ret = station;
  } else {
    let after = station.slice(pos + 1);
        if (after.slice(-1).match(/[0-9]/g)) after += "m";
    ret = station.substring(0, pos) + '<span>（' + after + '）</span>';
  }

  return ret;
}


function getStringBefore(str, target){
  let ret = "";
  let pos = str.indexOf(target);
  if (pos < 0) {
    ret = str;
  } else {
    ret = str.substring(0, pos);
  }
  return ret;
}



function getAverage(d, outputType){
  let val1 = 0;
  let val2 = 0;
  let num1 = 0;
  let num2 = 0;
  let val;
  let ret;
  let minmax = getMinMax(d);

  for(let i = 0; i < d.length; i++){
    if (curAreaType === "all" || curAreaType === d[i][2]) {
      if (d[i][3]) {
        val1 += d[i][3];
        num1 += 1;
      }

      let pastvalue;
      if (curDataType === "rate18") {pastvalue = d[i][4];}
      if (curDataType === "rate09") {pastvalue = d[i][5];}
      if (curDataType === "rate99") {pastvalue = d[i][6];}
      if (curDataType === "rate89") {pastvalue = d[i][7];}

      if (pastvalue) {
        val2 += pastvalue;
        num2 += 1;
      }
    }
  }

  // If latest price
  if (curDataType === "latest") {
    if (num1 !== 0) val = val1 / num1;

  // If not = comparison with past
  } else {
    if (num1 !== 0 && num2 !== 0) val = ((val1 / num1) / (val2 / num2)) - 1;
  }

  if (val === undefined) return null;

  // If latest
  if (curDataType === "latest") {

    // Colors: Divide by quantiles
    if (outputType === "color") {
      if (val <=  19000) ret =  1;
      if (val >=  19000) ret =  2;
      if (val >=  29600) ret =  3;
      if (val >=  41000) ret =  4;
      if (val >=  55700) ret =  5;
      if (val >=  73400) ret =  6;
      if (val >=  99200) ret =  7;
      if (val >= 137000) ret =  8;
      if (val >= 197000) ret =  9;
      if (val >= 333000) ret = 10;

    // Height: Calculate by raw value
    } else if (outputType === "elevation") {
      ret = val;

    // Tooltip
    } else if (outputType === "tooltip") {
      ret = '<tr>'
            + '<th>平均値</th>'
            + '<td>' + getAverageString(val1, num1) + '</td>'
            + '<td class="right">' + num1 + '<span>地点</span></td>'
          + '</tr>'
          + '<tr>'
            + '<th>最高値</th>'
            + '<td>' + getStation(minmax.latest.maxStation) + '</td>'
            + '<td class="right">' + getAverageString(minmax.latest.maxValue, 1)   + '</td>'
          + '</tr>'
          + '<tr>'
            + '<th>最安値</th>'
            + '<td>' + getStation(minmax.latest.minStation) + '</td>'
            + '<td class="right">' + getAverageString(minmax.latest.minValue, 1)   + '</td>'
          + '</tr>';
    }

  // If not = comparison with past
  } else {

    // Colors: Divide by quantiles
    if (outputType === "color") {
      if (val <= -0.40) ret =  1;
      if (val >= -0.30) ret =  2;
      if (val >= -0.20) ret =  3;
      if (val >= -0.10) ret =  4;
      if (val >= -0.05) ret =  5;
      if (val >=  0.00) ret =  6;
      if (val >=  0.05) ret =  7;
      if (val >=  0.10) ret =  8;
      if (val >=  0.20) ret =  9;
      if (val >=  0.30) ret = 10;

    // Height: Calculate by absolute value
    } else if (outputType === "elevation") {
      ret = Math.abs(val);

    // Tooltip
    } else if (outputType === "tooltip") {
      ret = '<tr>'
            + '<td><span>平均</span> ' + getAverageString(val1, num1) + '</td>'
            + '<td><span>平均</span> ' + getAverageString(val2, num2) + '</td>'
            + '<td>' + getRateString(val) + '</td>'
          + '</tr>'
          + '<tr>'
            + '<td>' + getStringBefore(minmax.latest.maxStation, "、") + '<span> など </span>' + num1 + '<span> 件</span></td>'
            + '<td>' + getStringBefore(minmax.past.maxStation, "、")   + '<span> など </span>' + num2 + '<span> 件</span></td>'
            + '<td></td>'
          + '</tr>';
    }
  }

  //console.log(ret, val);
  return ret;
}


// Hide tooltip
function hideTooltip(){
  let tooltip = document.getElementById("tooltip");
  tooltip.classList.remove("show");
  curIndex = -1;
}


// Show tooltip
function showTooltip({x,y,object}){
  if (object) {
    if (curIndex !== object.index) {

      // Empty table content
      let $head = $("#tooltip-head");
      let $body = $("#tooltip-body");
      $head.empty();
      $body.empty();

      // Get min/max info
      let minmax = getMinMax(object.points);

      // If latest
      if (curDataType === "latest") {

      // If past
      } else {
        let pastyear =  "";
        if (curDataType === "rate18") pastyear =  "2018";
        if (curDataType === "rate09") pastyear =  "2009";
        if (curDataType === "rate99") pastyear =  "1999";
        if (curDataType === "rate89") pastyear =  "1989";

        $head.append(
          '<tr>'
          + '<th>2019年</th>'
          + '<th>' + pastyear + '年</th>'
          + '<th>騰落率</th>'
        + '</tr>'
        );
      }

      // Table body
      $body.append(getAverage(object.points, "tooltip"));

      $("#tooltip").addClass("show");
      curIndex = object.index;
    }
  } else {
    hideTooltip();
  }
}


function renderLayer() {
  const hexagonLayer = new deck.HexagonLayer({
    id: 'heatmap',
    data,
    colorRange: COLORS,
    getColorValue: d => getAverage(d, "color"),
    elevationScale: getElevationScale(),
    getElevationValue: d => getAverage(d, "elevation"),
    extruded: true,
    getPosition: d => d,
    autoHighlight: true,
    highlightColor: [240,220,0,230],
    lightSettings: LIGHT_SETTINGS,
    opacity: 1,
    radius: 2000,
    coverage: 1,
    pickable: true,
    onHover: showTooltip,
    onClick: showTooltip,
    upperPercentile: 100
  });

  deckgl.setProps({
    layers: [hexagonLayer]
  });
}


function loadData(){
  let g = ["、20","、40"];
  d3.csv("data/data.csv", (error, response) => {
    data = response.map(function(d) {
      if (g.indexOf(String(d.station).slice(-3)) === -1) {
        return [
          Number(d.longitude),
          Number(d.latitude),
          String(d.landtype),
          Number(d.price19),
          Number(d.price18),
          Number(d.price09),
          Number(d.price99),
          Number(d.price89),
          String(d.station),
          String(d.size),
          String(d.usage)
        ];
      } else {
        return [];
      }
    });

    renderLayer();
  });
};


$(function(){

  // Load data
  loadData();

  // When a select box was changed
  $(parent.document).find("select").on("change",function(){
    if ($(this).attr("id") === "select-data") {
      curDataType = $(this).val();
    } else {
      curAreaType = $(this).val();
    }
    renderLayer();
  });

  // When a direction button on bottom-left was clicked
  $("#buttons").find("button").on("click",function(){
    let type = $(this).attr("type");
    rotateViewport(type);
  });
});
