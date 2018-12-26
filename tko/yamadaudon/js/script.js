var kMap = L.map('map').setView([35.9250076,139.6256953], 11);
var kMarkers = [];
var kShops = [];


function addCommas(num){
  return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}


function getPopupContent(shop){
  var ret =
    '<div class="name">' + shop[0] + '</div>'
  +	'<div class="address">' + shop[1] + '</div>'
  ;

  return ret;
}


L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles: <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
  maxZoom: 16,
  minZoom: 9
}).addTo(kMap);


$.ajaxSetup({
  cache: false
});


$.getJSON("data/data.json", function(data){
  kShops = data;

  $.each(data, function(i, shop){
    let name    = shop[0];
    let address = shop[1];
    let lat     = shop[2];
    let lng     = shop[3];

    kMarkers[i] = L.marker([shop[2], shop[3]], {icon: L.divIcon()})
      .addTo(kMap)
      .bindPopup(getPopupContent(shop));
  });
});


$(function(){
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

  $(document).on("click", "#button-close", function(e){
    e.stopPropagation();
    $.when(
      $("#cover").fadeIn("fast")
    ).done(function() {
      $.when(
        $("body").removeClass("fullscreen"),
        kMap.invalidateSize()
      ).done(function() {
        $("#cover").fadeOut("fast");
      });
    });
  });

  $(document).on("keydown", "#input-shops", function(e){

    // 上下ボタンを押した場合
    if (e.keyCode === 38 || e.keyCode === 40) {
      e.preventDefault();

      if ($("#shop-suggestions").find("div")) {

        var selected = $("#shop-suggestions").find("div.selected");
        if (selected) {
          selected.removeClass("selected");

          // 上キーの場合
          if (e.which === 38) {
            if (selected.prev()[0]) {
              selected.prev().addClass("selected");
            } else {
              $("#shop-suggestions").find("div:last").addClass("selected");
            }

          // 下キーの場合
          } else if (e.which === 40) {
            if (selected.next()[0]) {
              selected.next().addClass("selected");
            } else {
              $("#shop-suggestions").find("div:first").addClass("selected");
            }
          }
        }
      }

    // Enterキーを押した場合
    } else if (e.keyCode === 13){

      let index  = $("#shop-suggestions").find(".selected").attr("index");
      let string = $("#shop-suggestions").find(".selected").text();

      $("#shop-suggestions").removeClass("show");
      $("#input-shops").val(string);

      // 移動
      kMap.setView(new L.LatLng(kShops[index][2], kShops[index][3]), 13);
      kMarkers[index].openPopup();
    }
  });

  // コード・社名の入力欄が変更された時
  $(document).on("keyup focus", "#input-shops", function(e){

    let string = $(this).val();

    // コード・社名のリストが読み込み済み ＆ 文字列が１文字以上の場合
    if (kShops && $(this).val() != "") {

      // 上下キーでもEnterキーでもない場合
      if (e.keyCode !== 38 && e.keyCode !== 40 && e.keyCode !== 13) {

        $("#shop-suggestions").addClass("show");
        $("#shop-suggestions").empty();

        // companiesを検索
        let num = 0;

        $.each(kShops, function(index, kShop){
          let hit = false;

          if (kShop[0].indexOf(string) === 0) hit = true;
          if (kShop[1].indexOf(string) === 0) hit = true;

          if (hit) {
            $("#shop-suggestions").append('<div index="' + index + '">' + kShop[0] + '</div>');
            num++;
          }

          if (num >= 20) return false;
        });

        if (num === 0) $("#shop-suggestions").removeClass("show");

        $("#shop-suggestions").find("div:first").addClass("selected");
      }
    } else {
      $("#shop-suggestions").removeClass("show");
    }
  });

  // 社名入力欄からフォーカスが外れた時
  $(document).on("focusout", "#input-shops", function(e){
    $("#shop-suggestions").removeClass("show");
  });
});
