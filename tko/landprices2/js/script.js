var kMap;
var geojsonLayers = [];
var kData;
var kMain;
var kDoneCount = 0;
var curTarget;
var curColor;
var highlightEvent;


function addCommas(num){
  return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}


function drawMap(){
  for(let i = 1; i <= 47; i++){
    addPrefecture(i);
  }
}


function setLayerColor(){
  curTarget = null;
  curColor = null;
  highlightEvent = null;

  d3.json("data/c" + $("#select-year").val() + ".json", function(error, json) {
    if (error) throw error;
    kData = json;
    geojsonLayers.forEach(function(geojsonLayer){
      geojsonLayer.setStyle(fillStyle);
    });
  });
}


function loadMain(){
  d3.json("data/main.json", function(error, json) {
    if (error) throw error;
    kMain = json;
  });
}


// When cities are tapped or mouse hovered
function highlightFeature(e){
  resetHighlight();

  var layer = e.target;

  // N03_001: 都道府県
  // N03_003: 郡、特別区、政令指定都市
  // N03_004: 市区町村
  // N03_007: 市区町村コード（5桁）

  let props  = layer.feature.properties;
  let prefName = props.N03_001;
  let cityName = "";
      if (props.N03_003 != null) cityName = cityName + " " + props.N03_003;
      if (props.N03_004 != null) cityName = cityName + " " + props.N03_004;
      cityName.slice(1);
  let cityCode = props.N03_007;

  kData.forEach(function(city){
    let dataCode = city[0];

    if (dataCode == cityCode) {
      let values = ["", "", ""];
      let prices = ["", "", ""];
      let pricep = ["", "", ""];
      let signs  = ["", "", ""];
      curColor = getValueColor(city[6]);

      for (let i = 0; i <= 2; i++) {
        if (city[i + 1] !== "") {
          values[i] = city[i + 4].toString();
            if (city[i + 4] > 0) values[i] = '+' + values[i];
            if (values[i] !== "") values[i] = values[i] + '<span>％</span>';
          pricep[i] = addCommas(city[i + 1].toString());
          signs[i]  = "";
            if (values[i].slice(0, 1) === '+') signs[i] = " plus";
            if (values[i].slice(0, 1) === '-') signs[i] = " minus";
        }
      }

      if (kMain) {
        kMain.forEach(function(mainCity){
          if (mainCity[0] == cityCode) {
            prices[0] = addCommas(mainCity[1]) + '<span>円/㎡</span>';
            prices[1] = addCommas(mainCity[2]) + '<span>円/㎡</span>';
            prices[2] = addCommas(mainCity[3]) + '<span>円/㎡</span>';
          }
        });
      }

      let html = ''
          + '<div id="title">' + prefName + " " + cityName + '</div>'
          + '<table>'
            + '<tr>'
              + '<th></th>'
              + '<th>2018年</th>'
              + '<th>' + $("#select-year").val() + '年</th>'
              + '<th></th>'
            + '</tr>'
            + '<tr>'
              + '<td>住宅地：</td>'
              + '<td class="price">' + prices[0] + '</td>'
              + '<td class="price">' + pricep[0] + '<span>円/㎡</span></td>'
              + '<td class="value' + signs[0] + '">' + values[0] + '</td>'
            + '</tr>'
            + '<tr>'
              + '<td>商業地：</td>'
              + '<td class="price">' + prices[1] + '</td>'
              + '<td class="price">' + pricep[1] + '<span>円/㎡</span></td>'
              + '<td class="value' + signs[1] + '">' + values[1] + '</td>'
            + '</tr>'
            + '<tr>'
              + '<td>全用途：</td>'
              + '<td class="price">' + prices[2] + '</td>'
              + '<td class="price">' + pricep[2] + '<span>円/㎡</span></td>'
              + '<td class="value' + signs[2] + '">' + values[2] + '</td>'
            + '</tr>'
          + '</table>'
          ;

      $("#tooltip").html(html);
      $("#tooltip").addClass("show");

      layer.setStyle({
        fillColor: '#eeee33'
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }

      curTarget = e.target;
      highlightEvent = null;
    }
  });
}


function resetHighlight(){
  if (curTarget) {
    curTarget.setStyle({
      fillColor: curColor
    });
  }
  $("#tooltip").removeClass("show");
}


function getValueColor(value){
  let color = "#aaa";
  let plus  = "#CE5A2D,#FF8455,#FF9972,#FFAE8F,#FFC3AB,#FFD7C8".split(",");
  let minus = "#1B5467,#3988A3,#529FB9,#65A6BC,#8AC6DA,#B9EDFF".split(",");

  if (value <= -40) color = minus[0];
  if (-40 <= value && value <= -30) color = minus[1];
  if (-30 <= value && value <= -20) color = minus[2];
  if (-20 <= value && value <= -10) color = minus[3];
  if (-10 <= value && value <=  -5) color = minus[4];
  if ( -5 <= value && value <=  -1) color = minus[5];
  if ( -1 <= value && value <=   1) color = "#fafafa";
  if (  1 <= value && value <=   5) color = plus[5];
  if (  5 <= value && value <=  10) color = plus[4];
  if ( 10 <= value && value <=  20) color = plus[3];
  if ( 20 <= value && value <=  30) color = plus[2];
  if ( 30 <= value && value <=  40) color = plus[1];
  if ( 40 <= value) color = plus[0];
  if (value === "") color = "#ccc";

  return color;
}


function fillStyle(feat, i){
  let mapCode = feat.properties.N03_007;
  let color = "#aaa";

  kData.forEach(function(city){
    let dataCode = city[0];
    if (dataCode == mapCode) {
      color = getValueColor(city[6]);
    }
  });

  return {
    fillColor: color
  };
}


function defaultStyle(feat, i){
  return {
    dashArray: '',
    fillColor: '#aaa',
    fillOpacity: 1,
    color: '#ccc',
    weight: 0.2
  };
}


function setHighlight(e){
  highlightEvent = e;
}


function onEachFeature(feature, layer){
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    preclick: setHighlight
  });
}


function addPrefecture(i){
  let s = i.toString();
  if (i <= 9) s = "0" + s;

  d3.json("../../assets/topojson/001/p" + s + ".topojson", function(error, json) {
    if (error) throw error;

    geojsonLayers[i - 1] = L.geoJson(topojson.feature(json, json.objects.prefecture), {
      style: defaultStyle,
      onEachFeature: onEachFeature
    });

    geojsonLayers[i - 1].addTo(kMap);

    // Uncover when all geojson layers are drawn
    kDoneCount++;
    if (kDoneCount === 47) {
      $.when(
        setLayerColor(),
        kDoneCount = 0
      ).then(function(){
        $("#map-cover").removeClass("show");
      });
    }
  });
}


$(function(){

  // When a select box was changed
  $(document).on("change", "select", function(){
    setLayerColor();
  });

  $(document).on("click", "#fullscreen", function(e){
    $.when(
      $("#cover").fadeIn("fast")
    ).done(function() {
      $.when(
        $("body").addClass("fullscreen"),
        kMap.invalidateSize()
      ).done(function() {
        $("#cover").fadeOut("fast");
      });
    });
  });

  $(document).on("click", "body", function(e){
    if (highlightEvent) {
      highlightFeature(highlightEvent);
    } else {
      resetHighlight();
    }
  });

  $(document).on("click", "#button-close", function(e){
    e.stopPropagation();
    $.when(
      $("#cover").fadeIn("fast")
    ).done(function() {
      $.when(
        $("body").removeClass("fullscreen")
      ).done(function() {
        $("#cover").fadeOut("fast");
      });
    });
  });

  // Initialize map
  kMap = new L.Map('map', {
    center: new L.LatLng(35.7, 139.7),
    maxZoom: 11,
    minZoom: 5,
    zoom: 7
  });

  drawMap();
  loadMain();
});
