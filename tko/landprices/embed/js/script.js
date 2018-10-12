const LAT = 35.739;
const LNG = 139.732;
let data = null;
let curIndex = 0;
let curDataType = 'price';
let curAreaType = 'all';


const deckgl = new deck.DeckGL({
  mapboxApiAccessToken: 'pk.eyJ1IjoidGtwZmFkbWluIiwiYSI6ImNqbjJ2c2pkazMzcnAzcW84d3dpbjR2NmQifQ.dxPtzKHbhxypqtj7aZ9E2w',
  mapStyle: 'mapbox://styles/mapbox/dark-v9',
  longitude: LNG,
  latitude: LAT,
  zoom: 10,
  minZoom: 7,
  maxZoom: 13,
  pitch: 45,
  bearing: 20
});


const getRGB = function(hex) {
	hex = hex.slice(1);
	if (hex.length == 3) hex = hex.slice(0,1) + hex.slice(0,1) + hex.slice(1,2) + hex.slice(1,2) + hex.slice(2,3) + hex.slice(2,3);

	return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function(str) {
		return parseInt( str, 16 ) ;
	});
}


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
  lightsPosition: [LNG + 0.2, LAT - 0.02, 8000, LNG - 0.2, LAT + 0.02, 8000],
  ambientRatio: 0.4,
  diffuseRatio: 0.6,
  specularRatio: 0.2,
  lightsStrength: [0.8, 0.0, 0.8, 0.0],
  numberOfLights: 2
};


function addCommas(num){
  return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}


function renderLayer () {

  const getAverage = function(d, i){
    let ret = 0;
    for(let j = 0; j < d.length; j++){
      ret += d[j][i];
    }
    ret = ret / d.length;

    return ret;
  };

  const hideTooltip = function(){
    let tooltip = document.getElementById("tooltip");
    tooltip.classList.remove("show");
    curIndex = -1;
  };

  const showTooltip = function({x,y,object}){
    if (object) {
      if (curIndex !== object.index) {

        // Initialize tooltip content
        let tooltipPoints = document.getElementById("tooltip-points");
        tooltipPoints.innerHTML = "";

        for (let i = 0; i < object.points.length; i++) {
          let point = object.points[i];

          let tr = document.createElement("tr");
          let pi = [2,3,4,5];

          for(let i = 0; i < pi.length; i++){
            let td = document.createElement("td");
            let intxt = point[pi[i]];
            td.innerHTML = intxt;

            // If handling station
            if (pi[i] === 2) {
              if (intxt.match(/・/)) td.innerHTML = intxt.replace('・', '<span class="n">から</span>') + '<span>m</span>';
              if (intxt.match(/（近接）/)) td.innerHTML = intxt.replace('（近接）', '<span>（近接）</span>');
              if (intxt.match(/（接面）/)) td.innerHTML = intxt.replace('（接面）', '<span>（接面）</span>');
            }

            // If handling price or area size
            if (pi[i] === 3 || pi[i] === 4) {
              intxt = addCommas(intxt);
              if (pi[i] === 3 && curDataType === 'price')  intxt += "<span>万円/m²</span>";
              if (pi[i] === 3 && curDataType === 'rate')   intxt += "<span>％</span>";
              if (pi[i] === 4) intxt += "<span>m²</span>";
              td.innerHTML = intxt;
              td.classList.add("right");
            }

            tr.appendChild(td);
          }

          let tooltipPoints = document.getElementById("tooltip-points");
          tooltipPoints.appendChild(tr);
        }

        let tooltip = document.getElementById("tooltip");
        tooltip.classList.add("show");
        curIndex = object.index;
      }
    } else {
      hideTooltip();
    }
  };

  const hexagonLayer = new deck.HexagonLayer({
    id: 'heatmap',
    data,
    colorRange: COLORS,
    getColorValue: d => getAverage(d, 7),
    elevationScale: curDataType === 'latest' ? 20 : 15, // Adjust elevation by data type
    getElevationValue: d => getAverage(d, 6),
    extruded: true,
    getPosition: d => d,
    autoHighlight: true,
    highlightColor: [240,220,0,230],
    lightSettings: LIGHT_SETTINGS,
    opacity: 1,
    radius: 200,
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
  d3.csv('data/data.csv', (error, response) => {
    data = response.map(function(d) {
      if (    (curAreaType === 'all' || (d.areatype && d.areatype == curAreaType))
          &&  d.datatype == curDataType) {
        return [
          Number(d.longitude),
          Number(d.latitude),
          String(d.station),
          Number(d.value),
          String(d.area),
          String(d.purpose),
          Number(d.height),
          Number(d.color),
          Number(d.areatype),
          Number(d.datatype)
        ]
      } else {
        return [];
      }
    });
    renderLayer();
  });
};


window.addEventListener("load",function(){

	// Select boxes on the parent window
  let selectData = window.parent.document.getElementById("select-data");
  let selectArea = window.parent.document.getElementById("select-area");

  if (selectData) selectData.addEventListener("change",function(){
    curDataType = selectData.value;
    loadData();
  },false);

  if (selectArea) selectArea.addEventListener("change",function(){
    curAreaType = selectArea.value;
    loadData();
  },false);
},false);


loadData();
