var kMap = L.map('map').setView([35.679, 139.732], 10);
var kMarkers = [];


$.ajaxSetup({
  cache: false
});


L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  maxZoom: 16,
  minZoom: 6
}).addTo(kMap);


function getPopupContent(hospital){
  var type = '<div class="label t0">地域災害拠点病院</div>';
  if (hospital[0] === "基幹") type = '<div class="label t1">基幹災害拠点病院</div>';

  var ret = type
  + '<div class="name">' + hospital[1] + '</div>'
  +	'<div class="label">所在地</div>'
  +	'<div>' + hospital[3] + '</div>'
  +	'<div class="label">二次医療圏名</div>'
  +	'<div>' + hospital[4] + '</div>'
  +	'<div class="label">開設者</div>'
  +	'<div>' + hospital[2] + '</div>'
  ;
  
  return ret;
}


$.getJSON("data.json", function(data){
  Object.keys(data).forEach(function(key) {
    var pref = data[key];

    for (var i = 0; i < pref.length; i++) {
      var kType = "t0";
      if (pref[i][0] === "基幹") kType = "t1";
      kMarkers[i] = L.marker([pref[i][5], pref[i][6]], {icon: L.divIcon({className: 'location ' + kType})})
                      .addTo(kMap)
                      .bindPopup(getPopupContent(pref[i]));
    }
  });
});
