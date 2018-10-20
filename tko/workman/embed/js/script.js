function addCommas(num){
  return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}


function getPopupContent(shop){
  var shopname = shop[0];
  if (shop[0].substr(0, 8) != "ワークマンプラス") shopname = "ワークマン " + shopname;

  var ret =
    '<div class="name">' + shopname + '</div>'
  +	'<div class="address">' + shop[1] + '</div>'
  ;

  if (shop[2] != "") {
    ret += '<div class="toopen">' + shop[2] + '</div>';
  }

  return ret;
}


var kMap = L.map('map').setView([35.679, 139.832], 10);
var kMarkers = [];

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
  maxZoom: 16,
  minZoom: 6
}).addTo(kMap);


$.ajaxSetup({
  cache: false
});


$.getJSON("data/data.json", function(data){
  $.each(data, function(i, shop){
    var kClass = "shop";
    if (shop[0].substr(0, 8) === "ワークマンプラス") kClass += " plus";

    kMarkers[i] = L.marker([shop[3], shop[4]], {icon: L.divIcon({className: kClass})})
      .addTo(kMap)
      .bindPopup(getPopupContent(shop));
  });
});
